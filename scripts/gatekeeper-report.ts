/* eslint-disable no-console */
import { spawnSync } from 'child_process';
import crypto from 'crypto';
import fs from 'fs';
import path from 'path';
import { mapDomainsFromFiles } from './map-staged-domains';
import type { HygieneFinding } from './check-hygiene';

type Severity = 'none' | 'low' | 'medium' | 'high';
type Route = 'proceed_adu' | 'auto_fix' | 'architectural_intervention';
type CheckStatus = 'pass' | 'fail' | 'skipped';
type Format = 'json' | 'markdown';

interface HygieneOutput {
  status: 'pass' | 'fail';
  summary: {
    highestSeverity: Severity;
    autoFixableOnly: boolean;
  };
  findings: HygieneFinding[];
}

interface GatekeeperCheck {
  status: CheckStatus;
  severity?: Severity;
  autoFixable?: boolean;
}

interface GatekeeperReport {
  status: 'pass' | 'fail';
  route: Route;
  checks: {
    hygiene: GatekeeperCheck;
    lintStaged: GatekeeperCheck;
  };
  staged: {
    filesTotal: number;
    domains: string[];
    risk: 'low' | 'medium' | 'high';
    stat: string;
    signature: string;
  };
  adu: {
    suggestedSplits: Array<{
      id: string;
      domain: string;
      files: string[];
      commitType: 'feat' | 'fix' | 'chore';
      scope: string;
    }>;
  };
  violations: Array<{
    type: string;
    file: string;
    line?: number;
    severity: Exclude<Severity, 'none'>;
    autoFixable: boolean;
    hint: string;
  }>;
  source: 'artifact' | 'fresh';
  nextStep: string;
}

interface ParsedArgs {
  format: Format;
  runLintStaged: boolean;
  writeArtifact: boolean;
  useArtifactOnly: boolean;
  lintStatusOverride?: CheckStatus;
  skipHygiene: boolean;
}

