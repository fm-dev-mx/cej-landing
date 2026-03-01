 
/**
 * FK-only DB drift checker.
 *
 * Limitations (intentional for P0):
 * - This is not a full SQL parser.
 * - It only extracts FKs from:
 *   1) CREATE TABLE ... REFERENCES ... (inline column references)
 *   2) ALTER TABLE ... ADD CONSTRAINT ... FOREIGN KEY (...) REFERENCES ...
 * - It ignores all non-FK SQL statements for drift purposes.
 */
import fs from 'fs';
import path from 'path';
import ts from 'typescript';

type OutputFormat = 'json' | 'text';

interface CliArgs {
  fail: boolean;
  format: OutputFormat;
  out?: string;
}

interface FkIdentity {
  table: string;
  columns: string[];
  referencedRelation: string;
  referencedColumns: string[];
}

interface FkRecord extends FkIdentity {
  source: 'sql' | 'ts';
  file: string;
  line: number;
  foreignKeyName?: string;
}

interface Violation {
  code: 'DB_FK_MISSING' | 'DB_FK_EXTRA';
  table: string;
  columns: string[];
  referencedRelation: string;
  referencedColumns: string[];
  file: string;
  line: number;
  metadata?: {
    foreignKeyName?: string;
  };
}

interface DriftResult {
  summary: {
    sql_fk_count: number;
    ts_fk_count: number;
    missing_fk_count: number;
    extra_fk_count: number;
  };
  counts: {
    db_fk_drift_count: number;
  };
  violations: Violation[];
}

function parseArgs(argv: string[]): CliArgs {
  let fail = false;
  let format: OutputFormat = 'text';
  let out: string | undefined;

  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];
    if (arg === '--fail') {
      fail = true;
      continue;
    }
    if (arg === '--format') {
      const next = argv[i + 1];
      if (next === 'json' || next === 'text') {
        format = next;
        i += 1;
      }
      continue;
    }
    if (arg === '--out') {
      const next = argv[i + 1];
      if (next) {
        out = next;
        i += 1;
      }
    }
  }

  return { fail, format, out };
}

function normalizeIdentifier(raw: string): string {
  const trimmed = raw.trim().replace(/^"|"$/g, '');
  if (!trimmed.includes('.')) {
    return trimmed.toLowerCase();
  }

  const parts = trimmed.split('.').map((part) => part.trim().replace(/^"|"$/g, '').toLowerCase());
  const tablePart = parts[parts.length - 1];
  return tablePart;
}

function normalizeColumnList(raw: string): string[] {
  return raw
    .split(',')
    .map((item) => normalizeIdentifier(item))
    .filter(Boolean);
}

function getLineNumber(content: string, index: number): number {
  let line = 1;
  for (let i = 0; i < index; i += 1) {
    if (content.charCodeAt(i) === 10) {
      line += 1;
    }
  }
  return line;
}

function fkKey(fk: FkIdentity): string {
  return `${fk.table}|${fk.columns.join(',')}|${fk.referencedRelation}|${fk.referencedColumns.join(',')}`;
}

