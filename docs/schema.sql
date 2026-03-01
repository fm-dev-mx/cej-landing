-- CEJ Database bootstrap / sync script for Supabase
-- Idempotent: safe to run multiple times (uses IF NOT EXISTS + DROP/CREATE patterns)
-- Note: The auth.users trigger requires elevated privileges (typical in Supabase SQL editor).

-- ============================================================
-- 1. INITIAL CONFIGURATION
-- ============================================================

-- Enable pgcrypto for gen_random_uuid()
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ============================================================
-- 1.1 ENUM TYPES FOR ORDERS DOMAIN (Operational Sales Model)
-- ============================================================

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'order_status_enum') THEN
    CREATE TYPE public.order_status_enum AS ENUM ('draft','pending_payment','scheduled','delivered','cancelled');
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'payment_status_enum') THEN
    CREATE TYPE public.payment_status_enum AS ENUM ('pending','partial','paid','cancelled');
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'fiscal_status_enum') THEN
    CREATE TYPE public.fiscal_status_enum AS ENUM ('not_requested','requested','issued','cancelled');
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'payment_direction_enum') THEN
    CREATE TYPE public.payment_direction_enum AS ENUM ('in','out');
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'payment_kind_enum') THEN
    CREATE TYPE public.payment_kind_enum AS ENUM ('anticipo','abono','liquidacion','ajuste','refund','chargeback');
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'payment_method_enum') THEN
    CREATE TYPE public.payment_method_enum AS ENUM ('efectivo','transferencia','credito','deposito','otro');
  END IF;
END $$;

-- ============================================================
-- 2. GENERIC FUNCTION: updated_at
-- ============================================================

CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = pg_catalog, public
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

-- ============================================================
-- 3. TABLE: PROFILES (Auth Extension - Phase 3)
-- ============================================================

CREATE TABLE IF NOT EXISTS public.profiles (
  id           uuid REFERENCES auth.users ON DELETE CASCADE PRIMARY KEY,
  email        text,
  full_name    text,
  phone        text,
  company_name text,
  rfc          text,
  address      jsonb,
  created_at   timestamptz DEFAULT now(),
  updated_at   timestamptz DEFAULT now()
);

-- MIGRATION / SYNC FOR EXISTING DATABASES:
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS email        text,
  ADD COLUMN IF NOT EXISTS full_name    text,
  ADD COLUMN IF NOT EXISTS phone        text,
  ADD COLUMN IF NOT EXISTS company_name text,
  ADD COLUMN IF NOT EXISTS rfc          text,
  ADD COLUMN IF NOT EXISTS address      jsonb,
  ADD COLUMN IF NOT EXISTS created_at   timestamptz,
  ADD COLUMN IF NOT EXISTS updated_at   timestamptz;

ALTER TABLE public.profiles
  ALTER COLUMN created_at SET DEFAULT now();

ALTER TABLE public.profiles
  ALTER COLUMN updated_at SET DEFAULT now();

-- Enable Row Level Security for profiles
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Clean up existing policies to avoid duplicates
DROP POLICY IF EXISTS "Users can read their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Usuarios ven su propio perfil" ON public.profiles;
DROP POLICY IF EXISTS "Usuarios editan su propio perfil" ON public.profiles;

-- RLS: Users can only read their own profile
CREATE POLICY "Users can read their own profile"
  ON public.profiles FOR SELECT
  USING (id = auth.uid());

-- RLS: Users can only update their own profile
CREATE POLICY "Users can update their own profile"
  ON public.profiles FOR UPDATE
  USING (id = auth.uid());

-- updated_at trigger for profiles
DROP TRIGGER IF EXISTS set_profiles_updated_at ON public.profiles;
CREATE TRIGGER set_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE PROCEDURE public.set_updated_at();

-- Trigger: automatically create/update profile for new auth users
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog, public
AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1))
  )
  ON CONFLICT (id) DO UPDATE SET
    email = EXCLUDED.email,
    full_name = EXCLUDED.full_name,
    updated_at = now();
  RETURN NEW;
