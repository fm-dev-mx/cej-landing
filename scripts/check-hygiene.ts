/* eslint-disable no-console */
import fs from 'fs';
import path from 'path';
import ts from 'typescript';

const GOD_OBJECT_THRESHOLD = 400;
const COMMENTED_CODE_THRESHOLD = 5;
const MIN_DUPLICATE_LINES = 4;
const MAX_COMPONENT_PROPS = 8;

type Severity = 'low' | 'medium' | 'high';
type OutputFormat = 'text' | 'json';

export interface HygieneFinding {
  code: string;
  severity: Severity;
  autoFixable: boolean;
  file: string;
  line?: number;
  message: string;
}

interface HygieneResult {
  status: 'pass' | 'fail';
  summary: {
    totalFiles: number;
    filesWithFindings: number;
    countsBySeverity: Record<Severity, number>;
    highestSeverity: Severity | 'none';
    autoFixableOnly: boolean;
  };
  findings: HygieneFinding[];
}

function normalizePath(value: string): string {
  return value.replace(/\\/g, '/');
}

function isLikelyCodeComment(line: string): boolean {
  return line.startsWith('//') && (line.includes(';') || line.includes('{') || line.includes('}') || line.includes('=>'));
}

function isBoilerplateLine(rawLine: string): boolean {
  const clean = rawLine
    .replace(/\/\/.*$/, '')
    .replace(/\/\*.*\*\//g, '')
    .replace(/\{\/\*.*?\*\/\}/g, '')
    .trim();

  if (!clean) {
    return true;
  }

  if (/^(import|export)\s/.test(clean)) {
    return true;
  }

  if (/^[})\];,<>{}]+$/.test(clean)) {
    return true;
  }

  if (/^<\/?[A-Za-z][^>]*\/?>$/.test(clean)) {
    return true;
  }

  if (/^[<>\/]+$/.test(clean)) {
    return true;
  }

  return false;
}

function getHighestSeverity(findings: HygieneFinding[]): Severity | 'none' {
  if (findings.some((item) => item.severity === 'high')) {
    return 'high';
  }

  if (findings.some((item) => item.severity === 'medium')) {
    return 'medium';
  }

  if (findings.some((item) => item.severity === 'low')) {
    return 'low';
  }

  return 'none';
}

function isUiBoundaryFile(filePath: string): boolean {
  const normalized = normalizePath(filePath);

  if (normalized.includes('/components/')) {
    return true;
  }

  if (!normalized.includes('/app/')) {
    return false;
  }

  if (/\/app\/api\//.test(normalized) || /\/actions\//.test(normalized) || /\/server\//.test(normalized)) {
    return false;
  }

  if (/\/app\/.*\/route\.(ts|tsx)$/.test(normalized)) {
    return false;
  }

  return true;
}

function analyzePropsWithAst(filePath: string, source: string): HygieneFinding[] {
  if (!filePath.endsWith('.tsx')) {
    return [];
  }

  const findings: HygieneFinding[] = [];
  const sourceFile = ts.createSourceFile(filePath, source, ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX);

  const maybePushFinding = (name: string | undefined, count: number, line: number) => {
    const typeName = name ?? 'AnonymousPropsType';
    if (count > MAX_COMPONENT_PROPS) {
      findings.push({
        code: 'GOD_COMPONENT',
        severity: 'medium',
        autoFixable: false,
        file: filePath,
        line,
        message: `${typeName} declares ${count} props (max ${MAX_COMPONENT_PROPS}).`,
      });
    }
  };

  const countMembers = (members: ts.NodeArray<ts.TypeElement>) =>
    members.filter((member) => ts.isPropertySignature(member)).length;

  const visit = (node: ts.Node) => {
    if (ts.isInterfaceDeclaration(node) && /Props$/.test(node.name.text)) {
      const line = sourceFile.getLineAndCharacterOfPosition(node.name.getStart()).line + 1;
      maybePushFinding(node.name.text, countMembers(node.members), line);
    }

    if (ts.isTypeAliasDeclaration(node) && /Props$/.test(node.name.text) && ts.isTypeLiteralNode(node.type)) {
      const line = sourceFile.getLineAndCharacterOfPosition(node.name.getStart()).line + 1;
      maybePushFinding(node.name.text, countMembers(node.type.members), line);
    }

    ts.forEachChild(node, visit);
  };

  visit(sourceFile);
  return findings;
}

