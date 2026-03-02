import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import csv from 'csv-parser';
import dotenv from 'dotenv';
import crypto from 'crypto';

dotenv.config({ path: ['.env.local', '.env'] });

const CSV_FILE = 'csv/clientes.csv';

// Utility Types
interface ClienteRow {
    ID: string;
    'Fecha de Registro': string;
    'Cliente / Razón Social': string;
    'Teléfono': string;
    'Total Comprado': string;
    'Saldo Pendiente': string;
    'Facturación': string;
    'Email': string;
    'RFC': string;
    'CP': string;
    'REGIMEN': string;
    'USO DEL CFDI': string;
    'Calidad del Cliente': string;
    'Observaciones': string;
}

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error('Fatal: Supabase credentials missing.');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey, {
    auth: { autoRefreshToken: false, persistSession: false }
});

const isDryRun = process.argv.includes('--dry-run');
const limitArg = process.argv.find(arg => arg.startsWith('--limit='));
const limit = limitArg ? parseInt(limitArg.split('=')[1], 10) : Infinity;

console.log(`Starting Import Phase 1: Clientes... Dry Run: ${isDryRun}, Limit: ${limit}`);

function normalizePhone(raw: string | undefined): string | null {
    if (!raw) return null;
    const digits = raw.replace(/\D/g, '');
    return digits.length === 10 ? digits : null;
}

async function run() {
    const rows: ClienteRow[] = [];
    let parsedCount = 0;

    await new Promise((resolve, reject) => {
        fs.createReadStream(CSV_FILE)
            .pipe(csv())
            .on('data', (data: any) => {
                if (Object.keys(data).length < 2) return;
                if (parsedCount < limit) {
                    rows.push(data as ClienteRow);
                    parsedCount++;
                }
            })
            .on('end', resolve)
            .on('error', reject);
    });

    console.log(`CSV Parsing complete. Loaded ${rows.length} valid client rows.`);
    const batchId = crypto.randomUUID();
    console.log(`Initiating Batch Processing - Batch ID: ${batchId}`);

    const stats = {
        totalRows: rows.length,
        errors: 0,
        inserted: 0,
        invalidPhones: 0,
    };

    const errorLog: any[] = [];

    const chunkSize = 20;
    for (let i = 0; i < rows.length; i += chunkSize) {
        const chunk = rows.slice(i, i + chunkSize);

        await Promise.all(chunk.map(async (row, chunkIndex) => {
            const absoluteIndex = i + chunkIndex;
            try {
                const rawName = row['Cliente / Razón Social']?.trim();
                if (!rawName) return;

                const phoneNorm = normalizePhone(row['Teléfono']);
                if (!phoneNorm) {
                    stats.invalidPhones++;
                }

                const emailRaw = row['Email']?.trim()?.toLowerCase();
                const emailNorm = emailRaw && emailRaw.includes('@') ? emailRaw : null;

                let identity_status = 'unverified';
                if (phoneNorm && phoneNorm.length === 10) {
                    identity_status = 'verified';
                }

                const customerId = crypto.randomUUID();

                const stringToHash = `clientes|${rawName}|${row['Teléfono']}`;
                const rowHash = crypto.createHash('sha256').update(stringToHash).digest('hex');

                const customerPayload = {
                    id: customerId,
                    display_name: rawName,
                    primary_phone_norm: phoneNorm,
                    primary_email_norm: emailNorm,
                    identity_status,
                };

                const identitiesPayload = [];
                if (phoneNorm) {
                    identitiesPayload.push({
                        customer_id: customerId,
                        type: 'phone',
                        value_norm: phoneNorm,
                        is_primary: true
                    });
                }

                if (!isDryRun) {
                    let finalCustomerId = customerId;

                    if (phoneNorm) {
                        const { data: existingPhone } = await supabase
                            .from('customer_identities')
                            .select('customer_id')
                            .eq('type', 'phone')
                            .eq('value_norm', phoneNorm)
                            .limit(1)
                            .maybeSingle();

                        if (existingPhone) {
                            finalCustomerId = existingPhone.customer_id;
                        } else {
                            const { error: custErr } = await supabase.from('customers').insert({ ...customerPayload, id: finalCustomerId });
                            if (custErr) throw custErr;

                            const { error: identErr } = await supabase.from('customer_identities').insert(identitiesPayload.map(x => ({ ...x, customer_id: finalCustomerId })));
                            if (identErr) throw identErr;
                            stats.inserted++;
                        }
                    } else {
                        const { error: custErr } = await supabase.from('customers').insert({ ...customerPayload, id: finalCustomerId });
                        if (custErr) throw custErr;
                        stats.inserted++;
                    }
                } else {
                    stats.inserted++;
                }

            } catch (err: any) {
                stats.errors++;
                errorLog.push({ row: absoluteIndex + 2, error: err.message || err.toString(), dump: row });
                console.error(`Row ${absoluteIndex + 2} failed:`, err.message);
            }
        }));

        console.log(`Processed ${Math.min(i + chunkSize, rows.length)}/${rows.length}...`);
    }

    console.log('\n=== IMPORT COMPLETED ===');
    console.log(JSON.stringify(stats, null, 2));

    fs.writeFileSync('report-clientes.json', JSON.stringify(stats, null, 2));
    if (errorLog.length > 0) {
        fs.writeFileSync('errors-clientes.json', JSON.stringify(errorLog, null, 2));
        console.log(`Written ${errorLog.length} errors to errors-clientes.json`);
        process.exit(1);
    } else {
        process.exit(0);
    }
}

run().catch(console.error);
