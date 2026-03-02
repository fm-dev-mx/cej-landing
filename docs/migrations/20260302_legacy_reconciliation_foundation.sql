BEGIN;

CREATE SCHEMA IF NOT EXISTS legacy_staging;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'record_origin_enum') THEN
    CREATE TYPE public.record_origin_enum AS ENUM ('legacy_import', 'system_captured');
  END IF;
END $$;

CREATE TABLE IF NOT EXISTS public.legacy_ingest_batches (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  source_name text NOT NULL,
  source_file text NOT NULL,
  file_sha256 text,
  started_at timestamptz NOT NULL DEFAULT now(),
  completed_at timestamptz,
  status text NOT NULL DEFAULT 'running' CHECK (status IN ('running', 'completed', 'failed', 'partial')),
  row_count integer NOT NULL DEFAULT 0,
  error_count integer NOT NULL DEFAULT 0,
  metadata_json jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_by uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.legacy_ingest_batches ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "legacy_ingest_batches service_role all" ON public.legacy_ingest_batches;
CREATE POLICY "legacy_ingest_batches service_role all" ON public.legacy_ingest_batches FOR ALL TO service_role USING (true) WITH CHECK (true);

DROP TRIGGER IF EXISTS set_legacy_ingest_batches_updated_at ON public.legacy_ingest_batches;
CREATE TRIGGER set_legacy_ingest_batches_updated_at
  BEFORE UPDATE ON public.legacy_ingest_batches
  FOR EACH ROW EXECUTE PROCEDURE public.set_updated_at();

CREATE TABLE IF NOT EXISTS public.legacy_row_rejections (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  ingest_batch_id uuid REFERENCES public.legacy_ingest_batches(id) ON DELETE CASCADE,
  source_name text NOT NULL,
  row_number integer NOT NULL,
  row_hash text,
  reason_code text NOT NULL,
  reason_detail text,
  raw_payload_json jsonb NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.legacy_row_rejections ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "legacy_row_rejections service_role all" ON public.legacy_row_rejections;
CREATE POLICY "legacy_row_rejections service_role all" ON public.legacy_row_rejections FOR ALL TO service_role USING (true) WITH CHECK (true);

CREATE TABLE IF NOT EXISTS public.products (
  sku text PRIMARY KEY,
  legacy_external_id text,
  name text NOT NULL,
  category text NOT NULL,
  provider_name text,
  mixer_mode text,
  pump_mode text,
  base_price_mxn numeric(12,2),
  client_price_mxn numeric(12,2),
  utility_mxn numeric(12,2),
  status text NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
  metadata_json jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "products service_role all" ON public.products;
CREATE POLICY "products service_role all" ON public.products FOR ALL TO service_role USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "products authenticated read" ON public.products;
CREATE POLICY "products authenticated read" ON public.products FOR SELECT TO authenticated USING (true);

DROP TRIGGER IF EXISTS set_products_updated_at ON public.products;
CREATE TRIGGER set_products_updated_at
  BEFORE UPDATE ON public.products
  FOR EACH ROW EXECUTE PROCEDURE public.set_updated_at();

CREATE TABLE IF NOT EXISTS public.vendors (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  name text NOT NULL UNIQUE,
  tax_id text,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.vendors ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "vendors service_role all" ON public.vendors;
CREATE POLICY "vendors service_role all" ON public.vendors FOR ALL TO service_role USING (true) WITH CHECK (true);

DROP TRIGGER IF EXISTS set_vendors_updated_at ON public.vendors;
CREATE TRIGGER set_vendors_updated_at
  BEFORE UPDATE ON public.vendors
  FOR EACH ROW EXECUTE PROCEDURE public.set_updated_at();

CREATE TABLE IF NOT EXISTS public.assets (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  code text NOT NULL UNIQUE,
  label text,
  asset_type text NOT NULL DEFAULT 'truck' CHECK (asset_type IN ('truck', 'pump', 'other')),
  active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.assets ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "assets service_role all" ON public.assets;
CREATE POLICY "assets service_role all" ON public.assets FOR ALL TO service_role USING (true) WITH CHECK (true);

DROP TRIGGER IF EXISTS set_assets_updated_at ON public.assets;
CREATE TRIGGER set_assets_updated_at
  BEFORE UPDATE ON public.assets
  FOR EACH ROW EXECUTE PROCEDURE public.set_updated_at();

CREATE TABLE IF NOT EXISTS public.employees (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  full_name text NOT NULL UNIQUE,
  status text NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
  hired_at date,
  left_at date,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.employees ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "employees service_role all" ON public.employees;
CREATE POLICY "employees service_role all" ON public.employees FOR ALL TO service_role USING (true) WITH CHECK (true);

DROP TRIGGER IF EXISTS set_employees_updated_at ON public.employees;
CREATE TRIGGER set_employees_updated_at
  BEFORE UPDATE ON public.employees
  FOR EACH ROW EXECUTE PROCEDURE public.set_updated_at();

CREATE TABLE IF NOT EXISTS public.payment_methods (
  code text PRIMARY KEY,
  label text NOT NULL,
  active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.payment_methods ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "payment_methods service_role all" ON public.payment_methods;
CREATE POLICY "payment_methods service_role all" ON public.payment_methods FOR ALL TO service_role USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "payment_methods authenticated read" ON public.payment_methods;
CREATE POLICY "payment_methods authenticated read" ON public.payment_methods FOR SELECT TO authenticated USING (true);

DROP TRIGGER IF EXISTS set_payment_methods_updated_at ON public.payment_methods;
CREATE TRIGGER set_payment_methods_updated_at
  BEFORE UPDATE ON public.payment_methods
  FOR EACH ROW EXECUTE PROCEDURE public.set_updated_at();

CREATE TABLE IF NOT EXISTS public.expense_categories (
  code text PRIMARY KEY,
  label text NOT NULL,
  active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.expense_categories ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "expense_categories service_role all" ON public.expense_categories;
CREATE POLICY "expense_categories service_role all" ON public.expense_categories FOR ALL TO service_role USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "expense_categories authenticated read" ON public.expense_categories;
CREATE POLICY "expense_categories authenticated read" ON public.expense_categories FOR SELECT TO authenticated USING (true);

DROP TRIGGER IF EXISTS set_expense_categories_updated_at ON public.expense_categories;
CREATE TRIGGER set_expense_categories_updated_at
  BEFORE UPDATE ON public.expense_categories
  FOR EACH ROW EXECUTE PROCEDURE public.set_updated_at();

CREATE TABLE IF NOT EXISTS public.service_status_legacy_map (
  legacy_status text PRIMARY KEY,
  mapped_order_status public.order_status_enum NOT NULL,
  requires_attention boolean NOT NULL DEFAULT false,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.service_status_legacy_map ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "service_status_legacy_map service_role all" ON public.service_status_legacy_map;
CREATE POLICY "service_status_legacy_map service_role all" ON public.service_status_legacy_map FOR ALL TO service_role USING (true) WITH CHECK (true);

DROP TRIGGER IF EXISTS set_service_status_legacy_map_updated_at ON public.service_status_legacy_map;
CREATE TRIGGER set_service_status_legacy_map_updated_at
  BEFORE UPDATE ON public.service_status_legacy_map
  FOR EACH ROW EXECUTE PROCEDURE public.set_updated_at();

INSERT INTO public.products (sku, name, category, status, metadata_json)
VALUES ('legacy_fallback', 'Legacy Fallback Product', 'legacy', 'inactive', '{"system":true}'::jsonb)
ON CONFLICT (sku) DO NOTHING;

ALTER TABLE public.orders
  ADD COLUMN IF NOT EXISTS legacy_product_raw text,
  ADD COLUMN IF NOT EXISTS record_origin public.record_origin_enum NOT NULL DEFAULT 'system_captured',
  ADD COLUMN IF NOT EXISTS source_batch_id uuid;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'orders_product_id_fkey'
      AND conrelid = 'public.orders'::regclass
  ) THEN
    ALTER TABLE public.orders
      ADD CONSTRAINT orders_product_id_fkey
      FOREIGN KEY (product_id) REFERENCES public.products(sku)
      ON DELETE RESTRICT;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'orders_source_batch_id_fkey'
      AND conrelid = 'public.orders'::regclass
  ) THEN
    ALTER TABLE public.orders
      ADD CONSTRAINT orders_source_batch_id_fkey
      FOREIGN KEY (source_batch_id) REFERENCES public.legacy_ingest_batches(id)
      ON DELETE SET NULL;
  END IF;
END $$;

ALTER TABLE public.customers
  ADD COLUMN IF NOT EXISTS rfc text,
  ADD COLUMN IF NOT EXISTS billing_enabled boolean,
  ADD COLUMN IF NOT EXISTS billing_regimen text,
  ADD COLUMN IF NOT EXISTS cfdi_use text,
  ADD COLUMN IF NOT EXISTS postal_code text,
  ADD COLUMN IF NOT EXISTS quality_tier text,
  ADD COLUMN IF NOT EXISTS legacy_notes text;

ALTER TABLE public.expenses
  ADD COLUMN IF NOT EXISTS vendor_id uuid,
  ADD COLUMN IF NOT EXISTS asset_id uuid,
  ADD COLUMN IF NOT EXISTS payment_method_code text,
  ADD COLUMN IF NOT EXISTS is_reconciled boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS legacy_external_id text,
  ADD COLUMN IF NOT EXISTS record_origin public.record_origin_enum NOT NULL DEFAULT 'system_captured',
  ADD COLUMN IF NOT EXISTS source_batch_id uuid;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'expenses_vendor_id_fkey' AND conrelid = 'public.expenses'::regclass
  ) THEN
    ALTER TABLE public.expenses
      ADD CONSTRAINT expenses_vendor_id_fkey FOREIGN KEY (vendor_id) REFERENCES public.vendors(id) ON DELETE SET NULL;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'expenses_asset_id_fkey' AND conrelid = 'public.expenses'::regclass
  ) THEN
    ALTER TABLE public.expenses
      ADD CONSTRAINT expenses_asset_id_fkey FOREIGN KEY (asset_id) REFERENCES public.assets(id) ON DELETE SET NULL;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'expenses_payment_method_code_fkey' AND conrelid = 'public.expenses'::regclass
  ) THEN
    ALTER TABLE public.expenses
      ADD CONSTRAINT expenses_payment_method_code_fkey FOREIGN KEY (payment_method_code) REFERENCES public.payment_methods(code) ON DELETE SET NULL;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'expenses_source_batch_id_fkey' AND conrelid = 'public.expenses'::regclass
  ) THEN
    ALTER TABLE public.expenses
      ADD CONSTRAINT expenses_source_batch_id_fkey FOREIGN KEY (source_batch_id) REFERENCES public.legacy_ingest_batches(id) ON DELETE SET NULL;
  END IF;
END $$;

ALTER TABLE public.payroll
  ADD COLUMN IF NOT EXISTS employee_id uuid,
  ADD COLUMN IF NOT EXISTS base_salary numeric(12,2),
  ADD COLUMN IF NOT EXISTS commission_amount numeric(12,2),
  ADD COLUMN IF NOT EXISTS loan_discount numeric(12,2),
  ADD COLUMN IF NOT EXISTS overtime_amount numeric(12,2),
  ADD COLUMN IF NOT EXISTS trip_amount numeric(12,2),
  ADD COLUMN IF NOT EXISTS volume_m3 numeric(12,2),
  ADD COLUMN IF NOT EXISTS days_worked numeric(6,2),
  ADD COLUMN IF NOT EXISTS legacy_external_id text,
  ADD COLUMN IF NOT EXISTS record_origin public.record_origin_enum NOT NULL DEFAULT 'system_captured',
  ADD COLUMN IF NOT EXISTS source_batch_id uuid;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'payroll_employee_id_fkey' AND conrelid = 'public.payroll'::regclass
  ) THEN
    ALTER TABLE public.payroll
      ADD CONSTRAINT payroll_employee_id_fkey FOREIGN KEY (employee_id) REFERENCES public.employees(id) ON DELETE SET NULL;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'payroll_source_batch_id_fkey' AND conrelid = 'public.payroll'::regclass
  ) THEN
    ALTER TABLE public.payroll
      ADD CONSTRAINT payroll_source_batch_id_fkey FOREIGN KEY (source_batch_id) REFERENCES public.legacy_ingest_batches(id) ON DELETE SET NULL;
  END IF;
END $$;

CREATE TABLE IF NOT EXISTS legacy_staging.clientes_raw (
  id bigserial PRIMARY KEY,
  ingest_batch_id uuid NOT NULL REFERENCES public.legacy_ingest_batches(id) ON DELETE CASCADE,
  source_file text NOT NULL DEFAULT 'clientes.csv',
  row_number integer NOT NULL,
  row_hash text NOT NULL,
  raw_payload_json jsonb NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(ingest_batch_id, row_hash)
);

CREATE TABLE IF NOT EXISTS legacy_staging.pedidos_raw (
  id bigserial PRIMARY KEY,
  ingest_batch_id uuid NOT NULL REFERENCES public.legacy_ingest_batches(id) ON DELETE CASCADE,
  source_file text NOT NULL DEFAULT 'pedidos.csv',
  row_number integer NOT NULL,
  row_hash text NOT NULL,
  raw_payload_json jsonb NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(ingest_batch_id, row_hash)
);

CREATE TABLE IF NOT EXISTS legacy_staging.productos_raw (
  id bigserial PRIMARY KEY,
  ingest_batch_id uuid NOT NULL REFERENCES public.legacy_ingest_batches(id) ON DELETE CASCADE,
  source_file text NOT NULL DEFAULT 'productos.csv',
  row_number integer NOT NULL,
  row_hash text NOT NULL,
  raw_payload_json jsonb NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(ingest_batch_id, row_hash)
);

CREATE TABLE IF NOT EXISTS legacy_staging.nomina_raw (
  id bigserial PRIMARY KEY,
  ingest_batch_id uuid NOT NULL REFERENCES public.legacy_ingest_batches(id) ON DELETE CASCADE,
  source_file text NOT NULL DEFAULT 'nomina.csv',
  row_number integer NOT NULL,
  row_hash text NOT NULL,
  raw_payload_json jsonb NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(ingest_batch_id, row_hash)
);

CREATE TABLE IF NOT EXISTS legacy_staging.gastos_raw (
  id bigserial PRIMARY KEY,
  ingest_batch_id uuid NOT NULL REFERENCES public.legacy_ingest_batches(id) ON DELETE CASCADE,
  source_file text NOT NULL DEFAULT 'gastos.csv',
  row_number integer NOT NULL,
  row_hash text NOT NULL,
  raw_payload_json jsonb NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(ingest_batch_id, row_hash)
);

CREATE TABLE IF NOT EXISTS legacy_staging.clientes_norm (
  id bigserial PRIMARY KEY,
  ingest_batch_id uuid NOT NULL REFERENCES public.legacy_ingest_batches(id) ON DELETE CASCADE,
  row_hash text NOT NULL,
  display_name text,
  phone_norm text,
  email_norm text,
  rfc text,
  total_comprado_mxn numeric(12,2),
  saldo_pendiente_mxn numeric(12,2),
  normalization_status text NOT NULL DEFAULT 'pending' CHECK (normalization_status IN ('pending', 'ready', 'rejected')),
  normalization_errors text[],
  resolved_customer_id uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(ingest_batch_id, row_hash)
);

CREATE TABLE IF NOT EXISTS legacy_staging.pedidos_norm (
  id bigserial PRIMARY KEY,
  ingest_batch_id uuid NOT NULL REFERENCES public.legacy_ingest_batches(id) ON DELETE CASCADE,
  row_hash text NOT NULL,
  legacy_folio_raw text,
  product_sku text,
  legacy_product_raw text,
  order_status_mapped public.order_status_enum,
  payment_status_raw text,
  customer_phone_norm text,
  total_with_vat numeric(12,2),
  ordered_at date,
  scheduled_date date,
  normalization_status text NOT NULL DEFAULT 'pending' CHECK (normalization_status IN ('pending', 'ready', 'rejected')),
  normalization_errors text[],
  resolved_customer_id uuid,
  resolved_order_id uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(ingest_batch_id, row_hash)
);

CREATE TABLE IF NOT EXISTS legacy_staging.productos_norm (
  id bigserial PRIMARY KEY,
  ingest_batch_id uuid NOT NULL REFERENCES public.legacy_ingest_batches(id) ON DELETE CASCADE,
  row_hash text NOT NULL,
  sku text,
  name text,
  category text,
  provider_name text,
  mixer_mode text,
  pump_mode text,
  base_price_mxn numeric(12,2),
  client_price_mxn numeric(12,2),
  utility_mxn numeric(12,2),
  status text,
  normalization_status text NOT NULL DEFAULT 'pending' CHECK (normalization_status IN ('pending', 'ready', 'rejected')),
  normalization_errors text[],
  resolved_product_sku text,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(ingest_batch_id, row_hash)
);

CREATE TABLE IF NOT EXISTS legacy_staging.nomina_norm (
  id bigserial PRIMARY KEY,
  ingest_batch_id uuid NOT NULL REFERENCES public.legacy_ingest_batches(id) ON DELETE CASCADE,
  row_hash text NOT NULL,
  employee_name text,
  period_start date,
  period_end date,
  total_amount numeric(12,2),
  base_salary numeric(12,2),
  commission_amount numeric(12,2),
  loan_discount numeric(12,2),
  overtime_amount numeric(12,2),
  trip_amount numeric(12,2),
  volume_m3 numeric(12,2),
  days_worked numeric(6,2),
  normalization_status text NOT NULL DEFAULT 'pending' CHECK (normalization_status IN ('pending', 'ready', 'rejected')),
  normalization_errors text[],
  resolved_employee_id uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(ingest_batch_id, row_hash)
);

CREATE TABLE IF NOT EXISTS legacy_staging.gastos_norm (
  id bigserial PRIMARY KEY,
  ingest_batch_id uuid NOT NULL REFERENCES public.legacy_ingest_batches(id) ON DELETE CASCADE,
  row_hash text NOT NULL,
  legacy_external_id text,
  expense_date date,
  amount_mxn numeric(12,2),
  category_raw text,
  payment_method_raw text,
  vendor_name text,
  asset_code text,
  reference text,
  normalization_status text NOT NULL DEFAULT 'pending' CHECK (normalization_status IN ('pending', 'ready', 'rejected')),
  normalization_errors text[],
  resolved_vendor_id uuid,
  resolved_asset_id uuid,
  resolved_payment_method_code text,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(ingest_batch_id, row_hash)
);

CREATE SCHEMA IF NOT EXISTS analytics;

CREATE OR REPLACE VIEW analytics.v_orders_unified AS
SELECT
  o.id,
  o.folio,
  o.record_origin,
  o.source_batch_id,
  o.legacy_folio_raw,
  o.order_status,
  o.payment_status,
  o.product_id,
  o.legacy_product_raw,
  p.name AS product_name,
  o.total_with_vat,
  o.balance_amount,
  o.ordered_at,
  o.scheduled_date,
  (o.product_id IS NULL OR p.sku IS NULL) AS missing_fk,
  (o.legacy_product_raw IS NOT NULL AND p.sku = 'legacy_fallback') AS is_incomplete
FROM public.orders o
LEFT JOIN public.products p ON p.sku = o.product_id;

CREATE OR REPLACE VIEW analytics.v_expenses_unified AS
SELECT
  e.id,
  e.record_origin,
  e.source_batch_id,
  e.legacy_external_id,
  e.expense_date,
  e.amount,
  e.category,
  e.payment_method_code,
  pm.label AS payment_method_label,
  e.vendor_id,
  v.name AS vendor_name,
  e.asset_id,
  a.code AS asset_code,
  e.reference,
  e.notes,
  (e.vendor_id IS NULL OR v.id IS NULL OR e.payment_method_code IS NULL OR pm.code IS NULL) AS is_incomplete
FROM public.expenses e
LEFT JOIN public.vendors v ON v.id = e.vendor_id
LEFT JOIN public.assets a ON a.id = e.asset_id
LEFT JOIN public.payment_methods pm ON pm.code = e.payment_method_code;

CREATE OR REPLACE VIEW analytics.v_payroll_unified AS
SELECT
  p.id,
  p.record_origin,
  p.source_batch_id,
  p.legacy_external_id,
  p.employee,
  p.employee_id,
  e.full_name AS employee_name_resolved,
  p.period_start,
  p.period_end,
  p.amount,
  p.base_salary,
  p.commission_amount,
  p.loan_discount,
  p.overtime_amount,
  p.trip_amount,
  p.volume_m3,
  p.days_worked,
  (p.employee_id IS NULL OR e.id IS NULL) AS is_incomplete
FROM public.payroll p
LEFT JOIN public.employees e ON e.id = p.employee_id;

CREATE INDEX IF NOT EXISTS idx_legacy_ingest_batches_source_status ON public.legacy_ingest_batches(source_name, status, started_at DESC);
CREATE INDEX IF NOT EXISTS idx_legacy_row_rejections_batch_source ON public.legacy_row_rejections(ingest_batch_id, source_name);
CREATE INDEX IF NOT EXISTS idx_orders_source_batch_id ON public.orders(source_batch_id) WHERE source_batch_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_orders_record_origin ON public.orders(record_origin, ordered_at DESC);
CREATE INDEX IF NOT EXISTS idx_expenses_record_origin ON public.expenses(record_origin, expense_date DESC);
CREATE INDEX IF NOT EXISTS idx_expenses_vendor_asset ON public.expenses(vendor_id, asset_id, expense_date DESC);
CREATE INDEX IF NOT EXISTS idx_payroll_record_origin ON public.payroll(record_origin, period_start DESC);
CREATE INDEX IF NOT EXISTS idx_payroll_employee_id_period ON public.payroll(employee_id, period_start DESC);

INSERT INTO public.payment_methods (code, label)
VALUES
  ('efectivo', 'Efectivo'),
  ('transferencia', 'Transferencia'),
  ('tarjeta', 'Tarjeta'),
  ('credito', 'Crédito'),
  ('otro', 'Otro')
ON CONFLICT (code) DO NOTHING;

INSERT INTO public.service_status_legacy_map (legacy_status, mapped_order_status, requires_attention, notes)
VALUES
  ('Finalizado', 'completed', false, 'Legacy completed service'),
  ('Confirmado', 'confirmed', false, 'Legacy confirmed service'),
  ('Cancelado', 'cancelled', false, 'Legacy cancelled service'),
  ('Pendiente de Anticipo', 'draft', true, 'Requires payment reconciliation'),
  ('', 'draft', true, 'Empty status in legacy source')
ON CONFLICT (legacy_status) DO NOTHING;

COMMIT;