END;
$$;

-- Create trigger on auth.users (requires elevated privileges)
DROP TRIGGER IF EXISTS cej_on_auth_user_created ON auth.users;
CREATE TRIGGER cej_on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- ============================================================
-- 4. TABLE: LEADS (Anonymous Inbox - Phase 2)
-- ============================================================

-- Base definition for new environments
CREATE TABLE IF NOT EXISTS public.leads (
  id          bigint GENERATED BY DEFAULT AS IDENTITY PRIMARY KEY,
  created_at  timestamptz DEFAULT now(),
  name        text NOT NULL,
  phone       text NOT NULL,
  status      text DEFAULT 'new',
  quote_data  jsonb NOT NULL,
  visitor_id  text,
  fb_event_id text,
  utm_source  text,
  utm_medium  text
);

-- MIGRATION / SYNC FOR EXISTING DATABASES:
ALTER TABLE public.leads
  ADD COLUMN IF NOT EXISTS created_at           timestamptz,
  ADD COLUMN IF NOT EXISTS name                 text,
  ADD COLUMN IF NOT EXISTS phone                text,
  ADD COLUMN IF NOT EXISTS status               text,
  ADD COLUMN IF NOT EXISTS quote_data           jsonb,
  ADD COLUMN IF NOT EXISTS visitor_id           text,
  ADD COLUMN IF NOT EXISTS fb_event_id          text,
  ADD COLUMN IF NOT EXISTS utm_source           text,
  ADD COLUMN IF NOT EXISTS utm_medium           text,
  ADD COLUMN IF NOT EXISTS fbclid               text,
  ADD COLUMN IF NOT EXISTS delivery_date        timestamptz,
  ADD COLUMN IF NOT EXISTS delivery_address     text,
  ADD COLUMN IF NOT EXISTS utm_campaign         text,
  ADD COLUMN IF NOT EXISTS utm_term             text,
  ADD COLUMN IF NOT EXISTS utm_content          text,
  ADD COLUMN IF NOT EXISTS notes                text,
  ADD COLUMN IF NOT EXISTS lost_reason          text,
  ADD COLUMN IF NOT EXISTS privacy_accepted     boolean,
  ADD COLUMN IF NOT EXISTS privacy_accepted_at  timestamptz,
  ADD COLUMN IF NOT EXISTS gclid                text,
  ADD COLUMN IF NOT EXISTS phone_norm           text;

ALTER TABLE public.leads
  ALTER COLUMN created_at SET DEFAULT now();

-- Ensure new records default to false, while historical rows remain NULL (unknown).
ALTER TABLE public.leads
  ALTER COLUMN privacy_accepted SET DEFAULT false;

-- Add / enforce status CHECK without failing on historical data (NOT VALID).
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'leads_status_check'
      AND conrelid = 'public.leads'::regclass
  ) THEN
    EXECUTE $SQL$
      ALTER TABLE public.leads
      ADD CONSTRAINT leads_status_check
      CHECK (status IN ('new','contacted','qualified','converted','lost','archived'))
      NOT VALID
    $SQL$;
  END IF;
END $$;

-- OPTIONAL: validate later once data is clean:
-- ALTER TABLE public.leads VALIDATE CONSTRAINT leads_status_check;

-- Enable Row Level Security for leads
ALTER TABLE public.leads ENABLE ROW LEVEL SECURITY;
-- Note: no public INSERT policy on leads; inserts are done via Server Actions
-- using the Supabase Service Role, which bypasses RLS.

-- ============================================================
-- 5. TABLE: ORDERS (SaaS Orders & History - Phase 4)
-- ============================================================