function stripAnsi(value: string): string {
  return value.replace(/[\u001b\u009b][[()#;?]*(?:[0-9]{1,4}(?:;[0-9]{0,4})*)?[0-z/A-M]/g, '').replace(/\r/g, '');
}

function runGit(args: string[]): string {
  const result = spawnSync('git', args, { encoding: 'utf-8' });
  if (result.status !== 0) {
    const output = stripAnsi(`${result.stdout ?? ''}${result.stderr ?? ''}`.trim());
    throw new Error(output || `git ${args.join(' ')} failed`);
  }

  return stripAnsi(result.stdout ?? '');
}

function runCommand(command: string, args: string[]): { status: number; output: string } {
  const result = spawnSync(command, args, { encoding: 'utf-8', shell: process.platform === 'win32' });
  if (result.error) {
    throw result.error;
  }

  const output = stripAnsi(`${result.stdout ?? ''}${result.stderr ?? ''}`.trim());
  return { status: result.status ?? 1, output };
}

function parseNameStatus(raw: string): Array<{ status: string; file: string }> {
  const tokens = raw.split('\0').filter(Boolean);
  const entries: Array<{ status: string; file: string }> = [];

  for (let index = 0; index < tokens.length; index += 1) {
    const statusToken = tokens[index];
    const fileToken = tokens[index + 1];
    if (!statusToken || !fileToken) {
      continue;
    }

    entries.push({
      status: statusToken,
      file: fileToken.replace(/\\/g, '/'),
    });
    index += 1;
  }

  return entries;
}

function getStagedData(): { entries: Array<{ status: string; file: string }>; stat: string; signature: string } {
  const nameStatusRaw = runGit(['diff', '--cached', '--name-status', '-z', '--diff-filter=ACMR']);
  const entries = parseNameStatus(nameStatusRaw);
  const stat = runGit(['diff', '--cached', '--stat', '--compact-summary']).trim();
  const signatureSource = entries.map((entry) => `${entry.status}:${entry.file}`).join('|');
  const signature = crypto.createHash('sha1').update(signatureSource).digest('hex');

  return { entries, stat, signature };
}

function parseArgs(argv: string[]): ParsedArgs {
  let format: Format = 'markdown';
  let runLintStaged = false;
  let writeArtifact = false;
  let useArtifactOnly = false;
  let lintStatusOverride: CheckStatus | undefined;
  let skipHygiene = false;

  for (let index = 0; index < argv.length; index += 1) {
    const value = argv[index];
    if (value === '--format') {
      const next = argv[index + 1];
      if (next === 'json' || next === 'markdown') {
        format = next;
        index += 1;
      }
      continue;
    }

    if (value === '--run-lint-staged') {
      runLintStaged = true;
      continue;
    }

    if (value === '--write-artifact') {
      writeArtifact = true;
      continue;
    }

    if (value === '--use-artifact-only') {
      useArtifactOnly = true;
      continue;
    }

    if (value === '--skip-hygiene') {
      skipHygiene = true;
      continue;
    }

    if (value === '--lint-status') {
      const next = argv[index + 1];
      if (next === 'pass' || next === 'fail' || next === 'skipped') {
        lintStatusOverride = next;
        index += 1;
      }
    }
  }

  return { format, runLintStaged, writeArtifact, useArtifactOnly, lintStatusOverride, skipHygiene };
}

function getArtifactPath(): string {
  return path.join(process.cwd(), '.git', '.gatekeeper', 'precommit-report.json');
}

function readArtifact(pathToArtifact: string): GatekeeperReport | null {
  if (!fs.existsSync(pathToArtifact)) {
    return null;
  }

  try {
    const parsed = JSON.parse(fs.readFileSync(pathToArtifact, 'utf-8')) as GatekeeperReport;
    return parsed;
  } catch {
    return null;
  }
}

function writeArtifact(pathToArtifact: string, report: GatekeeperReport): void {
  fs.mkdirSync(path.dirname(pathToArtifact), { recursive: true });
  fs.writeFileSync(pathToArtifact, JSON.stringify(report, null, 2), 'utf-8');
}

function summarizeSeverity(findings: HygieneFinding[]): Severity {
  if (findings.some((finding) => finding.severity === 'high')) {
    return 'high';
  }
  if (findings.some((finding) => finding.severity === 'medium')) {
    return 'medium';
  }
  if (findings.some((finding) => finding.severity === 'low')) {
    return 'low';
  }
  return 'none';
}

function runHygiene(tsFiles: string[], skipHygiene: boolean): HygieneOutput {
  if (skipHygiene || tsFiles.length === 0) {
    return { status: 'pass', summary: { highestSeverity: 'none', autoFixableOnly: true }, findings: [] };
  }

  const hygiene = runCommand('pnpm', ['exec', 'tsx', 'scripts/check-hygiene.ts', '--format', 'json', ...tsFiles]);
  if (!hygiene.output) {
    throw new Error('check-hygiene returned empty output.');
  }

  let parsed: HygieneOutput;
  try {
    parsed = JSON.parse(hygiene.output) as HygieneOutput;
  } catch {
    throw new Error(`Unable to parse hygiene JSON output: ${hygiene.output.slice(0, 300)}`);
  }
  return parsed;
}

function runLintCheck(runLintStaged: boolean, lintOverride?: CheckStatus): GatekeeperCheck {
  if (lintOverride) {
    return {
      status: lintOverride,
      autoFixable: lintOverride !== 'pass',
    };
  }

  if (!runLintStaged) {
    return { status: 'skipped', autoFixable: true };
  }

  const lintRun = runCommand('pnpm', ['lint-staged', '--quiet']);
  return {
    status: lintRun.status === 0 ? 'pass' : 'fail',
    autoFixable: lintRun.status !== 0,
  };
}

function computeRoute(hygiene: GatekeeperCheck, lint: GatekeeperCheck, findings: HygieneFinding[]): Route {
  const hasArchitecturalViolation = findings.some(
    (finding) => finding.severity === 'high' && finding.autoFixable === false
  );

  if (hasArchitecturalViolation) {
    return 'architectural_intervention';
  }

  if (hygiene.status === 'fail' || lint.status === 'fail') {
    return 'auto_fix';
  }

  return 'proceed_adu';
}

function topViolations(findings: HygieneFinding[]) {
  return findings.slice(0, 3).map((finding) => ({
    type: finding.code,
    file: finding.file,
    line: finding.line,
    severity: finding.severity,
    autoFixable: finding.autoFixable,
    hint: finding.message,
  }));
}

function nextStepForRoute(route: Route): string {
  if (route === 'auto_fix') {
    return 'Run /auto-fix to resolve auto-fixable static failures.';
  }
  if (route === 'architectural_intervention') {
    return 'Stop and resolve high-severity hygiene violations (no /auto-fix handoff).';
  }
  return 'Run git diff --cached once and propose ADU commit splits.';
}

function renderMarkdownSummary(report: GatekeeperReport): string {
  const checks = `hygiene=${report.checks.hygiene.status.toUpperCase()} lint=${report.checks.lintStaged.status.toUpperCase()}`;
  const top = report.violations.length
    ? report.violations
        .slice(0, 3)
        .map((item) => `${item.type}@${item.file}${item.line ? `:${item.line}` : ''}`)
        .join('; ')
    : 'none';

  return [
    '# Gatekeeper Summary',
    `route: ${report.route}`,
    `status: ${report.status}`,
    `checks: ${checks}`,
    `staged: files=${report.staged.filesTotal} domains=${report.staged.domains.join(',') || 'none'} risk=${report.staged.risk}`,
    `top_violations: ${top}`,
    `next: ${report.nextStep}`,
  ].join('\n');
}

function buildReport(args: ParsedArgs): GatekeeperReport {
  const stagedData = getStagedData();
  const stagedFiles = stagedData.entries.map((entry) => entry.file);
  const artifactPath = getArtifactPath();
  const cachedArtifact = readArtifact(artifactPath);

  if (cachedArtifact && cachedArtifact.staged.signature === stagedData.signature) {
    return { ...cachedArtifact, source: 'artifact' };
  }

  if (args.useArtifactOnly && cachedArtifact) {
    return { ...cachedArtifact, source: 'artifact' };
  }

  if (stagedFiles.length === 0) {
    return {
      status: 'pass',
      route: 'proceed_adu',
      checks: {
        hygiene: { status: 'pass', severity: 'none', autoFixable: true },
        lintStaged: { status: 'skipped', autoFixable: true },
      },
      staged: {
        filesTotal: 0,
        domains: [],
        risk: 'low',
        stat: '',
        signature: stagedData.signature,
      },
      adu: { suggestedSplits: [] },
      violations: [],
      source: 'fresh',
      nextStep: nextStepForRoute('proceed_adu'),
    };
  }

  const tsFiles = stagedFiles.filter((file) => file.endsWith('.ts') || file.endsWith('.tsx'));
  const hygieneOutput = runHygiene(tsFiles, args.skipHygiene);
  const hygieneSeverity = summarizeSeverity(hygieneOutput.findings);
  const hygieneCheck: GatekeeperCheck = {
    status: hygieneOutput.status === 'pass' ? 'pass' : 'fail',
    severity: hygieneSeverity,
    autoFixable: hygieneOutput.findings.length === 0 || hygieneOutput.findings.every((item) => item.autoFixable),
  };

  const lintCheck = runLintCheck(args.runLintStaged, args.lintStatusOverride);
  const domainMap = mapDomainsFromFiles(stagedFiles);
  const route = computeRoute(hygieneCheck, lintCheck, hygieneOutput.findings);
  const status = route === 'proceed_adu' ? 'pass' : 'fail';

  const report: GatekeeperReport = {
    status,
    route,
    checks: {
      hygiene: hygieneCheck,
      lintStaged: lintCheck,
    },
    staged: {
      filesTotal: stagedFiles.length,
      domains: domainMap.domains,
      risk: domainMap.risk,
      stat: stagedData.stat,
      signature: stagedData.signature,
    },
    adu: {
      suggestedSplits: domainMap.suggestedSplits,
    },
    violations: topViolations(hygieneOutput.findings),
    source: 'fresh',
    nextStep: nextStepForRoute(route),
  };

  if (args.writeArtifact) {
    writeArtifact(artifactPath, report);
  }

  return report;
}

try {
  const args = parseArgs(process.argv.slice(2));
  const report = buildReport(args);

  if (args.format === 'json') {
    console.log(JSON.stringify(report));
  } else {
    console.log(renderMarkdownSummary(report));
  }

  process.exit(report.status === 'pass' ? 0 : 1);
} catch (error) {
  const message = error instanceof Error ? error.message : String(error);
  console.error(`Gatekeeper report generation failed: ${message}`);
  process.exit(1);
}
