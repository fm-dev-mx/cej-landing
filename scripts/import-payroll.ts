import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import csv from 'csv-parser';
import dotenv from 'dotenv';
import { parse, isValid, setYear } from 'date-fns';

dotenv.config({ path: ['.env.local', '.env'] });

const CSV_FILE = 'csv/nomina.csv';
const userIdArg = process.argv.find(arg => arg.startsWith('--user-id='));
const IMPORT_USER_ID = userIdArg ? userIdArg.split('=')[1] : '9d571f48-f267-4665-8f5f-21841df194b9';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

const isDryRun = process.argv.includes('--dry-run');

function parseCurrency(val: string): number {
    if (!val) return 0;
    // Remove $, commas, spaces, and handle parentheses for negatives if any
    let s = val.trim();
    if (s.startsWith('(') && s.endsWith(')')) s = '-' + s.slice(1, -1);
    return parseFloat(s.replace(/[$,\s]/g, '')) || 0;
}

function parseDate(val: string, year: string): string | null {
    if (!val) return null;
    const cleaned = val.trim();
    // val is "27-Sep"
    const formats = ['d-MMM', 'dd-MMM'];
    for (const fmt of formats) {
        let d = parse(cleaned, fmt, new Date());
        if (isValid(d)) {
            d = setYear(d, parseInt(year, 10));
            return d.toISOString();
        }
    }
    return null;
}

async function run() {
    const rows: any[] = [];
    console.log(`Starting Phase 3: Payroll... Dry Run: ${isDryRun}`);

    if (!fs.existsSync(CSV_FILE)) {
        console.error(`File not found: ${CSV_FILE}`);
        process.exit(1);
    }

    await new Promise((resolve, reject) => {
        fs.createReadStream(CSV_FILE)
            .pipe(csv({
                mapHeaders: ({ header }) => {
                    // Clean up messy headers from the sample:
                    // ID,Semana,A¤o,Fecha Inicio,Fecha Fin,Nombre,Dias, Sueldo Base ,Metros C£bicos,Viajes,Hora Extra,$ m?,$ Viajes,$ H.E, TOTAL COMISI?N ,DESCTO. PRESTAMO, SUELDO TOT TAL , TOTAL  ,comentarios
                    let h = header.replace(/^\uFEFF/, '').trim();
                    if (h.includes('A¤o')) h = 'Año';
                    if (h.includes(' TOTAL ') && h.trim() === 'TOTAL') h = 'TOTAL';
                    // Handle the specific " TOTAL  " header which has many spaces
                    if (h === 'TOTAL') return 'TOTAL';
                    return h;
                }
            }))
            .on('data', (data: any) => {
                // Ensure we have a valid row by checking Nombre
                if (data.Nombre && data.Nombre.trim() !== '' && data.Nombre.toLowerCase() !== 'nombre') {
                    rows.push(data);
                }
            })
            .on('end', resolve)
            .on('error', reject);
    });

    console.log(`Loaded ${rows.length} payroll records.`);

    const stats = { total: rows.length, inserted: 0, errors: 0 };
    const chunkSize = 20;

    for (let i = 0; i < rows.length; i += chunkSize) {
        const chunk = rows.slice(i, i + chunkSize);
        await Promise.all(chunk.map(async (row) => {
            try {
                // Find the total amount. The CSV has " TOTAL  " and " TOTAL " columns.
                // We'll try to find the one with the most plausible currency value.
                const rawTotal = row['TOTAL'] || row[' SUELDO TOT TAL '] || row['TOTAL '];
                const amount = parseCurrency(rawTotal);

                const yearStr = row['Año'] || row['A¤o'] || '2024';
                const start = parseDate(row['Fecha Inicio'], yearStr);
                const end = parseDate(row['Fecha Fin'], yearStr);

                if (!start || !end) {
                    // If it's a name without dates, it might be a subtotal or garbage
                    return;
                }

                const payload = {
                    user_id: IMPORT_USER_ID,
                    employee: row.Nombre.trim(),
                    period_start: start,
                    period_end: end,
                    amount,
                    currency: 'MXN',
                    notes: `Legacy ID: ${row.ID || 'N/A'}. Base: ${row[' Sueldo Base '] || 0}. M3: ${row['Metros C£bicos'] || row['Metros Cubicos'] || 0}. Trips: ${row.Viajes || 0}. Extra: ${row['Hora Extra'] || 0}. Commission: ${row[' TOTAL COMISI?N '] || 0}. Loan: ${row['DESCTO. PRESTAMO'] || 0}. Comments: ${row.comentarios || ''}`.trim()
                };

                if (!isDryRun) {
                    const { error } = await supabase.from('payroll').insert(payload);
                    if (error) throw error;
                }
                stats.inserted++;
            } catch (err: any) {
                stats.errors++;
                console.error(`Error payroll ID ${row.ID}:`, err.message);
            }
        }));
        console.log(`Processed ${Math.min(i + chunkSize, rows.length)}/${rows.length}...`);
    }

    console.log('\n=== PAYROLL IMPORT COMPLETED ===');
    console.log(JSON.stringify(stats, null, 2));
}

run().catch(console.error);
