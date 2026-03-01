 
import fs from 'fs';
import path from 'path';
import ts from 'typescript';

type OutputFormat = 'json' | 'text';

interface CliArgs {
  fail: boolean;
  format: OutputFormat;
  out?: string;
}

interface Violation {
  code: 'AS_ANY' | 'TYPED_ANY' | 'ARRAY_ANY';
  file: string;
  line: number;
  symbol?: string;
  message: string;
}

interface Result {
  summary: {
    scanned_files: number;
  };
  counts: {
    as_any_count: number;
    typed_any_count: number;
    array_any_count: number;
    production_any_count: number;
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

function getSymbolName(node: ts.Node): string | undefined {
  let current: ts.Node | undefined = node;
  while (current) {
    if (ts.isFunctionDeclaration(current) && current.name) {
      return current.name.text;
    }
    if (ts.isMethodDeclaration(current) && ts.isIdentifier(current.name)) {
      return current.name.text;
    }
    if (ts.isVariableDeclaration(current) && ts.isIdentifier(current.name)) {
      return current.name.text;
    }
    current = current.parent;
  }
  return undefined;
}

function collectViolationsForFile(repoRoot: string, relativePath: string): Violation[] {
  const fullPath = path.join(repoRoot, relativePath);
  const source = fs.readFileSync(fullPath, 'utf-8');
  const sourceFile = ts.createSourceFile(relativePath, source, ts.ScriptTarget.Latest, true, relativePath.endsWith('.tsx') ? ts.ScriptKind.TSX : ts.ScriptKind.TS);
  const violations: Violation[] = [];

  const addViolation = (code: Violation['code'], node: ts.Node, message: string) => {
    const line = sourceFile.getLineAndCharacterOfPosition(node.getStart(sourceFile)).line + 1;
    violations.push({
      code,
      file: relativePath,
      line,
      symbol: getSymbolName(node),
      message,
    });
  };

  const visit = (node: ts.Node) => {
    if (ts.isAsExpression(node) && node.type.kind === ts.SyntaxKind.AnyKeyword) {
      addViolation('AS_ANY', node, 'Found "as any" assertion in production layer.');
    }

    if (ts.isParameter(node) || ts.isPropertySignature(node) || ts.isPropertyDeclaration(node) || ts.isVariableDeclaration(node)) {
      const typeNode = node.type;
      if (typeNode?.kind === ts.SyntaxKind.AnyKeyword) {
        addViolation('TYPED_ANY', typeNode, 'Found explicit ": any" annotation in production layer.');
      }
      if (typeNode && ts.isArrayTypeNode(typeNode) && typeNode.elementType.kind === ts.SyntaxKind.AnyKeyword) {
        addViolation('ARRAY_ANY', typeNode, 'Found "any[]" annotation in production layer.');
      }
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

  const allViolations: Violation[] = [];
  for (const file of files) {
    allViolations.push(...collectViolationsForFile(repoRoot, file));
  }

  const sorted = sortViolations(allViolations);

  const asAnyCount = sorted.filter((v) => v.code === 'AS_ANY').length;
  const typedAnyCount = sorted.filter((v) => v.code === 'TYPED_ANY').length;
  const arrayAnyCount = sorted.filter((v) => v.code === 'ARRAY_ANY').length;

  return {
    summary: {
      scanned_files: files.length,
    },
    counts: {
      as_any_count: asAnyCount,
      typed_any_count: typedAnyCount,
      array_any_count: arrayAnyCount,
      production_any_count: asAnyCount + typedAnyCount + arrayAnyCount,
    },
    violations: sorted,
  };
}

function renderText(result: Result): string {
  const lines: string[] = [];
  lines.push('Production Any Report');
  lines.push(`- scanned_files: ${result.summary.scanned_files}`);
  lines.push(`- as_any_count: ${result.counts.as_any_count}`);
  lines.push(`- typed_any_count: ${result.counts.typed_any_count}`);
  lines.push(`- array_any_count: ${result.counts.array_any_count}`);
  lines.push(`- production_any_count: ${result.counts.production_any_count}`);

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

if (args.fail && result.counts.production_any_count > 0) {
  process.exit(1);
}