CREATE TABLE IF NOT EXISTS public.orders (
  id               uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id          uuid REFERENCES public.profiles(id) NOT NULL,
  folio            text NOT NULL UNIQUE, -- Human-friendly ID (e.g. WEB-2025-001)
  status           text DEFAULT 'draft',
  total_amount     numeric(10,2) NOT NULL,
  currency         text DEFAULT 'MXN',
  items            jsonb NOT NULL DEFAULT '[]'::jsonb, -- [{ id, label, inputs, results }]
  delivery_date    timestamptz,
  delivery_address text,
  geo_location     jsonb, -- { lat, lng }
  created_at       timestamptz DEFAULT now(),
  updated_at       timestamptz DEFAULT now(),
  utm_source       text,
  utm_medium       text,
  utm_campaign     text,
  utm_term         text,
  utm_content      text,
  fbclid           text,
  gclid            text,
  lead_id          bigint REFERENCES public.leads(id) ON DELETE SET NULL, -- Attribution link
  pricing_version  int, -- Logic version at time of creation
  price_breakdown  jsonb -- Snapshot of calculations
);

-- MIGRATION / SYNC FOR EXISTING DATABASES:
ALTER TABLE public.orders
  ADD COLUMN IF NOT EXISTS id               uuid,
  ADD COLUMN IF NOT EXISTS user_id          uuid,
  ADD COLUMN IF NOT EXISTS folio            text,
  ADD COLUMN IF NOT EXISTS status           text,
  ADD COLUMN IF NOT EXISTS total_amount     numeric(10,2),
  ADD COLUMN IF NOT EXISTS currency         text,
  ADD COLUMN IF NOT EXISTS items            jsonb,
  ADD COLUMN IF NOT EXISTS delivery_date    timestamptz,
  ADD COLUMN IF NOT EXISTS delivery_address text,
  ADD COLUMN IF NOT EXISTS geo_location     jsonb,
  ADD COLUMN IF NOT EXISTS created_at       timestamptz,
  ADD COLUMN IF NOT EXISTS updated_at       timestamptz,
  ADD COLUMN IF NOT EXISTS utm_source       text,
  ADD COLUMN IF NOT EXISTS utm_medium       text,
  ADD COLUMN IF NOT EXISTS utm_campaign     text,
  ADD COLUMN IF NOT EXISTS utm_term         text,
  ADD COLUMN IF NOT EXISTS utm_content      text,
  ADD COLUMN IF NOT EXISTS fbclid           text,
  ADD COLUMN IF NOT EXISTS gclid            text,
  ADD COLUMN IF NOT EXISTS lead_id          bigint,
  ADD COLUMN IF NOT EXISTS pricing_version  int,
  ADD COLUMN IF NOT EXISTS price_breakdown  jsonb,
  ADD COLUMN IF NOT EXISTS legacy_folio_raw text,
  ADD COLUMN IF NOT EXISTS external_ref text,
  ADD COLUMN IF NOT EXISTS ordered_at timestamptz,
  ADD COLUMN IF NOT EXISTS customer_id uuid,
  ADD COLUMN IF NOT EXISTS seller_id uuid,
  ADD COLUMN IF NOT EXISTS delivery_address_text text,
  ADD COLUMN IF NOT EXISTS delivery_address_id uuid,
  ADD COLUMN IF NOT EXISTS scheduled_date timestamptz,
  ADD COLUMN IF NOT EXISTS scheduled_window_start timestamptz,
  ADD COLUMN IF NOT EXISTS scheduled_window_end timestamptz,
  ADD COLUMN IF NOT EXISTS scheduled_slot_code text,
  ADD COLUMN IF NOT EXISTS scheduled_time_label text,
  ADD COLUMN IF NOT EXISTS service_type text,
  ADD COLUMN IF NOT EXISTS product_id text,
  ADD COLUMN IF NOT EXISTS quantity_m3 numeric(10,2),
  ADD COLUMN IF NOT EXISTS unit_price_before_vat numeric(12,2),
  ADD COLUMN IF NOT EXISTS vat_rate numeric(6,4),
  ADD COLUMN IF NOT EXISTS total_before_vat numeric(12,2),
  ADD COLUMN IF NOT EXISTS total_with_vat numeric(12,2),
  ADD COLUMN IF NOT EXISTS pricing_snapshot_json jsonb,
  ADD COLUMN IF NOT EXISTS payments_summary_json jsonb,
  ADD COLUMN IF NOT EXISTS balance_amount numeric(12,2),
  ADD COLUMN IF NOT EXISTS order_status public.order_status_enum,
  ADD COLUMN IF NOT EXISTS payment_status public.payment_status_enum,
  ADD COLUMN IF NOT EXISTS fiscal_status public.fiscal_status_enum,
  ADD COLUMN IF NOT EXISTS supplier_name_text text,
  ADD COLUMN IF NOT EXISTS commission_snapshot_json jsonb,
  ADD COLUMN IF NOT EXISTS internal_notes text,
  ADD COLUMN IF NOT EXISTS import_source text,
  ADD COLUMN IF NOT EXISTS import_batch_id text,
  ADD COLUMN IF NOT EXISTS import_row_hash text;

