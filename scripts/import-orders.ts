import fs from 'fs';
import csv from 'csv-parser';
import { parse } from 'date-fns';
import { createClient } from '@supabase/supabase-js';
import crypto from 'crypto';
import * as dotenv from 'dotenv';
dotenv.config({ path: ['.env.local', '.env'] });

// Setup Supabase Client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error("Missing Supabase environment variables.");
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey, {
    auth: { autoRefreshToken: false, persistSession: false },
});

// Arguments parsing
const args = process.argv.slice(2);
const isDryRun = args.includes('--dry-run');
const limitArg = args.find(a => a.startsWith('--limit='));
const limit = limitArg ? parseInt(limitArg.split('=')[1], 10) : Infinity;
const mode = args.includes('--mode=normal') ? 'B' : 'A'; // Mode B: Normalize payments, Mode A: Aggregate only
const userIdArg = args.find(a => a.startsWith('--user-id='));
const importUserId = userIdArg ? userIdArg.split('=')[1] : '9d571f48-f267-4665-8f5f-21841df194b9';
const batchSize = 50;

// Enums based on type
type DbOrderStatus = "draft" | "confirmed" | "scheduled" | "in_progress" | "completed" | "cancelled";
type DbPaymentStatus = "pending" | "partial" | "paid" | "overpaid";

console.log(`Starting Import... Dry Run: ${isDryRun}, Limit: ${limit}, Payment Mode: ${mode}`);

// File Paths
const CSV_FILE = 'csv/pedidos.csv';

// Utility Types
type CsvRow = Record<string, string> & {
    '#': string;
    'Fecha de Pedido': string;
    'Cliente': string;
    'Telefono': string;
    'Domicilio de Entrega': string;
    'Vendedor': string;
    'Cantidad': string;
    'Producto': string;
    'Tirado / Bombeado': string;
    'Descripción': string;
    ' Costo x m³ ': string;
    ' Costo total ': string;
    ' Utilidad ': string;
    ' Precio m³ IVA incluido ': string;
    'Total IVA Incluido': string;
    'Forma de Pago Anticipo': string;
    'Anticipo': string;
    'Forma de Pago Abono': string;
    'Abono': string;
    'Pendiente de pago': string;
    'Estatus Servicio': string;
    'Estatus Pago': string;
    'Fecha Programada': string;
    'Hora Programada': string;
    'Año': string;
    'Semana': string;
    'Mes': string;
    'Observaciones': string;
    '# factura': string;
}

// Stats tracking
const stats = {
    totalRows: 0,
    invalidDates: 0,
    invalidPhones: 0,
    unmappedTimes: 0,
    errors: 0,
    warnings: 0,
    enumDistributions: {
        status: {} as Record<string, number>,
        serviceType: {} as Record<string, number>,
        payment: {} as Record<string, number>
    }
};

const errors: any[] = [];
const warnings: any[] = [];
const sampleInserts: any[] = [];

// Cache
const customerIdentityCache = new Map<string, string>(); // IdentityHash -> CustomerId

// 1. Data Sanitization Rules

// Format: 6-Jan-25
function parseLegacyDate(dateStr: string): string | null {
    if (!dateStr || dateStr.trim() === '') return null;
    try {
        const parsed = parse(dateStr.trim(), 'd-MMM-yy', new Date());
        if (isNaN(parsed.getTime())) return null;
        return parsed.toISOString().split('T')[0];
    } catch (e) {
        return null;
    }
}

// Parses currencies: "$2,180.00 ", " $-   ", "($4.00)"
function parseCurrencyString(val: string): string {
    if (!val) return '0.00';
    let s = val.trim();
    if (s === '$-' || s === '-' || s === '') return '0.00';

    // Handle negatives e.g., ($4.50)
    const isNegative = s.startsWith('(') && s.endsWith(')');
    if (isNegative) {
        s = s.slice(1, -1);
    }

    // Remove $ and commas
    s = s.replace(/\$/g, '').replace(/,/g, '').trim();

    // Test validity
    if (isNaN(Number(s))) return '0.00';

    return isNegative ? `-${s}` : s;
}

