import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import csv from 'csv-parser';
import dotenv from 'dotenv';
import { parse, isValid } from 'date-fns';

dotenv.config({ path: ['.env.local', '.env'] });

const CSV_FILE = 'csv/gastos.csv';
const DEVELOPER_ID = '9d571f48-f267-4665-8f5f-21841df194b9';

interface GastoRow {
    Listo: string;
    ID: string;
    'Fecha de Gasto': string;
    Semana: string;
    Mes: string;
    Año: string;
    Camión: string;
    Descripción: string;
    Categoría: string;
    Cantidad: string;
    'Método de Pago': string;
    'Num Ticket - Factura': string;
    Proveedor: string;
    Observaciones: string;
}

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

const isDryRun = process.argv.includes('--dry-run');

function parseCurrency(val: string): number {
    if (!val) return 0;
    return parseFloat(val.replace(/[$,\s]/g, '')) || 0;
}

function parseDate(val: string): string | null {
    if (!val) return null;
    // Format: 1-Nov-24
    const cleaned = val.trim();
    const formats = ['d-MMM-yy', 'dd-MMM-yy', 'd-MMM-yyyy', 'dd-MMM-yyyy'];
    for (const fmt of formats) {
        const d = parse(cleaned, fmt, new Date());
        if (isValid(d)) return d.toISOString();
    }
    return null;
}

async function run() {
    const rows: GastoRow[] = [];
    console.log(`Starting Phase 3: Expenses... Dry Run: ${isDryRun}`);

    if (!fs.existsSync(CSV_FILE)) {
        console.error(`File not found: ${CSV_FILE}`);
        process.exit(1);
    }

    await new Promise((resolve, reject) => {
        fs.createReadStream(CSV_FILE)
            .pipe(csv({
                mapHeaders: ({ header }) => header.replace(/^\uFEFF/, '').trim()
            }))
            .on('data', (data: any) => {
                // Skip if both ID and Fecha are empty
                if ((data.ID && data.ID.trim() !== '') || (data['Fecha de Gasto'] && data['Fecha de Gasto'].trim() !== '')) {
                    rows.push(data);
                }
            })
            .on('end', resolve)
            .on('error', reject);
    });

    console.log(`Loaded ${rows.length} expenses.`);

    const stats = { total: rows.length, inserted: 0, errors: 0 };

    const chunkSize = 20;
    for (let i = 0; i < rows.length; i += chunkSize) {
        const chunk = rows.slice(i, i + chunkSize);
        await Promise.all(chunk.map(async (row) => {
            try {
                const amount = parseCurrency(row.Cantidad);
                const date = parseDate(row['Fecha de Gasto']);

                if (!date) {
                    if (!row['Fecha de Gasto']) return; // Skip empty date rows
                    throw new Error(`Invalid date: ${row['Fecha de Gasto']}`);
                }

                const payload = {
                    user_id: DEVELOPER_ID,
                    amount,
                    currency: 'MXN',
                    category: row['Categoría'] || 'Uncategorized',
                    expense_date: date,
                    reference: row['Num Ticket - Factura'] || null,
                    notes: `Legacy ID: ${row.ID || 'N/A'}. Desc: ${row['Descripción'] || ''}. Prov: ${row.Proveedor || ''}. Obs: ${row.Observaciones || ''}. Truck: ${row['Camión'] || ''}. Payment: ${row['Método de Pago'] || ''}`.trim()
                };

                if (!isDryRun) {
                    const { error } = await supabase.from('expenses').insert(payload);
                    if (error) throw error;
                }
                stats.inserted++;
            } catch (err: any) {
                stats.errors++;
                console.error(`Error row ID ${row.ID}:`, err.message);
            }
        }));
        console.log(`Processed ${Math.min(i + chunkSize, rows.length)}/${rows.length}...`);
    }

    console.log('\n=== EXPENSES IMPORT COMPLETED ===');
    console.log(JSON.stringify(stats, null, 2));
}

run().catch(console.error);