-- SAFE CONSTRAINT INJECTION (IDEMPOTENT)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'fk_orders_lead'
    AND conrelid = 'public.orders'::regclass
  ) THEN
    ALTER TABLE public.orders
    ADD CONSTRAINT fk_orders_lead
    FOREIGN KEY (lead_id) REFERENCES public.leads(id)
    ON DELETE SET NULL;
  END IF;
END $$;

-- Ensure defaults exist (won't overwrite existing values)
ALTER TABLE public.orders
  ALTER COLUMN id SET DEFAULT gen_random_uuid();

ALTER TABLE public.orders
  ALTER COLUMN currency SET DEFAULT 'MXN';

ALTER TABLE public.orders
  ALTER COLUMN items SET DEFAULT '[]'::jsonb;

ALTER TABLE public.orders
  ALTER COLUMN created_at SET DEFAULT now();

ALTER TABLE public.orders
  ALTER COLUMN updated_at SET DEFAULT now();

ALTER TABLE public.orders
  ALTER COLUMN order_status SET DEFAULT 'draft'::public.order_status_enum;

ALTER TABLE public.orders
  ALTER COLUMN payment_status SET DEFAULT 'pending'::public.payment_status_enum;

ALTER TABLE public.orders
  ALTER COLUMN fiscal_status SET DEFAULT 'not_requested'::public.fiscal_status_enum;

ALTER TABLE public.orders
  ALTER COLUMN ordered_at SET DEFAULT now();

-- Add / enforce status CHECK without failing on historical data (NOT VALID).
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'orders_status_check'
      AND conrelid = 'public.orders'::regclass
  ) THEN
    EXECUTE $SQL$
      ALTER TABLE public.orders
      ADD CONSTRAINT orders_status_check
      CHECK (status IN ('draft','pending_payment','scheduled','delivered','cancelled'))
      NOT VALID
    $SQL$;
  END IF;
END $$;

-- OPTIONAL: validate later once data is clean:
-- ALTER TABLE public.orders VALIDATE CONSTRAINT orders_status_check;

-- Ensure folio uniqueness for existing DBs (CREATE TABLE IF NOT EXISTS won't add it)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_indexes
    WHERE schemaname = 'public'
      AND indexname = 'idx_orders_folio_unique'
  ) THEN
    BEGIN
      EXECUTE 'CREATE UNIQUE INDEX idx_orders_folio_unique ON public.orders (folio)';
    EXCEPTION
      WHEN others THEN
        -- If there are duplicates, this will fail. Fix duplicates and re-run to enforce.
        RAISE NOTICE 'Could not create unique index idx_orders_folio_unique on orders(folio). Check for duplicate folio values.';
    END;
  END IF;
END $$;

-- Enable Row Level Security for orders
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;

-- Clean up existing policies to avoid duplicates
DROP POLICY IF EXISTS "Users can read their own orders" ON public.orders;
DROP POLICY IF EXISTS "Users can create their own orders" ON public.orders;
DROP POLICY IF EXISTS "Users can update their draft orders" ON public.orders;
DROP POLICY IF EXISTS "Usuarios ven sus propias ordenes" ON public.orders;
DROP POLICY IF EXISTS "Usuarios crean sus propias ordenes" ON public.orders;
DROP POLICY IF EXISTS "Usuarios actualizan sus ordenes (draft)" ON public.orders;

