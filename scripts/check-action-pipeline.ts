
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
    code: 'MISSING_AUTH' | 'MISSING_RBAC' | 'MISSING_VALIDATION' | 'MISSING_DOMAIN_CALL' | 'UNTYPED_RESULT';
    file: string;
    line: number;
    symbol: string;
    message: string;
}

interface Result {
    summary: {
        scanned_files: number;
    };
    counts: {
        action_pipeline_violation_count: number;
    };
    violations: Violation[];
}

const ACTION_ROOT = 'app/actions';

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
    if (!/\.(ts)$/.test(relativePath)) return false; // Usually actions are .ts
    if (/\.test\.ts$/.test(relativePath)) return false;
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

function checkActionPipeline(repoRoot: string, relativePath: string): Violation[] {
    const fullPath = path.join(repoRoot, relativePath);
    const source = fs.readFileSync(fullPath, 'utf-8');
    const sourceFile = ts.createSourceFile(relativePath, source, ts.ScriptTarget.Latest, true, ts.ScriptKind.TS);
    const violations: Violation[] = [];

    const addViolation = (code: Violation['code'], node: ts.Node, symbol: string, message: string) => {
        const line = sourceFile.getLineAndCharacterOfPosition(node.getStart(sourceFile)).line + 1;
        violations.push({
            code,
            file: relativePath,
            line,
            symbol,
            message,
        });
    };

    const visit = (node: ts.Node) => {
        if (ts.isFunctionDeclaration(node) && node.modifiers?.some(m => m.kind === ts.SyntaxKind.ExportKeyword)) {
            const symbol = node.name?.text || 'anonymous';
            const body = node.body?.getText(sourceFile) || '';
            const fileText = sourceFile.text;

            // Heuristic checks
            const hasAuth = /auth\(|createClient[<(]|getUser\(|getSession\(|_require/.test(body) || /createClient[<(]/.test(fileText);
            const isPrivileged = (symbol.toLowerCase().includes('admin') || symbol.toLowerCase().includes('delete') || symbol.toLowerCase().includes('update') || symbol.toLowerCase().includes('create') || symbol.toLowerCase().includes('export')) && !symbol.toLowerCase().includes('submit');
            const isRead = /^(get|list|fetch|read)/.test(symbol.toLowerCase());
            const hasRBAC = /role|permission|isAdmin|createAdminClient\(|getUserRole|_require/.test(body);
            const hasValidation = /parse\(|safeParse\(|Zod|Schema/.test(body);
            const hasTypedResult = node.type?.getText(sourceFile).includes('Result') || node.type?.getText(sourceFile).includes('Promise<') || body.includes('status:') || body.includes('success:') || body.includes('revalidatePath');

            if (!hasAuth && !relativePath.includes('getPriceConfig') && !relativePath.includes('getQuoteByFolio')) {
                // Some actions might be public check-only, but usually we want at least a client check
                addViolation('MISSING_AUTH', node, symbol, 'Action seems to miss an authentication or client initialization check.');
            }

            if (isPrivileged && !hasRBAC) {
                addViolation('MISSING_RBAC', node, symbol, 'Privileged action seems to miss an RBAC or authorization check.');
            }

            if (!hasValidation && !isRead && !symbol.includes('refresh') && !symbol.includes('export')) {
                addViolation('MISSING_VALIDATION', node, symbol, 'Mutation action seems to miss runtime validation (Zod).');
            }

            if (!hasTypedResult) {
                addViolation('UNTYPED_RESULT', node, symbol, 'Action result seems untyped or lacks a deterministic status shape.');
            }
        }
    };

    ts.forEachChild(sourceFile, (node) => {
        // Also check variable declarations (arrow functions exported)
        if (ts.isVariableStatement(node) && node.modifiers?.some(m => m.kind === ts.SyntaxKind.ExportKeyword)) {
            node.declarationList.declarations.forEach(decl => {
                if (decl.initializer && (ts.isArrowFunction(decl.initializer) || ts.isFunctionExpression(decl.initializer))) {
                    const symbol = decl.name.getText(sourceFile);
                    const body = decl.initializer.body.getText(sourceFile);
                    const fileText = sourceFile.text;

                    const hasAuth = /auth\(|createClient[<(]|getUser\(|getSession\(|_require/.test(body) || /createClient[<(]/.test(fileText);
                    const isPrivileged = (symbol.toLowerCase().includes('admin') || symbol.toLowerCase().includes('delete') || symbol.toLowerCase().includes('update') || symbol.toLowerCase().includes('create') || symbol.toLowerCase().includes('export')) && !symbol.toLowerCase().includes('submit');
                    const isRead = /^(get|list|fetch|read)/.test(symbol.toLowerCase());
                    const hasRBAC = /role|permission|isAdmin|createAdminClient\(|getUserRole|_require/.test(body);
                    const hasValidation = /parse\(|safeParse\(|Zod|Schema/.test(body);
                    const hasTypedResult = decl.initializer.type?.getText(sourceFile).includes('Result') || body.includes('status:') || body.includes('success:') || body.includes('revalidatePath');

                    if (!hasAuth && !relativePath.includes('getPriceConfig') && !relativePath.includes('getQuoteByFolio')) {
                        addViolation('MISSING_AUTH', decl, symbol, 'Action seems to miss an authentication or client initialization check.');
                    }
                    if (isPrivileged && !hasRBAC) {
                        addViolation('MISSING_RBAC', decl, symbol, 'Privileged action seems to miss an RBAC or authorization check.');
                    }
                    if (!hasValidation && !isRead && !symbol.includes('refresh') && !symbol.includes('export')) {
                        addViolation('MISSING_VALIDATION', decl, symbol, 'Mutation action seems to miss runtime validation (Zod).');
                    }
                    if (!hasTypedResult) {
                        addViolation('UNTYPED_RESULT', decl, symbol, 'Action result seems untyped or lacks a deterministic status shape.');
                    }
                }
            });
        }
        visit(node);
    });

    return violations;
}

function buildResult(repoRoot: string): Result {
    const files: string[] = [];
    walkFiles(path.join(repoRoot, ACTION_ROOT), repoRoot, files);
    files.sort();

    const allViolations: Violation[] = [];
    for (const file of files) {
        allViolations.push(...checkActionPipeline(repoRoot, file));
    }

    return {
        summary: {
            scanned_files: files.length,
        },
        counts: {
            action_pipeline_violation_count: allViolations.length,
        },
        violations: allViolations,
    };
}

function renderText(result: Result): string {
    const lines: string[] = [];
    lines.push('Action Pipeline Governance Report');
    lines.push(`- scanned_files: ${result.summary.scanned_files}`);
    lines.push(`- action_pipeline_violation_count: ${result.counts.action_pipeline_violation_count}`);

    if (result.violations.length) {
        lines.push('Violations:');
        for (const violation of result.violations) {
            lines.push(`- [${violation.code}] ${violation.file}:${violation.line} symbol=${violation.symbol} ${violation.message}`);
        }
    }

    return lines.join('\n');
}

const args = parseArgs(process.argv.slice(2));
const repoRoot = process.cwd();
const result = buildResult(repoRoot);

if (args.out) {
    const fullPath = path.resolve(args.out);
    fs.mkdirSync(path.dirname(fullPath), { recursive: true });
    fs.writeFileSync(fullPath, `${JSON.stringify(result, null, 2)}\n`, 'utf-8');
}

if (args.format === 'json') {
    process.stdout.write(`${JSON.stringify(result, null, 2)}\n`);
} else {
    process.stdout.write(`${renderText(result)}\n`);
}

if (args.fail && result.counts.action_pipeline_violation_count > 0) {
    process.exit(1);
}
