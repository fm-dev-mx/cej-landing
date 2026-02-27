/* eslint-disable */
import fs from 'fs';
import path from 'path';

const GOD_OBJECT_THRESHOLD = 400;
const COMMENTED_CODE_THRESHOLD = 5;
const MIN_DUPLICATE_LINES = 4;

interface Violation {
    file: string;
    type: string;
    message: string;
}

const violations: Violation[] = [];

function checkFileHygiene(filePath: string) {
    const content = fs.readFileSync(filePath, 'utf-8');
    const lines = content.split('\n');

    // 1. God Object Threshold
    if (lines.length > GOD_OBJECT_THRESHOLD) {
        violations.push({
            file: filePath,
            type: 'God Object',
            message: `File exceeds 400 lines (actual: ${lines.length}). Please decompose.`
        });
    }

    // 2. Commented-out Code Blocks
    let consecutiveComments = 0;
    for (let i = 0; i < lines.length; i++) {
        const line = lines[i].trim();
        // Simple check for commented out code (starts with // and looks like code)
        if (line.startsWith('//') && (line.includes(';') || line.includes('{') || line.includes('}') || line.includes('=>'))) {
            consecutiveComments++;
        } else {
            if (consecutiveComments >= COMMENTED_CODE_THRESHOLD) {
                violations.push({
                    file: filePath,
                    type: 'Commented Code',
                    message: `Consecutive commented-out code block found at lines ${i - consecutiveComments + 1}-${i}.`
                });
            }
            consecutiveComments = 0;
        }
    }

    // 3. Duplicate Code Blocks (Simple within-file detection)
    const slidingWindow: string[] = [];
    const signatures = new Set<string>();

    for (let i = 0; i < lines.length; i++) {
        const line = lines[i].trim();
        if (!line) continue;

        slidingWindow.push(line);
        if (slidingWindow.length > MIN_DUPLICATE_LINES) {
            slidingWindow.shift();
        }

        if (slidingWindow.length === MIN_DUPLICATE_LINES) {
            const signature = slidingWindow.join('|');
            // Ignore blocks that only contain closing braces or common boilerplate (including JSX tags and comments)
            const isBoilerplate = slidingWindow.every(l => {
                // Strip JS/TS and JSX comments
                const clean = l.replace(/\/\/.*$/, '')
                    .replace(/\/\*.*\*\//g, '')
                    .replace(/\{\/\*.*?\*\/\}/g, '')
                    .trim();
                // Match anything that is just punctuation/brackets or a single HTML/JSX tag (including self-closing)
                return !clean || /^[})\];,<>{}]+$/.test(clean) || /^<\/?\w+.*?>$/.test(clean) || /^[<>\/]+$/.test(clean);
            });

            if (!isBoilerplate && signatures.has(signature)) {
                violations.push({
                    file: filePath,
                    type: 'Duplicate Block',
                    message: `Identical block of ${MIN_DUPLICATE_LINES} non-empty lines detected starting around line ${i + 1}.`
                });
                break; // Only report first duplicate to avoid noise
            }
            signatures.add(signature);
        }
    }

    // 4. Layer Isolation (UI -> DB/Supabase)
    const isUIFile = filePath.includes('components') || filePath.includes('app');
    if (isUIFile) {
        const imports = lines.filter(l => l.startsWith('import'));
        const isDirectDbImport = imports.some(l => l.includes('@supabase/supabase-js') || l.includes('supabase/server') || l.includes('db/'));

        if (isDirectDbImport && !filePath.includes('api') && !filePath.includes('actions')) {
            violations.push({
                file: filePath,
                type: 'Layer Violation',
                message: 'UI components/routes should not import DB logic directly. Use Server Actions or API routes.'
            });
        }
    }

    // 5. Props Limit (Interfaces/Types in TSX)
    if (filePath.endsWith('.tsx')) {
        let propCount = 0;
        let insideInterface = false;
        lines.forEach(line => {
            if (line.includes('interface') && line.includes('Props')) insideInterface = true;
            if (insideInterface && line.includes(';')) propCount++;
            if (insideInterface && line.includes('}')) {
                if (propCount > 8) {
                    violations.push({
                        file: filePath,
                        type: 'God Component',
                        message: `Props interface has ${propCount} fields. Max allowed is 8. Please decompose the component.`
                    });
                }
                insideInterface = false;
                propCount = 0;
            }
        });
    }

    // 6. Hardcoded Colors (HEX/RGB/HSL strings in TSX)
    if (filePath.endsWith('.tsx') || filePath.endsWith('.ts')) {
        const hexRegex = /#([A-Fa-f0-9]{3}){1,2}\b/;
        const rgbRegex = /rgb\(|rgba\(|hsl\(|hsla\(/;
        lines.forEach((line, i) => {
            // Ignore variables, common false positives, and the script itself
            if ((hexRegex.test(line) || rgbRegex.test(line)) && !line.includes('var(') && !line.includes('Regex')) {
                violations.push({
                    file: filePath,
                    type: 'Hardcoded Color',
                    message: `Hardcoded color detected at line ${i + 1}. Use CSS variables or design tokens.`
                });
            }
        });
    }

    // 7. Export Audit (Prevent "Kitchen Sink" files)
    const exportCount = lines.filter(l => l.startsWith('export ')).length;
    if (exportCount > 20 && !filePath.includes('index.') && !filePath.includes('scripts/')) {
        violations.push({
            file: filePath,
            type: 'Kitchen Sink',
            message: `File has ${exportCount} exports. Max recommended is 20. Split into specialized files.`
        });
    }

    // 8. Client/Server Safety (Strict 'use client' vs heavy imports)
    // Check if 'use client' is in the first few lines (directive position)
    const header = lines.slice(0, 5).join('\n');
    const hasUseClient = header.includes("'use client'") || header.includes('"use client"');
    if (hasUseClient) {
        const forbiddenInClient = ['jsonwebtoken', 'pg', 'fs', 'path', 'crypto', 'bcrypt'];
        lines.forEach(line => {
            if (line.startsWith('import')) {
                forbiddenInClient.forEach(lib => {
                    if (line.includes(lib)) {
                        violations.push({
                            file: filePath,
                            type: 'Security Violation',
                            message: `Client component imports potentially heavy/unsafe internal lib: ${lib}`
                        });
                    }
                });
            }
        });
    }
}

// Get staged files from args
const filesToCheck = process.argv.slice(2);

filesToCheck.forEach(file => {
    if (fs.existsSync(file) && fs.lstatSync(file).isFile()) {
        checkFileHygiene(file);
    }
});

if (violations.length > 0) {

    console.error('\x1b[31m❌ Hygiene Checks Failed:\x1b[0m');
    violations.forEach(v => {

        console.error(`- [${v.type}] ${v.file}: ${v.message}`);
    });
    process.exit(1);
} else {

    console.log('\x1b[32m✅ Hygiene Checks Passed.\x1b[0m');
    process.exit(0);
}