-- RLS: Users can only read their own orders
CREATE POLICY "Users can read their own orders"
  ON public.orders FOR SELECT
  USING (user_id = auth.uid());

-- RLS: Users can only create orders for themselves
CREATE POLICY "Users can create their own orders"
  ON public.orders FOR INSERT
  WITH CHECK (user_id = auth.uid());

-- RLS: Users can only update their own draft orders
CREATE POLICY "Users can update their draft orders"
  ON public.orders FOR UPDATE
  USING (user_id = auth.uid() AND status = 'draft');

-- updated_at trigger for orders
DROP TRIGGER IF EXISTS set_orders_updated_at ON public.orders;
CREATE TRIGGER set_orders_updated_at
  BEFORE UPDATE ON public.orders
  FOR EACH ROW
  EXECUTE PROCEDURE public.set_updated_at();

-- ============================================================
-- 5.1 TABLE: ORDER_PAYMENTS (Operational Ledger)
-- ============================================================

CREATE TABLE IF NOT EXISTS public.order_payments (
  id             uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  order_id       uuid NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  direction      public.payment_direction_enum NOT NULL,
  kind           public.payment_kind_enum NOT NULL,
  method         public.payment_method_enum NOT NULL,
  amount         numeric(12,2) NOT NULL CHECK (amount > 0),
  currency       text NOT NULL DEFAULT 'MXN',
  paid_at        timestamptz NOT NULL DEFAULT now(),
  reference      text,
  receipt_number text,
  notes          text,
  created_by     uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at     timestamptz NOT NULL DEFAULT now(),
  updated_at     timestamptz NOT NULL DEFAULT now(),
  voided_at      timestamptz,
  void_reason    text
);

ALTER TABLE public.order_payments ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users view order payments" ON public.order_payments;
CREATE POLICY "Users view order payments"
  ON public.order_payments FOR SELECT
  USING (EXISTS (SELECT 1 FROM public.orders o WHERE o.id = order_id AND o.user_id = auth.uid()));

DROP POLICY IF EXISTS "Users insert order payments" ON public.order_payments;
CREATE POLICY "Users insert order payments"
  ON public.order_payments FOR INSERT
  WITH CHECK (EXISTS (SELECT 1 FROM public.orders o WHERE o.id = order_id AND o.user_id = auth.uid()));

DROP TRIGGER IF EXISTS set_order_payments_updated_at ON public.order_payments;
CREATE TRIGGER set_order_payments_updated_at
  BEFORE UPDATE ON public.order_payments
  FOR EACH ROW
  EXECUTE PROCEDURE public.set_updated_at();

-- ============================================================
-- 5.2 TABLE: ORDER_STATUS_HISTORY
-- ============================================================

