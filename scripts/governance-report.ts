 
import fs from 'fs';
import path from 'path';
import { spawnSync } from 'child_process';

type OutputFormat = 'json' | 'text';

interface CliArgs {
  format: OutputFormat;
  out: string;
  failDb: boolean;
  failAny: boolean;
  failInline: boolean;
}

interface CheckResult {
  counts?: Record<string, number>;
  violations?: Array<Record<string, unknown>>;
}

interface AggregatedViolation {
  code: string;
  file: string;
  line: number;
  message: string;
  symbol?: string;
}

interface AggregatedReport {
  timestamp: string;
  git_sha: string;
  counts: {
    production_any_count: number;
    db_fk_drift_count: number;
    inline_exported_signature_count: number;
  };
  violations: AggregatedViolation[];
  meta: {
    context7_status: 'unavailable';
    modes: {
      db_fk_drift: 'report-only' | 'fail';
      inline_types: 'report-only' | 'fail';
      production_any: 'report-only' | 'fail';
    };
    tool_versions: {
      node: string;
      pnpm: string;
    };
    repo_state: {
      branch: string;
      dirty: boolean;
    };
  };
}

function parseArgs(argv: string[]): CliArgs {
  let format: OutputFormat = 'text';
  let out = '.artifacts/governance/initial-governance-report.json';
  let failDb = false;
  let failAny = false;
  let failInline = false;

  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];
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
      continue;
    }
    if (arg === '--fail-db') {
      failDb = true;
      continue;
    }
    if (arg === '--fail-any') {
      failAny = true;
      continue;
    }
    if (arg === '--fail-inline') {
      failInline = true;
    }
  }

  return { format, out, failDb, failAny, failInline };
}

function run(command: string, args: string[]): { status: number; stdout: string } {
  const resolvedCommand = process.platform === 'win32' && command === 'pnpm' ? 'pnpm.cmd' : command;
  const result = spawnSync(resolvedCommand, args, {
    encoding: 'utf-8',
    shell: process.platform === 'win32',
    windowsHide: true,
  });
  if (result.error) {
    return { status: 1, stdout: String(result.error) };
  }
  return {
    status: result.status ?? 1,
    stdout: `${result.stdout ?? ''}${result.stderr ?? ''}`.trim(),
  };
}

function runCheck(scriptPath: string, fail: boolean): { ok: boolean; parsed: CheckResult } {
  const args = ['exec', 'tsx', scriptPath, '--format', 'json'];
  if (fail) {
    args.push('--fail');
  }

  const output = run('pnpm', args);
  const firstBrace = output.stdout.indexOf('{');
  const lastBrace = output.stdout.lastIndexOf('}');
  if (firstBrace < 0 || lastBrace < 0 || lastBrace <= firstBrace) {
    throw new Error(`Invalid JSON output from ${scriptPath}: ${output.stdout.slice(0, 240)}`);
  }

  const parsed = JSON.parse(output.stdout.slice(firstBrace, lastBrace + 1)) as CheckResult;
  return { ok: output.status === 0, parsed };
}

function getGitSha(): string {
  const result = run('git', ['rev-parse', 'HEAD']);
  return result.status === 0 ? result.stdout.split('\n')[0].trim() : 'unknown';
}

function getBranch(): string {
  const result = run('git', ['rev-parse', '--abbrev-ref', 'HEAD']);
  return result.status === 0 ? result.stdout.split('\n')[0].trim() : 'unknown';
}

function isDirtyRepo(): boolean {
  const result = run('git', ['status', '--porcelain']);
  if (result.status !== 0) return true;
  return result.stdout.length > 0;
}

function getPnpmVersion(): string {
  const result = run('pnpm', ['--version']);
  return result.status === 0 ? result.stdout.split('\n')[0].trim() : 'unknown';
}

