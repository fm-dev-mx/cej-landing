import fs from 'fs';
import csv from 'csv-parser';
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
  if (!cleaned || cleaned === '-') return null;
  const n = Number(cleaned);
  return Number.isFinite(n) ? n : null;
}

function normStatus(raw: string | null | undefined): 'active' | 'inactive' {
  return String(raw ?? '').trim().toLowerCase() === 'activo' ? 'active' : 'inactive';
}

function clean(raw: string | null | undefined): string | null {
  const value = String(raw ?? '').trim();
  return value ? value : null;
}

async function main() {
  const rows: Array<Record<string, string>> = [];
  await new Promise<void>((resolve, reject) => {
    fs.createReadStream('csv/productos.csv')
      .pipe(csv({ mapHeaders: ({ header }) => header.replace(/^\uFEFF/, '').trim() }))
      .on('data', (row) => rows.push(row as Record<string, string>))
      .on('end', () => resolve())
      .on('error', reject);
  });

  const payload = rows
    .map((r) => ({
      sku: clean(r.SKU),
      legacy_external_id: clean(r.ID),
      name: clean(r.Producto),
      category: clean(r.Categoría),
      provider_name: clean(r.Proveedor),
      mixer_mode: clean(r['Modalidad de Revolvedora']),
      pump_mode: clean(r['Modalidad Bomba']),
      base_price_mxn: parseMoney(r['Precio sin IVA (m³)']),
      client_price_mxn: parseMoney(r['Precio Clientes']),
      utility_mxn: parseMoney(r.Utilidad),
      status: normStatus(r.Estatus),
      metadata_json: {
        source: 'productos.csv',
        imported_at: new Date().toISOString(),
        imported_via: 'direct_fallback'
      }
    }))
    .filter((r) => r.sku && r.name && r.category);

  const { error } = await supabase.from('products').upsert(payload as never[], { onConflict: 'sku' });
  if (error) {
    console.error('Failed to upsert products:', error.message);
    process.exit(1);
  }

  console.log(JSON.stringify({ totalCsvRows: rows.length, upsertedRows: payload.length }, null, 2));
}

main().catch((err) => {
  console.error('Fatal import-products-direct error:', err);
  process.exit(1);
});
