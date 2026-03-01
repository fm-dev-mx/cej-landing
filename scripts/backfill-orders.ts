/**
 * Backfill orders from a JSON file exported from Excel processing.
 *
 * Usage:
 * pnpm dlx tsx scripts/backfill-orders.ts ./tmp/orders-import.json --batch=2026-03-01
 */
import { createHash } from 'crypto';
import { readFileSync } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import * as dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';

type ImportRow = {
    folio?: string;
    legacyFolioRaw?: string;
    externalRef?: string;
    orderedAt?: string;
    customerName?: string;
    customerPhone?: string;
    deliveryAddressText: string;
    serviceType?: 'bombeado' | 'tirado';
    quantityM3?: number;
    unitPriceBeforeVat?: number;
    vatRate?: number;
    totalBeforeVat?: number;
    totalWithVat: number;
    notes?: string;
};

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, '../.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceRoleKey) {
    console.error('Missing Supabase environment variables. Check .env.local');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceRoleKey, {
    auth: { persistSession: false },
});

function parseArgs() {
    const [, , filePath, ...flags] = process.argv;
    if (!filePath) {
        throw new Error('Missing input file path');
    }

    const batchFlag = flags.find((flag) => flag.startsWith('--batch='));
    const batchId = batchFlag?.split('=')[1] ?? new Date().toISOString().slice(0, 10);

    return { filePath, batchId };
}

function toHash(row: ImportRow) {
    const normalized = JSON.stringify({
        folio: row.folio ?? '',
        orderedAt: row.orderedAt ?? '',
        deliveryAddressText: row.deliveryAddressText ?? '',
        totalWithVat: row.totalWithVat ?? 0,
    });
    return createHash('sha256').update(normalized).digest('hex');
}

async function run() {
    const { filePath, batchId } = parseArgs();
    const absolutePath = path.resolve(process.cwd(), filePath);
    const raw = readFileSync(absolutePath, 'utf-8');
    const rows = JSON.parse(raw) as ImportRow[];

    let inserted = 0;
    let skipped = 0;
    let failed = 0;

    for (const row of rows) {
        const importRowHash = toHash(row);
        const folio = row.folio?.trim() || `LEGACY-${importRowHash.slice(0, 10).toUpperCase()}`;

        const payload = {
            user_id: process.env.BACKFILL_DEFAULT_USER_ID || '',
            folio,
            status: 'draft',
            order_status: 'draft',
            payment_status: 'pending',
            fiscal_status: 'not_requested',
            total_amount: row.totalWithVat,
            total_with_vat: row.totalWithVat,
            total_before_vat: row.totalBeforeVat ?? row.totalWithVat,
            vat_rate: row.vatRate ?? 0.16,
            currency: 'MXN',
            items: [],
            ordered_at: row.orderedAt ?? new Date().toISOString(),
            delivery_address: row.deliveryAddressText,
            delivery_address_text: row.deliveryAddressText,
            service_type: row.serviceType ?? null,
            quantity_m3: row.quantityM3 ?? null,
            unit_price_before_vat: row.unitPriceBeforeVat ?? null,
            balance_amount: row.totalWithVat,
            payments_summary_json: {
                paid_amount: 0,
                balance_amount: row.totalWithVat,
                last_paid_at: null,
            },
            internal_notes: row.notes ?? null,
            legacy_folio_raw: row.legacyFolioRaw ?? null,
            external_ref: row.externalRef ?? null,
            import_source: 'excel_pedidos',
            import_batch_id: batchId,
            import_row_hash: importRowHash,
        };

        if (!payload.user_id) {
            console.error(`Skipping ${folio}: BACKFILL_DEFAULT_USER_ID missing`);
            failed += 1;
            continue;
        }

        const { error } = await supabase
            .from('orders')
            .upsert(payload, { onConflict: 'import_source,import_row_hash', ignoreDuplicates: false });

        if (!error) {
            inserted += 1;
            continue;
        }

        if (/duplicate key value/i.test(error.message)) {
            skipped += 1;
            continue;
        }

        console.error(`Failed row ${folio}: ${error.message}`);
        failed += 1;
    }

    console.warn(JSON.stringify({ inserted, skipped, failed, batchId }, null, 2));
}

run().catch((error) => {
    console.error('Backfill failed', error);
    process.exit(1);
});