function toAggregatedViolations(source: string, entries: Array<Record<string, unknown>>): AggregatedViolation[] {
  return entries.map((entry) => {
    const code = String(entry.code ?? `${source.toUpperCase()}_VIOLATION`);
    const file = String(entry.file ?? 'unknown');
    const line = Number(entry.line ?? 1);
    const symbol = typeof entry.symbol === 'string' ? entry.symbol : undefined;
    const message = typeof entry.message === 'string'
      ? entry.message
      : `${source} violation`;

    return {
      code,
      file,
      line,
      symbol,
      message,
    };
  });
}

function sortViolations(violations: AggregatedViolation[]): AggregatedViolation[] {
  return [...violations].sort((a, b) => {
    const ak = `${a.file}|${a.line.toString().padStart(8, '0')}|${a.code}|${a.symbol ?? ''}`;
    const bk = `${b.file}|${b.line.toString().padStart(8, '0')}|${b.code}|${b.symbol ?? ''}`;
    return ak.localeCompare(bk);
  });
}

function writeJson(outPath: string, payload: AggregatedReport): void {
  const fullPath = path.resolve(outPath);
  fs.mkdirSync(path.dirname(fullPath), { recursive: true });
  fs.writeFileSync(fullPath, `${JSON.stringify(payload, null, 2)}\n`, 'utf-8');
}

function renderText(report: AggregatedReport, outPath: string): string {
  return [
    'Governance Initial Report',
    `- timestamp: ${report.timestamp}`,
    `- git_sha: ${report.git_sha}`,
    `- db_fk_drift_count: ${report.counts.db_fk_drift_count}`,
    `- production_any_count: ${report.counts.production_any_count}`,
    `- inline_exported_signature_count: ${report.counts.inline_exported_signature_count}`,
    `- violations: ${report.violations.length}`,
    `- out: ${outPath}`,
  ].join('\n');
}

const args = parseArgs(process.argv.slice(2));

const db = runCheck('scripts/check-db-drift.ts', args.failDb);
const prodAny = runCheck('scripts/check-production-any.ts', args.failAny);
const inlineTypes = runCheck('scripts/check-exported-inline-signatures.ts', args.failInline);

const dbViolations = toAggregatedViolations('db_fk_drift', (db.parsed.violations ?? []) as Array<Record<string, unknown>>);
const anyViolations = toAggregatedViolations('production_any', (prodAny.parsed.violations ?? []) as Array<Record<string, unknown>>);
const inlineViolations = toAggregatedViolations('inline_types', (inlineTypes.parsed.violations ?? []) as Array<Record<string, unknown>>);

const report: AggregatedReport = {
  timestamp: new Date().toISOString(),
  git_sha: getGitSha(),
  counts: {
    production_any_count: Number(prodAny.parsed.counts?.production_any_count ?? 0),
    db_fk_drift_count: Number(db.parsed.counts?.db_fk_drift_count ?? 0),
    inline_exported_signature_count: Number(inlineTypes.parsed.counts?.inline_exported_signature_count ?? 0),
  },
  violations: sortViolations([...dbViolations, ...anyViolations, ...inlineViolations]),
  meta: {
    context7_status: 'unavailable',
    modes: {
      db_fk_drift: args.failDb ? 'fail' : 'report-only',
      inline_types: args.failInline ? 'fail' : 'report-only',
      production_any: args.failAny ? 'fail' : 'report-only',
    },
    tool_versions: {
      node: process.version,
      pnpm: getPnpmVersion(),
    },
    repo_state: {
      branch: getBranch(),
      dirty: isDirtyRepo(),
    },
  },
};

writeJson(args.out, report);

if (args.format === 'json') {
  process.stdout.write(`${JSON.stringify(report, null, 2)}\n`);
} else {
  process.stdout.write(`${renderText(report, args.out)}\n`);
}

if ((args.failDb && !db.ok) || (args.failAny && !prodAny.ok) || (args.failInline && !inlineTypes.ok)) {
  process.exit(1);
}
