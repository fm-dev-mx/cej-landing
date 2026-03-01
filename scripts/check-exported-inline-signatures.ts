 
import fs from 'fs';
import path from 'path';
import ts from 'typescript';

type OutputFormat = 'json' | 'text';

interface CliArgs {
  fail: boolean;
  format: OutputFormat;
  out?: string;
}

interface AllowlistEntry {
  path: string;
  symbol?: string;
  reason: string;
}

interface Violation {
  code: 'INLINE_EXPORTED_PARAM' | 'INLINE_EXPORTED_RETURN';
  file: string;
  line: number;
  symbol?: string;
  message: string;
}

interface Result {
  summary: {
    scanned_files: number;
    allowlist_entries: number;
    ignored_violations: number;
  };
  counts: {
    inline_exported_signature_count: number;
  };
  violations: Violation[];
}

const ROOTS = ['app', 'lib', 'components', 'store'];

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

function normalizePath(filePath: string): string {
  return filePath.replace(/\\/g, '/');
}

function shouldScanFile(relativePath: string): boolean {
  if (!/\.(ts|tsx)$/.test(relativePath)) return false;
  if (/\.d\.ts$/.test(relativePath)) return false;
  if (/\.test\.(ts|tsx)$/.test(relativePath)) return false;
  if (relativePath.includes('/__tests__/')) return false;
  if (relativePath.startsWith('.next/')) return false;
  if (relativePath.startsWith('coverage/')) return false;
  if (relativePath.startsWith('test-results/')) return false;
  if (relativePath.startsWith('playwright-report/')) return false;
  return true;
}

function walkFiles(dirPath: string, repoRoot: string, out: string[]): void {
  if (!fs.existsSync(dirPath)) return;
  const entries = fs.readdirSync(dirPath, { withFileTypes: true });
  for (const entry of entries) {
    const full = path.join(dirPath, entry.name);
    if (entry.isDirectory()) {
      walkFiles(full, repoRoot, out);
      continue;
    }

    const rel = normalizePath(path.relative(repoRoot, full));
    if (shouldScanFile(rel)) {
      out.push(rel);
    }
  }
}

function loadAllowlist(repoRoot: string): AllowlistEntry[] {
  const allowlistPath = path.join(repoRoot, '.governance', 'inline-types.allowlist.json');
  if (!fs.existsSync(allowlistPath)) {
    return [];
  }

  const raw = fs.readFileSync(allowlistPath, 'utf-8');
  const parsed = JSON.parse(raw) as { entries?: AllowlistEntry[] };
  if (!parsed.entries || !Array.isArray(parsed.entries)) {
    return [];
  }

  return parsed.entries
    .filter((entry) => typeof entry.path === 'string' && typeof entry.reason === 'string')
    .map((entry) => ({
      path: normalizePath(entry.path),
      symbol: entry.symbol,
      reason: entry.reason,
    }));
}

function isAllowed(allowlist: AllowlistEntry[], file: string, symbol?: string): boolean {
  return allowlist.some((entry) => {
    if (entry.path !== file) return false;
    if (!entry.symbol) return true;
    return entry.symbol === symbol;
  });
}

function hasExportModifier(node: ts.Node): boolean {
  const modifiers = (node as ts.HasModifiers).modifiers;
  if (!modifiers) return false;
  return modifiers.some((mod) => mod.kind === ts.SyntaxKind.ExportKeyword);
}