// Deterministic Identity Generator
function resolveIdentity(row: CsvRow): { key: string, isPhone: boolean, normPhone: string | null } {
    const phone = row['Telefono'] ? row['Telefono'].replace(/\D/g, '') : '';
    const name = row['Cliente']?.trim() || 'Desconocido';
    const addr = row['Domicilio de Entrega']?.trim() || '';

    if (phone.length === 10) {
        return { key: phone, isPhone: true, normPhone: phone };
    }

    const hash = crypto.createHash('sha256').update(`${name}|${addr}`).digest('hex').substring(0, 16);
    return { key: `legacy:${hash}`, isPhone: false, normPhone: null };
}

// 2. Deterministic Status & Scheduling
function mapStatusAndSchedule(row: CsvRow, mappedDate: string | null): {
    order_status: DbOrderStatus,
    slot_code: string | null,
    warnings: string[]
} {
    const rawStatus = row['Estatus Servicio']?.trim().toLowerCase();
    let status: DbOrderStatus = 'draft';
    const itemWarnings: string[] = [];

    let slotCode = mapLegacyTimeToSlotCode(row['Hora Programada']);
    if (!slotCode && row['Hora Programada']?.trim()) {
        itemWarnings.push('UNMAPPED_TIME');
        slotCode = 'legacy_unknown_slot'; // Fallback mapping per requirements
    }

    if (rawStatus === 'cancelado') status = 'cancelled';
    else if (rawStatus === 'finalizado') status = 'completed';
    else if (rawStatus === 'confirmado' || rawStatus === 'programado') {
        if (mappedDate && slotCode) {
            status = 'confirmed';
        } else {
            status = 'confirmed'; // Requirement: Map realistically, but fallback scheduling
            if (!slotCode) slotCode = 'legacy_unknown_slot';
            itemWarnings.push('MISSING_SCHEDULE_DATA');
        }
    }

    // Record stats
    stats.enumDistributions.status[status] = (stats.enumDistributions.status[status] || 0) + 1;
    return { order_status: status, slot_code: slotCode, warnings: itemWarnings };
}

function mapLegacyTimeToSlotCode(timeStr: string): string | null {
    if (!timeStr) return null;
    const s = timeStr.trim().toLowerCase();
    if (s.includes('8am') || s.includes('7am') || s.includes('6am') || s.includes('9am')) return 'M1'; // Morning blocks
    if (s.includes('10am') || s.includes('11am') || s.includes('12pm')) return 'MD'; // Midday
    if (s.includes('1pm') || s.includes('2pm') || s.includes('3pm') || s.includes('4pm') || s.includes('5pm')) return 'T1'; // Afternoon
    return null;
}

function mapPaymentStatus(row: CsvRow): DbPaymentStatus {
    const rawVal = row['Estatus Pago']?.trim()?.toLowerCase();
    if (rawVal === 'pagado' || rawVal === 'liquidado') return 'paid';
    return 'pending'; // In Mode A we don't fully calculate arrays, so pending is safe default for older unresolved items.
}

// No static product catalog; relies on pricing architecture
const rows: CsvRow[] = [];

async function main() {
    fs.createReadStream(CSV_FILE)
        .pipe(csv({
            mapHeaders: ({ header }) => header.replace(/^\uFEFF/, '').trim()
        }))
        .on('data', (data: CsvRow) => {
            // Just load rows in memory for controlled async processing.
            // Using data['#'] or data[Object.keys(data)[0]] to check for BOM-cleaned first column
            const firstKey = Object.keys(data)[0];
            if (rows.length < limit && data[firstKey] && data[firstKey].trim() !== '') {
                rows.push(data);
            }
        })
        .on('end', async () => {
            console.log(`CSV Parsing complete. Loaded ${rows.length} rows.`);
            await processAllRows();
        });
}

