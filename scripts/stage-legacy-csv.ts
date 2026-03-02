import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import csv from 'csv-parser';
import crypto from 'crypto';
import * as dotenv from 'dotenv';

dotenv.config({ path: ['.env.local', '.env'] });

type SourceName = 'clientes' | 'pedidos' | 'productos' | 'nomina' | 'gastos';

type SourceConfig = {
  sourceName: SourceName;
  filePath: string;
  tableName: string;
};

const SOURCES: Record<SourceName, SourceConfig> = {
  clientes: { sourceName: 'clientes', filePath: 'csv/clientes.csv', tableName: 'clientes_raw' },
  pedidos: { sourceName: 'pedidos', filePath: 'csv/pedidos.csv', tableName: 'pedidos_raw' },
  productos: { sourceName: 'productos', filePath: 'csv/productos.csv', tableName: 'productos_raw' },
  nomina: { sourceName: 'nomina', filePath: 'csv/nomina.csv', tableName: 'nomina_raw' },
  gastos: { sourceName: 'gastos', filePath: 'csv/gastos.csv', tableName: 'gastos_raw' }
};

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase credentials.');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: { autoRefreshToken: false, persistSession: false }
});

function getArg(name: string): string | undefined {
  return process.argv.find((arg) => arg.startsWith(`--${name}=`))?.split('=')[1];
}

function normalizeHeader(header: string): string {
  return header.replace(/^\uFEFF/, '').trim();
}

function rowHash(sourceName: string, rowNumber: number, payload: Record<string, string>): string {
  return crypto
    .createHash('sha256')
    .update(`${sourceName}|${rowNumber}|${JSON.stringify(payload)}`)
    .digest('hex');
}

async function readRows(filePath: string): Promise<Array<Record<string, string>>> {
  const rows: Array<Record<string, string>> = [];

  await new Promise<void>((resolve, reject) => {
    fs.createReadStream(filePath)
      .pipe(csv({ mapHeaders: ({ header }) => normalizeHeader(header) }))
      .on('data', (row) => rows.push(row as Record<string, string>))
      .on('end', () => resolve())
      .on('error', reject);
  });

  return rows;
}

async function main() {
  const source = (getArg('source') ?? 'all') as SourceName | 'all';
  const dryRun = process.argv.includes('--dry-run');

  const selected = source === 'all' ? Object.values(SOURCES) : [SOURCES[source]];
  if (!selected.length || selected.some((item) => !item)) {
    console.error('Invalid --source value. Use one of: clientes|pedidos|productos|nomina|gastos|all');
    process.exit(1);
  }

  for (const cfg of selected) {
    if (!fs.existsSync(cfg.filePath)) {
      console.error(`Source file not found: ${cfg.filePath}`);
      continue;
    }

    const rows = await readRows(cfg.filePath);
    const batchPayload = {
      source_name: cfg.sourceName,
      source_file: cfg.filePath,
      status: dryRun ? 'partial' : 'running',
      row_count: rows.length,
      error_count: 0,
      metadata_json: { dryRun }
    };

    let batchId = crypto.randomUUID();
    if (!dryRun) {
      const { data, error } = await supabase
        .from('legacy_ingest_batches')
        .insert(batchPayload)
        .select('id')
        .single();

      if (error || !data) {
        console.error(`Could not create batch for ${cfg.sourceName}:`, error?.message);
        continue;
      }
      batchId = data.id;
    }

    const staged = rows.map((raw, index) => ({
      ingest_batch_id: batchId,
      source_file: cfg.filePath,
      row_number: index + 2,
      row_hash: rowHash(cfg.sourceName, index + 2, raw),
      raw_payload_json: raw
    }));

    if (dryRun) {
      console.log(`[dry-run] ${cfg.sourceName}: ${staged.length} rows ready for legacy_staging.${cfg.tableName}`);
      continue;
    }

    const chunkSize = 200;
    let errors = 0;
    for (let i = 0; i < staged.length; i += chunkSize) {
      const chunk = staged.slice(i, i + chunkSize);
      const { error } = await supabase.schema('legacy_staging').from(cfg.tableName).insert(chunk);
      if (error) {
        errors += chunk.length;
        console.error(`${cfg.sourceName} chunk failed (${i}-${i + chunk.length}): ${error.message}`);
      }
    }

    await supabase
      .from('legacy_ingest_batches')
      .update({
        status: errors > 0 ? 'partial' : 'completed',
        error_count: errors,
        completed_at: new Date().toISOString()
      })
      .eq('id', batchId);

    console.log(`Staged ${cfg.sourceName}: batch=${batchId}, rows=${staged.length}, errors=${errors}`);
  }
}

main().catch((err) => {
  console.error('Fatal staging error:', err);
  process.exit(1);
});
