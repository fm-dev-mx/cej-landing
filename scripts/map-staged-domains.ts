/* eslint-disable no-console */
import fs from 'fs';
import path from 'path';
import { spawnSync } from 'child_process';
import { fileURLToPath } from 'url';

type RiskLevel = 'low' | 'medium' | 'high';

interface DomainRule {
  domain: string;
  prefixes: string[];
  exact: string[];
}

interface DomainMapConfig {
  rules: DomainRule[];
  risk: {
    high: string[];
    medium: string[];
  };
}

interface DomainGroup {
  domain: string;
  files: string[];
}

interface SuggestedSplit {
  id: string;
  domain: string;
  files: string[];
  commitType: 'feat' | 'fix' | 'chore';
  scope: string;
}

export interface DomainMapResult {
  filesTotal: number;
  domains: string[];
  groups: DomainGroup[];
  risk: RiskLevel;
  suggestedSplits: SuggestedSplit[];
}

function normalizePath(value: string): string {
  return value.replace(/\\/g, '/');
}

function defaultConfigPath(): string {
  return path.join(process.cwd(), 'scripts', 'config', 'domain-map.json');
}

function loadConfig(configPath = defaultConfigPath()): DomainMapConfig {
  const content = fs.readFileSync(configPath, 'utf-8');
  return JSON.parse(content) as DomainMapConfig;
}

function inferDomain(filePath: string, config: DomainMapConfig): string {
  const normalized = normalizePath(filePath);

  const match = config.rules.find((rule) => {
    const exactMatch = rule.exact.some((value) => normalizePath(value) === normalized);
    if (exactMatch) {
      return true;
    }

    return rule.prefixes.some((prefix) => normalized.startsWith(normalizePath(prefix)));
  });

  return match?.domain ?? 'misc';
}

function inferScope(domain: string, files: string[]): string {
  const firstFile = files[0] ?? domain;
  const segments = normalizePath(firstFile).split('/');
  if (segments.length > 1) {
    return segments[0].replace(/[^a-zA-Z0-9-]/g, '').toLowerCase() || domain;
  }

  return domain;
}

function inferCommitType(domain: string): 'feat' | 'fix' | 'chore' {
  if (domain === 'tooling') {
    return 'chore';
  }

  if (domain === 'domain' || domain === 'contracts') {
    return 'fix';
  }

  return 'feat';
}

export function mapDomainsFromFiles(files: string[], configPath?: string): DomainMapResult {
  const config = loadConfig(configPath);
  const groupsMap = new Map<string, string[]>();

  files.forEach((file) => {
    const domain = inferDomain(file, config);
    if (!groupsMap.has(domain)) {
      groupsMap.set(domain, []);
    }
    groupsMap.get(domain)?.push(file);
  });

  const groups = Array.from(groupsMap.entries())
    .map(([domain, groupedFiles]) => ({
      domain,
      files: groupedFiles.slice().sort(),
    }))
    .sort((left, right) => left.domain.localeCompare(right.domain));

  const domains = groups.map((group) => group.domain);
  const risk: RiskLevel = domains.some((domain) => config.risk.high.includes(domain))
    ? 'high'
    : domains.some((domain) => config.risk.medium.includes(domain))
      ? 'medium'
      : 'low';

  const suggestedSplits = groups.map((group, index) => ({
    id: String.fromCharCode(65 + index),
    domain: group.domain,
    files: group.files,
    commitType: inferCommitType(group.domain),
    scope: inferScope(group.domain, group.files),
  }));

  return {
    filesTotal: files.length,
    domains,
    groups,
    risk,
    suggestedSplits,
  };
}

function getStagedFilesFromGit(): string[] {
  const result = spawnSync('git', ['diff', '--cached', '--name-only', '--diff-filter=ACMR', '-z'], {
    encoding: 'utf-8',
  });

  if (result.status !== 0) {
    const errorText = `${result.stdout ?? ''}${result.stderr ?? ''}`.trim();
    throw new Error(errorText || 'Unable to read staged files.');
  }

  return (result.stdout ?? '')
    .split('\0')
    .map((item) => item.trim())
    .filter(Boolean);
}

function parseCli(argv: string[]): { format: 'json' | 'text'; files: string[]; configPath?: string } {
  const files: string[] = [];
  let format: 'json' | 'text' = 'text';
  let configPath: string | undefined;

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

    if (value === '--config') {
      const next = argv[index + 1];
      if (next) {
        configPath = path.resolve(process.cwd(), next);
        index += 1;
      }
      continue;
    }

    if (value.startsWith('--')) {
      continue;
    }

    files.push(value);
  }

  return { format, files, configPath };
}

function renderText(result: DomainMapResult): string {
  const lines = [
    'Domain Mapping',
    `files=${result.filesTotal}`,
    `domains=${result.domains.join(',') || 'none'}`,
    `risk=${result.risk}`,
    'splits:',
  ];

  result.suggestedSplits.forEach((split) => {
    lines.push(`- ${split.id} ${split.commitType}(${split.scope}) domain=${split.domain} files=${split.files.length}`);
  });

  return lines.join('\n');
}

const currentFilePath = fileURLToPath(import.meta.url);
const entryFilePath = process.argv[1] ? path.resolve(process.argv[1]) : '';
const isDirectExecution = entryFilePath === currentFilePath;

if (isDirectExecution) {
  const args = parseCli(process.argv.slice(2));
  const sourceFiles = args.files.length > 0 ? args.files : getStagedFilesFromGit();
  const uniqueFiles = Array.from(new Set(sourceFiles.map((file) => normalizePath(file))));
  const result = mapDomainsFromFiles(uniqueFiles, args.configPath);

  if (args.format === 'json') {
    console.log(JSON.stringify(result));
  } else {
    console.log(renderText(result));
  }
}