async function processAllRows() {
    const batchId = crypto.randomUUID();
    console.log(`Initiating Batch Processing - Batch ID: ${batchId}`);

    const chunkSize = 20;
    for (let i = 0; i < rows.length; i += chunkSize) {
        const chunk = rows.slice(i, i + chunkSize);

        await Promise.all(chunk.map(async (row, chunkIndex) => {
            const absoluteIndex = i + chunkIndex;
            stats.totalRows++;

            const rowWarnings: string[] = [];
            const orderedAt = parseLegacyDate(row['Fecha de Pedido']);
            if (!orderedAt) {
                stats.invalidDates++;
                rowWarnings.push('INVALID_ORDER_DATE');
            }

            const schedDate = parseLegacyDate(row['Fecha Programada']);

            // Resolve Identity
            const identity = resolveIdentity(row);
            if (!identity.isPhone) {
                stats.invalidPhones++;
                rowWarnings.push('INVALID_PHONE_GENERATED_HASH');
            }

            // Map Enum fields
            const { order_status, slot_code, warnings: statusWarnings } = mapStatusAndSchedule(row, schedDate);
            rowWarnings.push(...statusWarnings);
            if (statusWarnings.includes('UNMAPPED_TIME')) stats.unmappedTimes++;

            const serviceType = row['Tirado / Bombeado']?.toLowerCase() === 'bombeado' ? 'bombeado' : 'tirado';
            stats.enumDistributions.serviceType[serviceType] = (stats.enumDistributions.serviceType[serviceType] || 0) + 1;

            const productId = 'legacy_fallback'; // Product string stored in price snapshot, this bypasses the DB constraint for operational state

            // Idempotency Hash
            const rowHashStr = `${row['#']}|${identity.key}|${row['Fecha de Pedido']}|${row[' Costo total ']}`;
            const rowHash = crypto.createHash('sha256').update(rowHashStr).digest('hex');

            // Mapped Postgres Payload
            const mappedPayload = {
                import_source: 'pedidos.csv',
                import_batch_id: batchId,
                import_row_hash: rowHash,
                legacy_folio_raw: row['#']?.toString(),

                // Use a genuine user ID for author to satisfy FK valid_user on orders
                user_id: importUserId,
                created_by: importUserId,

                folio: `LEGACY-${row['#']}`,
                order_status,
                ...((orderedAt || schedDate) && { ordered_at: (orderedAt || schedDate) }), // Add conditional ordered_at so it doesn't fail on missing. Usually 'now' isn't great.

                payment_status: mapPaymentStatus(row),
                service_type: serviceType,
                product_id: productId,
                quantity_m3: Math.max(parseFloat(row['Cantidad']) || 0, order_status === 'draft' ? 0 : 0.01),
                vat_rate: 0.16, // Default required by constraint

                delivery_address_text: row['Domicilio de Entrega']?.trim() || 'Domicilio No Registrado',

                total_before_vat: parseCurrencyString(row[' Costo total ']) || 0,
                total_with_vat: parseCurrencyString(row['Total IVA Incluido']) || 0,
                balance_amount: parseCurrencyString(row['Pendiente de pago']) || 0,
                unit_price_before_vat: parseCurrencyString(row[' Costo x m³ ']) || 0,

                scheduled_date: schedDate,
                scheduled_slot_code: slot_code,
                scheduled_time_label: row['Hora Programada'],
                scheduled_window_start: null,
                scheduled_window_end: null,

                notes: `Imported legacy order. Obs: ${row['Observaciones'] || ''}. Fac: ${row['# factura'] || ''}`,

                // In Mode A, construct basic summary
                payments_summary_json: {
                    total_paid: parseCurrencyString(row['Abono']), // Oversimplified for now
                    payments: []  // Mode B would fulfill this properly
                },
                pricing_snapshot_json: {
                    legacy_raw: true,
                    legacy_product_string: row['Producto']
                }
            };

            if (rowWarnings.length > 0) {
                warnings.push({ folio: row['#'], customer: row['Cliente'], warnings: rowWarnings.join('|') });
                stats.warnings++;
            }

            if (absoluteIndex < 5 && isDryRun) {
                sampleInserts.push(mappedPayload);
            }

            // Stop execution if DRY RUN
            if (!isDryRun) {
                let customerId = customerIdentityCache.get(identity.key);

                if (!customerId && identity.isPhone) {
                    // Fetch from existing DB
                    const { data, error } = await supabase
                        .from('customer_identities')
                        .select('customer_id')
                        .eq('type', 'phone')
                        .eq('value_norm', identity.normPhone)
                        .limit(1)
                        .maybeSingle();

                    if (error) {
                        console.error(`DB Error resolving customer for phone ${identity.normPhone}:`, error);
                        errors.push({ folio: row['#'], error: error.message || 'Unknown' });
                        stats.errors++;
                        return;
                    }

                    if (data?.customer_id) {
                        customerId = data.customer_id;
                        customerIdentityCache.set(identity.key, data.customer_id);
                    }
                }

                if (!customerId) {
                    // Determine synthetic identity key from hash if phone is missing
                    const syntheticKey = identity.key.startsWith('anon:') ? identity.key.slice(5) : crypto.randomUUID();

                    console.warn(`Missing Customer Match for order ${row['#']}, generating synthetic customer...`);

                    const newCustomerId = crypto.randomUUID();
                    const { error: custErr } = await supabase.from('customers').insert({
                        id: newCustomerId,
                        display_name: row['Cliente']?.trim() || 'Cliente Sin Nombre (Import)',
                        identity_status: 'unverified'
                    });

                    if (custErr) {
                        console.error('Failed creating synthetic customer:', custErr);
                        errors.push({ folio: row['#'], error: 'Failed synthetic customer: ' + custErr.message });
                        stats.errors++;
                        return;
                    }

                    const { error: identErr } = await supabase.from('customer_identities').insert({
                        customer_id: newCustomerId,
                        type: 'visitor_id',
                        value_norm: syntheticKey,
                        is_primary: true
                    } as any);

                    if (identErr) {
                        console.error('Failed creating synthetic identity:', identErr);
                    }

                    customerId = newCustomerId;
                    customerIdentityCache.set(identity.key, customerId);
                }

                // 2. Ensure Order Exists - Find First
                let orderData;
                let orderErr;

                if (mappedPayload.legacy_folio_raw) {
                    const { data, error } = await supabase
                        .from('orders')
                        .select('id')
                        .eq('import_source', mappedPayload.import_source)
                        .eq('legacy_folio_raw', mappedPayload.legacy_folio_raw)
                        .maybeSingle();
                    orderData = data;
                    orderErr = error;
                }

                if (!orderData) {
                    // Try hash fallback before insert
                    const { data: hashData, error: hashErr } = await supabase
                        .from('orders')
                        .select('id')
                        .eq('import_source', mappedPayload.import_source)
                        .eq('import_row_hash', mappedPayload.import_row_hash)
                        .maybeSingle();

                    if (hashData) {
                        orderData = hashData;
                    } else {
                        const { data: newData, error: newErr } = await supabase
                            .from('orders')
                            .insert({ ...mappedPayload, customer_id: customerId } as any)
                            .select('id')
                            .single();

                        orderData = newData;
                        orderErr = newErr;
                    }
                }

                if (orderErr) {
                    console.error(`Error resolving order for row ${row['#']}:`, orderErr);
                    errors.push({ folio: row['#'], error: (orderErr?.message as string) || 'Unknown Order Error' });
                    stats.errors++;
                }
            }
        }));

        console.log(`Processed ${Math.min(i + chunkSize, rows.length)}/${rows.length}...`);
    }

    // Finish reporting
    console.log('\n=== IMPORT COMPLETED ===');
    console.log(JSON.stringify(stats, null, 2));

    fs.writeFileSync('report.json', JSON.stringify(stats, null, 2));
    fs.writeFileSync('sample_inserts.json', JSON.stringify(sampleInserts, null, 2));

    const warningsCsv = warnings.map(w => `"${w.folio}","${w.customer}","${w.warnings}"`).join('\n');
    fs.writeFileSync('warnings.csv', "folio,customer,warnings\n" + warningsCsv);

    console.log('Artifacts generated: report.json, sample_inserts.json, warnings.csv');
}

main().catch(err => {
    console.error("Fatal error:", err);
    process.exit(1);
});
