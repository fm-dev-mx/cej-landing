/* eslint-disable */
import { execSync } from 'child_process';
import fs from 'fs';

/**
 * Gatekeeper Preflight Report Generator
 * Consolidates static analysis into a single Token-Slim Markdown report.
 */

function stripAnsi(str: string): string {
    return str.replace(/[\u001b\u009b][[()#;?]*(?:[0-9]{1,4}(?:;[0-9]{0,4})*)?[0-z/A-M]/g, '').replace(/\r/g, '');
}

function runCommand(command: string): string {
    try {
        const output = execSync(command, { encoding: 'utf-8', stdio: ['ignore', 'pipe', 'pipe'] });
        return stripAnsi(output);
    } catch (error: any) {
        return stripAnsi(error.stdout + error.stderr);
    }
}

async function generateReport() {
    const stagedFiles = runCommand('git diff --cached --name-only').trim().split('\n').filter(Boolean);

    if (stagedFiles.length === 0) {
        console.log('# Gatekeeper Report\n\nNo files staged for commit.');
        return;
    }

    const tsFiles = stagedFiles.filter(f => f.endsWith('.ts') || f.endsWith('.tsx'));

    let report = '# Gatekeeper Preflight Report\n\n';
    report += `**Staged Files:** ${stagedFiles.length}\n`;
    report += `**TS/TSX Files:** ${tsFiles.length}\n\n`;

    // 1. Hygiene Check
    report += '## 1. Hygiene Status\n';
    if (tsFiles.length > 0) {
        const hygieneOutput = runCommand(`npx tsx scripts/check-hygiene.ts ${tsFiles.join(' ')}`);
        if (hygieneOutput.includes('✅ Hygiene Checks Passed')) {
            report += '✅ PASS\n';
        } else {
            report += '❌ FAIL\n';
            report += '```text\n' + hygieneOutput.trim() + '\n```\n';
        }
    } else {
        report += 'N/A (No TS files)\n';
    }

    // 2. ESLint Check
    report += '\n## 2. Lint Status\n';
    const lintOutput = runCommand('pnpm lint-staged --quiet');
    if (lintOutput.includes('✅ Quality checks passed') || !lintOutput.includes('error')) {
        report += '✅ PASS\n';
    } else {
        report += '❌ FAIL\n';
        report += '```text\n' + lintOutput.trim().substring(0, 500) + (lintOutput.length > 500 ? '...' : '') + '\n```\n';
    }

    // 3. ADU Metrics (Token-Slim)
    report += '\n## 3. ADU Context\n';
    const diffStat = runCommand('git diff --cached --stat');
    report += '```text\n' + diffStat.trim() + '\n```\n';

    // Output the report to stdout
    console.log(report);
}

generateReport().catch(err => {
    console.error('Report generation failed:', err);
    process.exit(1);
});