function extractSqlFks(sqlContent: string, sqlPath: string): FkRecord[] {
  const records: FkRecord[] = [];

  const createTableRegex = /CREATE\s+TABLE\s+([\w."]+)\s*\(([\s\S]*?)\);/gim;
  let createMatch: RegExpExecArray | null;
  while ((createMatch = createTableRegex.exec(sqlContent)) !== null) {
    const tableRaw = createMatch[1];
    const table = normalizeIdentifier(tableRaw);
    const block = createMatch[2];
    const blockStart = createMatch.index;

    const inlineRefRegex = /^\s*"?([\w]+)"?\s+[^,\n]*?\bREFERENCES\s+([\w."]+)(?:\s*\(([^)]+)\))?/gim;
    let inlineMatch: RegExpExecArray | null;
    while ((inlineMatch = inlineRefRegex.exec(block)) !== null) {
      const column = normalizeIdentifier(inlineMatch[1]);
      const referencedRelation = normalizeIdentifier(inlineMatch[2]);
      const referencedColumns = inlineMatch[3] ? normalizeColumnList(inlineMatch[3]) : ['id'];
      const absoluteIndex = blockStart + inlineMatch.index;

      records.push({
        source: 'sql',
        file: sqlPath,
        line: getLineNumber(sqlContent, absoluteIndex),
        table,
        columns: [column],
        referencedRelation,
        referencedColumns,
      });
    }
  }

  const alterFkRegex = /ALTER\s+TABLE\s+([\w."]+)\s+ADD\s+CONSTRAINT\s+"?([\w]+)"?\s+FOREIGN\s+KEY\s*\(([^)]+)\)\s+REFERENCES\s+([\w."]+)(?:\s*\(([^)]+)\))?/gim;
  let alterMatch: RegExpExecArray | null;
  while ((alterMatch = alterFkRegex.exec(sqlContent)) !== null) {
    const table = normalizeIdentifier(alterMatch[1]);
    const foreignKeyName = alterMatch[2];
    const columns = normalizeColumnList(alterMatch[3]);
    const referencedRelation = normalizeIdentifier(alterMatch[4]);
    const referencedColumns = alterMatch[5] ? normalizeColumnList(alterMatch[5]) : ['id'];

    records.push({
      source: 'sql',
      file: sqlPath,
      line: getLineNumber(sqlContent, alterMatch.index),
      table,
      columns,
      referencedRelation,
      referencedColumns,
      foreignKeyName,
    });
  }

  return records;
}

function extractStringTuple(typeNode: ts.TypeNode | undefined): string[] {
  if (!typeNode || !ts.isTupleTypeNode(typeNode)) {
    return [];
  }

  const values: string[] = [];
  for (const element of typeNode.elements) {
    if (ts.isLiteralTypeNode(element) && ts.isStringLiteral(element.literal)) {
      values.push(element.literal.text.toLowerCase());
    }
  }
  return values;
}

function extractStringLiteral(typeNode: ts.TypeNode | undefined): string | undefined {
  if (!typeNode || !ts.isLiteralTypeNode(typeNode) || !ts.isStringLiteral(typeNode.literal)) {
    return undefined;
  }
  return typeNode.literal.text;
}

function extractTsFks(tsContent: string, filePath: string): FkRecord[] {
  const sourceFile = ts.createSourceFile(filePath, tsContent, ts.ScriptTarget.Latest, true, ts.ScriptKind.TS);
  const fks: FkRecord[] = [];

  const getTypeLiteralFromProperty = (typeNode: ts.TypeNode | undefined, propertyName: string): ts.TypeLiteralNode | undefined => {
    if (!typeNode || !ts.isTypeLiteralNode(typeNode)) {
      return undefined;
    }

    const prop = typeNode.members.find((member) => {
      if (!ts.isPropertySignature(member) || !member.name) {
        return false;
      }
      return ts.isIdentifier(member.name) && member.name.text === propertyName;
    });

    if (!prop || !ts.isPropertySignature(prop)) {
      return undefined;
    }

    if (!prop.type || !ts.isTypeLiteralNode(prop.type)) {
      return undefined;
    }

    return prop.type;
  };

  const databaseAlias = sourceFile.statements.find((statement) => {
    return ts.isTypeAliasDeclaration(statement) && statement.name.text === 'Database';
  }) as ts.TypeAliasDeclaration | undefined;

  if (!databaseAlias || !ts.isTypeLiteralNode(databaseAlias.type)) {
    return fks;
  }

  const publicType = getTypeLiteralFromProperty(databaseAlias.type, 'public');
  const tablesType = getTypeLiteralFromProperty(publicType, 'Tables');
  if (!tablesType) {
    return fks;
  }

  for (const tableMember of tablesType.members) {
    if (!ts.isPropertySignature(tableMember) || !tableMember.name || !tableMember.type) {
      continue;
    }
    if (!ts.isIdentifier(tableMember.name) || !ts.isTypeLiteralNode(tableMember.type)) {
      continue;
    }

    const table = tableMember.name.text.toLowerCase();
    const relationshipsProp = tableMember.type.members.find((member) => {
      return ts.isPropertySignature(member)
        && !!member.name
        && ts.isIdentifier(member.name)
        && member.name.text === 'Relationships';
    }) as ts.PropertySignature | undefined;

    if (!relationshipsProp || !relationshipsProp.type || !ts.isTupleTypeNode(relationshipsProp.type)) {
      continue;
    }

    for (const element of relationshipsProp.type.elements) {
      if (!ts.isTypeLiteralNode(element)) {
        continue;
      }

      const pickProp = (name: string): ts.TypeNode | undefined => {
        const prop = element.members.find((member) => {
          return ts.isPropertySignature(member)
            && !!member.name
            && ts.isIdentifier(member.name)
            && member.name.text === name;
        }) as ts.PropertySignature | undefined;

        return prop?.type;
      };

      const columns = extractStringTuple(pickProp('columns'));
      const referencedColumns = extractStringTuple(pickProp('referencedColumns'));
      const referencedRelation = extractStringLiteral(pickProp('referencedRelation'))?.toLowerCase();
      const foreignKeyName = extractStringLiteral(pickProp('foreignKeyName'));

      if (!columns.length || !referencedColumns.length || !referencedRelation) {
        continue;
      }

      const line = sourceFile.getLineAndCharacterOfPosition(element.getStart(sourceFile)).line + 1;
      fks.push({
        source: 'ts',
        file: filePath,
        line,
        table,
        columns,
        referencedRelation,
        referencedColumns,
        foreignKeyName,
      });
    }
  }

  return fks;
}

function sortFkViolations(violations: Violation[]): Violation[] {
  return [...violations].sort((a, b) => {
    const ak = `${a.table}|${a.columns.join(',')}|${a.referencedRelation}|${a.referencedColumns.join(',')}`;
    const bk = `${b.table}|${b.columns.join(',')}|${b.referencedRelation}|${b.referencedColumns.join(',')}`;
    return ak.localeCompare(bk);
  });
}

function buildResult(sqlFks: FkRecord[], tsFks: FkRecord[]): DriftResult {
  const sqlMap = new Map<string, FkRecord>();
  const tsMap = new Map<string, FkRecord>();

  for (const fk of sqlFks) {
    sqlMap.set(fkKey(fk), fk);
  }
  for (const fk of tsFks) {
    tsMap.set(fkKey(fk), fk);
  }

  const violations: Violation[] = [];

  for (const [key, sqlFk] of sqlMap.entries()) {
    if (!tsMap.has(key)) {
      violations.push({
        code: 'DB_FK_MISSING',
        table: sqlFk.table,
        columns: [...sqlFk.columns],
        referencedRelation: sqlFk.referencedRelation,
        referencedColumns: [...sqlFk.referencedColumns],
        file: sqlFk.file,
        line: sqlFk.line,
        metadata: sqlFk.foreignKeyName ? { foreignKeyName: sqlFk.foreignKeyName } : undefined,
      });
    }
  }

  for (const [key, tsFk] of tsMap.entries()) {
    if (!sqlMap.has(key)) {
      violations.push({
        code: 'DB_FK_EXTRA',
        table: tsFk.table,
        columns: [...tsFk.columns],
        referencedRelation: tsFk.referencedRelation,
        referencedColumns: [...tsFk.referencedColumns],
        file: tsFk.file,
        line: tsFk.line,
        metadata: tsFk.foreignKeyName ? { foreignKeyName: tsFk.foreignKeyName } : undefined,
      });
    }
  }

  const sorted = sortFkViolations(violations);

  return {
    summary: {
      sql_fk_count: sqlMap.size,
      ts_fk_count: tsMap.size,
      missing_fk_count: sorted.filter((item) => item.code === 'DB_FK_MISSING').length,
      extra_fk_count: sorted.filter((item) => item.code === 'DB_FK_EXTRA').length,
    },
    counts: {
      db_fk_drift_count: sorted.length,
    },
    violations: sorted,
  };
}

function renderText(result: DriftResult): string {
  const lines: string[] = [];
  lines.push('FK Drift Report');
  lines.push(`- sql_fk_count: ${result.summary.sql_fk_count}`);
  lines.push(`- ts_fk_count: ${result.summary.ts_fk_count}`);
  lines.push(`- missing_fk_count: ${result.summary.missing_fk_count}`);
  lines.push(`- extra_fk_count: ${result.summary.extra_fk_count}`);
  lines.push(`- db_fk_drift_count: ${result.counts.db_fk_drift_count}`);

  if (result.violations.length) {
    lines.push('Violations:');
    for (const violation of result.violations) {
      const cols = violation.columns.join(',');
      const refCols = violation.referencedColumns.join(',');
      const fkName = violation.metadata?.foreignKeyName ? ` fk=${violation.metadata.foreignKeyName}` : '';
      lines.push(
        `- [${violation.code}] ${violation.table}(${cols}) -> ${violation.referencedRelation}(${refCols}) @ ${violation.file}:${violation.line}${fkName}`
      );
    }
  }

  return lines.join('\n');
}

function writeOut(outPath: string, payload: DriftResult): void {
  const fullPath = path.resolve(outPath);
  fs.mkdirSync(path.dirname(fullPath), { recursive: true });
  fs.writeFileSync(fullPath, `${JSON.stringify(payload, null, 2)}\n`, 'utf-8');
}

const args = parseArgs(process.argv.slice(2));
const sqlPath = path.resolve('docs/schema.sql');
const tsPath = path.resolve('types/database.ts');

const sqlContent = fs.readFileSync(sqlPath, 'utf-8');
const tsContent = fs.readFileSync(tsPath, 'utf-8');

const sqlFks = extractSqlFks(sqlContent, 'docs/schema.sql');
const tsFks = extractTsFks(tsContent, 'types/database.ts');
const result = buildResult(sqlFks, tsFks);

if (args.out) {
  writeOut(args.out, result);
}

if (args.format === 'json') {
  process.stdout.write(`${JSON.stringify(result, null, 2)}\n`);
} else {
  process.stdout.write(`${renderText(result)}\n`);
}

if (args.fail && result.counts.db_fk_drift_count > 0) {
  process.exit(1);
}