function collectViolationsForFile(repoRoot: string, relativePath: string): Violation[] {
  const fullPath = path.join(repoRoot, relativePath);
  const source = fs.readFileSync(fullPath, 'utf-8');
  const sourceFile = ts.createSourceFile(relativePath, source, ts.ScriptTarget.Latest, true, relativePath.endsWith('.tsx') ? ts.ScriptKind.TSX : ts.ScriptKind.TS);
  const violations: Violation[] = [];

  const pushViolation = (code: Violation['code'], node: ts.Node, symbol: string | undefined, message: string) => {
    const line = sourceFile.getLineAndCharacterOfPosition(node.getStart(sourceFile)).line + 1;
    violations.push({ code, file: relativePath, line, symbol, message });
  };

  const inspectSignature = (symbol: string | undefined, params: readonly ts.ParameterDeclaration[], type: ts.TypeNode | undefined) => {
    for (const param of params) {
      if (param.type && ts.isTypeLiteralNode(param.type)) {
        pushViolation('INLINE_EXPORTED_PARAM', param, symbol, 'Exported signature uses inline object type for parameter.');
      }
    }

    if (type && ts.isTypeLiteralNode(type)) {
      pushViolation('INLINE_EXPORTED_RETURN', type, symbol, 'Exported signature uses inline object type for return type.');
    }
  };

  const visit = (node: ts.Node) => {
    if (ts.isFunctionDeclaration(node) && hasExportModifier(node)) {
      const symbol = node.name?.text;
      inspectSignature(symbol, node.parameters, node.type);
    }

    if (ts.isVariableStatement(node) && hasExportModifier(node)) {
      for (const declaration of node.declarationList.declarations) {
        if (!ts.isIdentifier(declaration.name)) continue;
        const symbol = declaration.name.text;
        const initializer = declaration.initializer;
        if (!initializer) continue;

        if (ts.isArrowFunction(initializer) || ts.isFunctionExpression(initializer)) {
          inspectSignature(symbol, initializer.parameters, initializer.type);
        }
      }
    }

    if (ts.isExportAssignment(node) && ts.isArrowFunction(node.expression)) {
      inspectSignature('default', node.expression.parameters, node.expression.type);
    }

    ts.forEachChild(node, visit);
  };

  visit(sourceFile);
  return violations;
}

function sortViolations(violations: Violation[]): Violation[] {
  return [...violations].sort((a, b) => {
    const ak = `${a.file}|${a.line.toString().padStart(8, '0')}|${a.code}|${a.symbol ?? ''}`;
    const bk = `${b.file}|${b.line.toString().padStart(8, '0')}|${b.code}|${b.symbol ?? ''}`;
    return ak.localeCompare(bk);
  });
}

function buildResult(repoRoot: string): Result {
  const files: string[] = [];
  for (const root of ROOTS) {
    walkFiles(path.join(repoRoot, root), repoRoot, files);
  }

  files.sort();
  const allowlist = loadAllowlist(repoRoot);

  const rawViolations: Violation[] = [];
  for (const file of files) {
    rawViolations.push(...collectViolationsForFile(repoRoot, file));
  }

  let ignored = 0;
  const kept = rawViolations.filter((violation) => {
    const allowed = isAllowed(allowlist, violation.file, violation.symbol);
    if (allowed) {
      ignored += 1;
      return false;
    }
    return true;
  });

  const sorted = sortViolations(kept);

  return {
    summary: {
      scanned_files: files.length,
      allowlist_entries: allowlist.length,
      ignored_violations: ignored,
    },
    counts: {
      inline_exported_signature_count: sorted.length,
    },
    violations: sorted,
  };
}

function renderText(result: Result): string {
  const lines: string[] = [];
  lines.push('Inline Exported Signature Report');
  lines.push(`- scanned_files: ${result.summary.scanned_files}`);
  lines.push(`- allowlist_entries: ${result.summary.allowlist_entries}`);
  lines.push(`- ignored_violations: ${result.summary.ignored_violations}`);
  lines.push(`- inline_exported_signature_count: ${result.counts.inline_exported_signature_count}`);

  if (result.violations.length) {
    lines.push('Violations:');
    for (const violation of result.violations) {
      const symbol = violation.symbol ? ` symbol=${violation.symbol}` : '';
      lines.push(`- [${violation.code}] ${violation.file}:${violation.line}${symbol} ${violation.message}`);
    }
  }

  return lines.join('\n');
}

function writeOut(outPath: string, payload: Result): void {
  const fullPath = path.resolve(outPath);
  fs.mkdirSync(path.dirname(fullPath), { recursive: true });
  fs.writeFileSync(fullPath, `${JSON.stringify(payload, null, 2)}\n`, 'utf-8');
}

const args = parseArgs(process.argv.slice(2));
const repoRoot = process.cwd();
const result = buildResult(repoRoot);

if (args.out) {
  writeOut(args.out, result);
}

if (args.format === 'json') {
  process.stdout.write(`${JSON.stringify(result, null, 2)}\n`);
} else {
  process.stdout.write(`${renderText(result)}\n`);
}

if (args.fail && result.counts.inline_exported_signature_count > 0) {
  process.exit(1);
}
