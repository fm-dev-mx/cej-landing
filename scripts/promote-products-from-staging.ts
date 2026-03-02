import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';

dotenv.config({ path: ['.env.local', '.env'] });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase credentials.');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: { autoRefreshToken: false, persistSession: false }
});

function parseMoney(raw: string | null | undefined): number | null {
  if (!raw) return null;
  const cleaned = raw.replace(/[$,\s]/g, '').trim();
  if (!cleaned) return null;
  const n = Number(cleaned);
  return Number.isFinite(n) ? n : null;
}

function normStatus(raw: string | null | undefined): 'active' | 'inactive' {
  return String(raw ?? '').trim().toLowerCase() === 'activo' ? 'active' : 'inactive';
}

function normalizeText(raw: string | null | undefined): string | null {
  const value = String(raw ?? '').trim();
  return value.length > 0 ? value : null;
}

async function main() {
  const batchId = process.argv.find((arg) => arg.startsWith('--batch-id='))?.split('=')[1];

  if (!batchId) {
    console.error('Missing required argument: --batch-id=<uuid>');
    process.exit(1);
  }

  const { data: rawRows, error: rawErr } = await supabase
    .schema('legacy_staging')
    .from('productos_raw')
    .select('row_hash, raw_payload_json')
    .eq('ingest_batch_id', batchId);

  if (rawErr) {
    console.error('Could not read productos_raw:', rawErr.message);
    process.exit(1);
  }

  const normRows = (rawRows ?? []).map((row) => {
    const payload = (row.raw_payload_json ?? {}) as Record<string, string>;
    const sku = normalizeText(payload.SKU);
    const name = normalizeText(payload.Producto);
    const base = parseMoney(payload['Precio sin IVA (m³)']);

    const errors: string[] = [];
    if (!sku) errors.push('MISSING_SKU');
    if (!name) errors.push('MISSING_PRODUCT_NAME');
    if (base === null) errors.push('MISSING_BASE_PRICE');

    return {
      ingest_batch_id: batchId,
      row_hash: row.row_hash,
      sku,
      name,
      category: normalizeText(payload.Categoría),
      provider_name: normalizeText(payload.Proveedor),
      mixer_mode: normalizeText(payload['Modalidad de Revolvedora']),
      pump_mode: normalizeText(payload['Modalidad Bomba']),
      base_price_mxn: base,
      client_price_mxn: parseMoney(payload['Precio Clientes']),
      utility_mxn: parseMoney(payload['Utilidad']),
      status: normStatus(payload.Estatus),
      normalization_status: errors.length ? 'rejected' : 'ready',
      normalization_errors: errors.length ? errors : null,
      resolved_product_sku: errors.length ? null : sku
    };
  });

  const { error: clearErr } = await supabase
    .schema('legacy_staging')
    .from('productos_norm')
    .delete()
    .eq('ingest_batch_id', batchId);

  if (clearErr) {
    console.error('Could not reset productos_norm for batch:', clearErr.message);
    process.exit(1);
  }

  if (normRows.length > 0) {
    const { error: insertNormErr } = await supabase
      .schema('legacy_staging')
      .from('productos_norm')
      .insert(normRows as never[]);

    if (insertNormErr) {
      console.error('Could not insert productos_norm rows:', insertNormErr.message);
      process.exit(1);
    }
  }

  const readyRows = normRows.filter((r) => r.normalization_status === 'ready');
  if (readyRows.length > 0) {
    const productsPayload = readyRows.map((r) => ({
      sku: r.sku,
      legacy_external_id: r.row_hash,
      name: r.name,
      category: r.category ?? 'Sin categoría',
      provider_name: r.provider_name,
      mixer_mode: r.mixer_mode,
      pump_mode: r.pump_mode,
      base_price_mxn: r.base_price_mxn,
      client_price_mxn: r.client_price_mxn,
      utility_mxn: r.utility_mxn,
      status: r.status,
      metadata_json: {
        source: 'productos.csv',
        batch_id: batchId
      }
    }));

    const { error: upsertErr } = await supabase
      .from('products')
      .upsert(productsPayload, { onConflict: 'sku' });

    if (upsertErr) {
      console.error('Could not upsert products:', upsertErr.message);
      process.exit(1);
    }
  }

  const rejected = normRows.filter((r) => r.normalization_status === 'rejected');
  if (rejected.length > 0) {
    const rejectsPayload = rejected.map((r, i) => ({
      ingest_batch_id: batchId,
      source_name: 'productos',
      row_number: i + 1,
      row_hash: r.row_hash,
      reason_code: 'NORMALIZATION_ERROR',
      reason_detail: (r.normalization_errors ?? []).join('|'),
      raw_payload_json: { sku: r.sku, name: r.name }
    }));

    await supabase.from('legacy_row_rejections').insert(rejectsPayload as never[]);
  }

  console.log(
    JSON.stringify(
      {
        batchId,
        total: normRows.length,
        ready: readyRows.length,
        rejected: rejected.length
      },
      null,
      2
    )
  );
}

main().catch((err) => {
  console.error('Fatal product promotion error:', err);
  process.exit(1);
});