function analyzeFile(filePath: string): HygieneFinding[] {
  const findings: HygieneFinding[] = [];
  const content = fs.readFileSync(filePath, 'utf-8');
  const lines = content.split('\n');
  const normalizedPath = normalizePath(filePath);
  const isToolingScript = normalizedPath.startsWith('scripts/');

  if (!isToolingScript && lines.length > GOD_OBJECT_THRESHOLD) {
    findings.push({
      code: 'GOD_OBJECT',
      severity: 'medium',
      autoFixable: false,
      file: filePath,
      message: `File has ${lines.length} lines (max ${GOD_OBJECT_THRESHOLD}).`,
    });
  }

  let consecutiveComments = 0;
  let blockStartLine = -1;
  for (let index = 0; index < lines.length; index += 1) {
    const trimmedLine = lines[index].trim();
    if (isLikelyCodeComment(trimmedLine)) {
      if (consecutiveComments === 0) {
        blockStartLine = index + 1;
      }
      consecutiveComments += 1;
      continue;
    }

    if (consecutiveComments >= COMMENTED_CODE_THRESHOLD) {
      findings.push({
        code: 'COMMENTED_CODE',
        severity: 'low',
        autoFixable: true,
        file: filePath,
        line: blockStartLine,
        message: `Commented code block from line ${blockStartLine} to ${index}.`,
      });
    }

    consecutiveComments = 0;
    blockStartLine = -1;
  }

  if (consecutiveComments >= COMMENTED_CODE_THRESHOLD) {
    findings.push({
      code: 'COMMENTED_CODE',
      severity: 'low',
      autoFixable: true,
      file: filePath,
      line: blockStartLine,
      message: `Commented code block from line ${blockStartLine} to ${lines.length}.`,
    });
  }

  if (!isToolingScript) {
    const slidingWindow: string[] = [];
    const signatures = new Set<string>();

    for (let index = 0; index < lines.length; index += 1) {
      const rawLine = lines[index].trim();
      if (!rawLine || isBoilerplateLine(rawLine)) {
        continue;
      }

      slidingWindow.push(rawLine);
      if (slidingWindow.length > MIN_DUPLICATE_LINES) {
        slidingWindow.shift();
      }

      if (slidingWindow.length !== MIN_DUPLICATE_LINES) {
        continue;
      }

      const signature = slidingWindow.join('|');
      if (signatures.has(signature)) {
        findings.push({
          code: 'DUPLICATE_BLOCK',
          severity: 'medium',
          autoFixable: false,
          file: filePath,
          line: index + 1 - MIN_DUPLICATE_LINES + 1,
          message: `Repeated ${MIN_DUPLICATE_LINES}-line block detected.`,
        });
        break;
      }

      signatures.add(signature);
    }
  }

  if (isUiBoundaryFile(normalizedPath)) {
    const directDbImport = lines.some((line) => {
      if (!line.trim().startsWith('import')) {
        return false;
      }

      return (
        line.includes('@supabase/supabase-js') ||
        line.includes('supabase/server') ||
        line.includes('/db/') ||
        line.includes(' from "db/') ||
        line.includes(" from 'db/")
      );
    });

    if (directDbImport) {
      findings.push({
        code: 'LAYER_VIOLATION',
        severity: 'high',
        autoFixable: false,
        file: filePath,
        message: 'UI boundary file imports DB/Supabase directly. Use API routes or server actions.',
      });
    }
  }

  findings.push(...analyzePropsWithAst(filePath, content));

  if (filePath.endsWith('.tsx')) {
    const colorRegex = /#(?:[A-Fa-f0-9]{3}|[A-Fa-f0-9]{6})\b|rgba?\(|hsla?\(/;
    lines.forEach((line, index) => {
      if (!colorRegex.test(line)) {
        return;
      }

      if (line.includes('var(') || line.includes('Regex')) {
        return;
      }

      if (!/(style|color|background|border)/i.test(line)) {
        return;
      }

      findings.push({
        code: 'HARDCODED_COLOR',
        severity: 'low',
        autoFixable: true,
        file: filePath,
        line: index + 1,
        message: 'Hardcoded color in UI rendering context. Use design tokens.',
      });
    });
  }

  const exportCount = lines.filter((line) => line.trim().startsWith('export ')).length;
  if (exportCount > 20 && !normalizedPath.endsWith('/index.ts') && !normalizedPath.includes('/scripts/')) {
    findings.push({
      code: 'KITCHEN_SINK',
      severity: 'medium',
      autoFixable: false,
      file: filePath,
      message: `File has ${exportCount} exports (recommended max 20).`,
    });
  }

  const header = lines.slice(0, 5).join('\n');
  if (header.includes("'use client'") || header.includes('"use client"')) {
    const forbiddenModules = ['jsonwebtoken', 'pg', 'fs', 'path', 'crypto', 'bcrypt'];
    lines.forEach((line, index) => {
      if (!line.trim().startsWith('import')) {
        return;
      }

      forbiddenModules.forEach((moduleName) => {
        if (!line.includes(moduleName)) {
          return;
        }

        findings.push({
          code: 'CLIENT_SECURITY_VIOLATION',
          severity: 'high',
          autoFixable: false,
          file: filePath,
          line: index + 1,
          message: `Client component imports server-side module "${moduleName}".`,
        });
      });
    });
  }

  return findings;
}