CREATE TABLE IF NOT EXISTS public.order_status_history (
  id          uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  order_id    uuid NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  from_status public.order_status_enum,
  to_status   public.order_status_enum NOT NULL,
  reason      text,
  changed_by  uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  changed_at  timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.order_status_history ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users view order history" ON public.order_status_history;
CREATE POLICY "Users view order history"
  ON public.order_status_history FOR SELECT
  USING (EXISTS (SELECT 1 FROM public.orders o WHERE o.id = order_id AND o.user_id = auth.uid()));

DROP POLICY IF EXISTS "Users insert order history" ON public.order_status_history;
CREATE POLICY "Users insert order history"
  ON public.order_status_history FOR INSERT
  WITH CHECK (EXISTS (SELECT 1 FROM public.orders o WHERE o.id = order_id AND o.user_id = auth.uid()));

-- ============================================================
-- 5.3 TABLE: ORDER_FISCAL_DATA
-- ============================================================

CREATE TABLE IF NOT EXISTS public.order_fiscal_data (
  order_id            uuid PRIMARY KEY REFERENCES public.orders(id) ON DELETE CASCADE,
  requires_invoice    boolean NOT NULL DEFAULT false,
  invoice_status      public.fiscal_status_enum NOT NULL DEFAULT 'not_requested',
  invoice_requested_at timestamptz,
  invoice_number      text,
  rfc                 text,
  razon_social        text,
  cfdi_use            text,
  created_at          timestamptz NOT NULL DEFAULT now(),
  updated_at          timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.order_fiscal_data ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users view order fiscal data" ON public.order_fiscal_data;
CREATE POLICY "Users view order fiscal data"
  ON public.order_fiscal_data FOR SELECT
  USING (EXISTS (SELECT 1 FROM public.orders o WHERE o.id = order_id AND o.user_id = auth.uid()));

DROP POLICY IF EXISTS "Users upsert order fiscal data" ON public.order_fiscal_data;
CREATE POLICY "Users upsert order fiscal data"
  ON public.order_fiscal_data FOR INSERT
  WITH CHECK (EXISTS (SELECT 1 FROM public.orders o WHERE o.id = order_id AND o.user_id = auth.uid()));

DROP POLICY IF EXISTS "Users update order fiscal data" ON public.order_fiscal_data;
CREATE POLICY "Users update order fiscal data"
  ON public.order_fiscal_data FOR UPDATE
  USING (EXISTS (SELECT 1 FROM public.orders o WHERE o.id = order_id AND o.user_id = auth.uid()));

DROP TRIGGER IF EXISTS set_order_fiscal_data_updated_at ON public.order_fiscal_data;
CREATE TRIGGER set_order_fiscal_data_updated_at
  BEFORE UPDATE ON public.order_fiscal_data
  FOR EACH ROW
  EXECUTE PROCEDURE public.set_updated_at();

-- ============================================================
-- 6. TABLE: PRICE_CONFIG (Pricing Configuration - Phase 5)
-- ============================================================

CREATE TABLE IF NOT EXISTS public.price_config (
  id            bigint GENERATED BY DEFAULT AS IDENTITY PRIMARY KEY,
  version       integer NOT NULL DEFAULT 1,
  pricing_rules jsonb NOT NULL,
  active        boolean DEFAULT true,
  created_at    timestamptz DEFAULT now(),
  updated_at    timestamptz DEFAULT now()
);

-- MIGRATION / SYNC FOR EXISTING DATABASES
ALTER TABLE public.price_config
  ADD COLUMN IF NOT EXISTS version       integer,
  ADD COLUMN IF NOT EXISTS pricing_rules jsonb,
  ADD COLUMN IF NOT EXISTS active        boolean,
  ADD COLUMN IF NOT EXISTS created_at    timestamptz,
  ADD COLUMN IF NOT EXISTS updated_at    timestamptz;

ALTER TABLE public.price_config
  ALTER COLUMN version SET DEFAULT 1;

ALTER TABLE public.price_config
  ALTER COLUMN active SET DEFAULT true;

ALTER TABLE public.price_config
  ALTER COLUMN updated_at SET DEFAULT now();

-- Enable Row Level Security for price_config
ALTER TABLE public.price_config ENABLE ROW LEVEL SECURITY;

-- Clean up existing policies to avoid duplicates
DROP POLICY IF EXISTS "Public read access to prices" ON public.price_config;
DROP POLICY IF EXISTS "Lectura publica de precios" ON public.price_config;

-- RLS: public read-only access (write access will be added later for admins/service role)
CREATE POLICY "Public read access to prices"
  ON public.price_config FOR SELECT
  USING (true);

-- ============================================================
-- 7. INDEXES (Performance Optimization)
-- ============================================================

-- LEADS
-- Remove legacy duplicate indexes if they exist (to avoid duplicate_index warnings)
DROP INDEX IF EXISTS public.leads_status_idx;
DROP INDEX IF EXISTS public.leads_visitor_id_idx;

-- Identify returning visitors
CREATE INDEX IF NOT EXISTS idx_leads_visitor_id ON public.leads(visitor_id);

-- Search by phone (basic CRM / deduplication)
CREATE INDEX IF NOT EXISTS idx_leads_phone ON public.leads(phone);

-- Search by normalized phone (rate limiting, CAPI)
CREATE INDEX IF NOT EXISTS idx_leads_phone_norm ON public.leads(phone_norm);

-- Filter/sort by creation date (dashboards, reporting)
CREATE INDEX IF NOT EXISTS idx_leads_created_at ON public.leads(created_at);

-- Filter by pipeline status (new/contacted/converted/archived)
CREATE INDEX IF NOT EXISTS idx_leads_status ON public.leads(status);

-- Deep search inside quote_data JSON (useful if you query JSON keys/paths)
CREATE INDEX IF NOT EXISTS idx_leads_quote_gin
  ON public.leads USING gin (quote_data);

-- ORDERS
-- Fast lookup of user order history
CREATE INDEX IF NOT EXISTS idx_orders_user_id ON public.orders(user_id);

-- Filter/sort by creation date (dashboards, reporting)
CREATE INDEX IF NOT EXISTS idx_orders_created_at ON public.orders(created_at);

-- Filter by order status
CREATE INDEX IF NOT EXISTS idx_orders_status ON public.orders(status);

-- Attribution lookup: Fast join for lead source analysis
CREATE INDEX IF NOT EXISTS idx_orders_lead_id ON public.orders(lead_id);
CREATE INDEX IF NOT EXISTS idx_orders_order_status_scheduled_date ON public.orders(order_status, scheduled_date);
CREATE INDEX IF NOT EXISTS idx_orders_import_source_row_hash ON public.orders(import_source, import_row_hash);
CREATE INDEX IF NOT EXISTS idx_order_payments_order_paid_at ON public.order_payments(order_id, paid_at DESC);

-- ============================================================
-- 8. TABLE: EXPENSES (Internal MVP - Phase 1)
-- ============================================================

CREATE TABLE IF NOT EXISTS public.expenses (
  id           uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id      uuid REFERENCES public.profiles(id) NOT NULL,
  amount       numeric(10,2) NOT NULL,
  currency     text DEFAULT 'MXN',
  category     text NOT NULL,
  expense_date timestamptz NOT NULL,
  reference    text,
  notes        text,
  created_at   timestamptz DEFAULT now(),
  updated_at   timestamptz DEFAULT now()
);

-- MIGRATION / SYNC FOR EXISTING DATABASES:
ALTER TABLE public.expenses
  ADD COLUMN IF NOT EXISTS id           uuid,
  ADD COLUMN IF NOT EXISTS user_id      uuid,
  ADD COLUMN IF NOT EXISTS amount       numeric(10,2),
  ADD COLUMN IF NOT EXISTS currency     text,
  ADD COLUMN IF NOT EXISTS category     text,
  ADD COLUMN IF NOT EXISTS expense_date timestamptz,
  ADD COLUMN IF NOT EXISTS reference    text,
  ADD COLUMN IF NOT EXISTS notes        text,
  ADD COLUMN IF NOT EXISTS created_at   timestamptz,
  ADD COLUMN IF NOT EXISTS updated_at   timestamptz;

ALTER TABLE public.expenses
  ALTER COLUMN id SET DEFAULT gen_random_uuid();

ALTER TABLE public.expenses
  ALTER COLUMN currency SET DEFAULT 'MXN';

ALTER TABLE public.expenses
  ALTER COLUMN created_at SET DEFAULT now();

ALTER TABLE public.expenses
  ALTER COLUMN updated_at SET DEFAULT now();

ALTER TABLE public.expenses ENABLE ROW LEVEL SECURITY;

-- Policies (drop/create to stay idempotent)
DROP POLICY IF EXISTS "Users view expenses" ON public.expenses;
CREATE POLICY "Users view expenses"
  ON public.expenses FOR SELECT
  USING (user_id = auth.uid());

DROP POLICY IF EXISTS "Users insert expenses" ON public.expenses;
CREATE POLICY "Users insert expenses"
  ON public.expenses FOR INSERT
  WITH CHECK (user_id = auth.uid());

-- Optional but consistent: allow updates/deletes of own rows
DROP POLICY IF EXISTS "Users update expenses" ON public.expenses;
CREATE POLICY "Users update expenses"
  ON public.expenses FOR UPDATE
  USING (user_id = auth.uid());

DROP POLICY IF EXISTS "Users delete expenses" ON public.expenses;
CREATE POLICY "Users delete expenses"
  ON public.expenses FOR DELETE
  USING (user_id = auth.uid());

-- updated_at trigger
DROP TRIGGER IF EXISTS set_expenses_updated_at ON public.expenses;
CREATE TRIGGER set_expenses_updated_at
  BEFORE UPDATE ON public.expenses
  FOR EACH ROW EXECUTE PROCEDURE public.set_updated_at();

-- ============================================================
-- 9. TABLE: PAYROLL (Internal MVP - Phase 1)
-- ============================================================

CREATE TABLE IF NOT EXISTS public.payroll (
  id           uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id      uuid REFERENCES public.profiles(id) NOT NULL,
  employee     text NOT NULL,
  period_start timestamptz NOT NULL,
  period_end   timestamptz NOT NULL,
  amount       numeric(10,2) NOT NULL,
  currency     text DEFAULT 'MXN',
  notes        text,
  created_at   timestamptz DEFAULT now(),
  updated_at   timestamptz DEFAULT now()
);

-- MIGRATION / SYNC FOR EXISTING DATABASES:
ALTER TABLE public.payroll
  ADD COLUMN IF NOT EXISTS id           uuid,
  ADD COLUMN IF NOT EXISTS user_id      uuid,
  ADD COLUMN IF NOT EXISTS employee     text,
  ADD COLUMN IF NOT EXISTS period_start timestamptz,
  ADD COLUMN IF NOT EXISTS period_end   timestamptz,
  ADD COLUMN IF NOT EXISTS amount       numeric(10,2),
  ADD COLUMN IF NOT EXISTS currency     text,
  ADD COLUMN IF NOT EXISTS notes        text,
  ADD COLUMN IF NOT EXISTS created_at   timestamptz,
  ADD COLUMN IF NOT EXISTS updated_at   timestamptz;

ALTER TABLE public.payroll
  ALTER COLUMN id SET DEFAULT gen_random_uuid();

ALTER TABLE public.payroll
  ALTER COLUMN currency SET DEFAULT 'MXN';

ALTER TABLE public.payroll
  ALTER COLUMN created_at SET DEFAULT now();

ALTER TABLE public.payroll
  ALTER COLUMN updated_at SET DEFAULT now();

ALTER TABLE public.payroll ENABLE ROW LEVEL SECURITY;

-- Policies (drop/create to stay idempotent)
DROP POLICY IF EXISTS "Users view payroll" ON public.payroll;
CREATE POLICY "Users view payroll"
  ON public.payroll FOR SELECT
  USING (user_id = auth.uid());

DROP POLICY IF EXISTS "Users insert payroll" ON public.payroll;
CREATE POLICY "Users insert payroll"
  ON public.payroll FOR INSERT
  WITH CHECK (user_id = auth.uid());

-- Optional but consistent: allow updates/deletes of own rows
DROP POLICY IF EXISTS "Users update payroll" ON public.payroll;
CREATE POLICY "Users update payroll"
  ON public.payroll FOR UPDATE
  USING (user_id = auth.uid());

DROP POLICY IF EXISTS "Users delete payroll" ON public.payroll;
CREATE POLICY "Users delete payroll"
  ON public.payroll FOR DELETE
  USING (user_id = auth.uid());

-- updated_at trigger
DROP TRIGGER IF EXISTS set_payroll_updated_at ON public.payroll;
CREATE TRIGGER set_payroll_updated_at
  BEFORE UPDATE ON public.payroll
  FOR EACH ROW EXECUTE PROCEDURE public.set_updated_at();