function parseArgs(argv: string[]): { format: OutputFormat; files: string[] } {
  const files: string[] = [];
  let format: OutputFormat = 'text';

  for (let index = 0; index < argv.length; index += 1) {
    const value = argv[index];

    if (value === '--format') {
      const next = argv[index + 1];
      if (next === 'json' || next === 'text') {
        format = next;
        index += 1;
      }
      continue;
    }

    if (value.startsWith('--')) {
      continue;
    }

    files.push(value);
  }

  return { format, files };
}

function buildResult(filesToCheck: string[]): HygieneResult {
  const findings = filesToCheck.flatMap((filePath) => {
    if (!fs.existsSync(filePath) || !fs.lstatSync(filePath).isFile()) {
      return [];
    }
    return analyzeFile(filePath);
  });

  const filesWithFindings = new Set(findings.map((finding) => normalizePath(finding.file)));
  const countsBySeverity: Record<Severity, number> = {
    low: findings.filter((item) => item.severity === 'low').length,
    medium: findings.filter((item) => item.severity === 'medium').length,
    high: findings.filter((item) => item.severity === 'high').length,
  };

  return {
    status: findings.length === 0 ? 'pass' : 'fail',
    summary: {
      totalFiles: filesToCheck.length,
      filesWithFindings: filesWithFindings.size,
      countsBySeverity,
      highestSeverity: getHighestSeverity(findings),
      autoFixableOnly: findings.every((item) => item.autoFixable),
    },
    findings,
  };
}

function renderText(result: HygieneResult): string {
  if (result.status === 'pass') {
    return '✅ Hygiene Checks Passed.';
  }

  const lines = ['❌ Hygiene Checks Failed:'];
  result.findings.forEach((finding) => {
    const lineRef = finding.line ? `:${finding.line}` : '';
    lines.push(
      `- [${finding.code}] (${finding.severity}, autoFixable=${finding.autoFixable}) ${finding.file}${lineRef}: ${finding.message}`
    );
  });
  return lines.join('\n');
}

const { format, files } = parseArgs(process.argv.slice(2));
const uniqueFiles = Array.from(
  new Set(
    files
      .map((item) => item.trim())
      .filter(Boolean)
      .map((item) => path.normalize(item))
  )
);
const result = buildResult(uniqueFiles);

if (format === 'json') {
  console.log(JSON.stringify(result));
} else {
  console.log(renderText(result));
}

process.exit(result.status === 'pass' ? 0 : 1);
