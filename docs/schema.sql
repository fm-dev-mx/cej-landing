-- CEJ Database bootstrap script for Supabase
-- Snapshot: updated for branch commit-gatekeeper workflow
-- CLEAN SLATE MODE: Drops existing tables/types to enforce the new canonical schema.
-- Note: The auth.users trigger requires elevated privileges (typically handled in Supabase SQL editor).

CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ============================================================
-- 1. CLEANUP (DROP DEPENDENCIES FIRST)
-- ============================================================

-- Drop dependent tables first to avoid foreign key violations
DROP SCHEMA IF EXISTS analytics CASCADE;
DROP SCHEMA IF EXISTS legacy_staging CASCADE;
DROP TABLE IF EXISTS public.legacy_row_rejections CASCADE;
DROP TABLE IF EXISTS public.legacy_ingest_batches CASCADE;
DROP TABLE IF EXISTS public.service_status_legacy_map CASCADE;
DROP TABLE IF EXISTS public.expense_categories CASCADE;
DROP TABLE IF EXISTS public.payment_methods CASCADE;
DROP TABLE IF EXISTS public.employees CASCADE;
DROP TABLE IF EXISTS public.assets CASCADE;
DROP TABLE IF EXISTS public.vendors CASCADE;
DROP TABLE IF EXISTS public.products CASCADE;
DROP TABLE IF EXISTS public.order_fiscal_data CASCADE;
DROP TABLE IF EXISTS public.order_status_history CASCADE;
DROP TABLE IF EXISTS public.order_payments CASCADE;
DROP TABLE IF EXISTS public.order_import_log CASCADE;
DROP TABLE IF EXISTS public.customer_merge_log CASCADE;
DROP TABLE IF EXISTS public.customer_identities CASCADE;
DROP TABLE IF EXISTS public.orders CASCADE;
DROP TABLE IF EXISTS public.service_slots CASCADE;
DROP TABLE IF EXISTS public.price_config CASCADE;
DROP TABLE IF EXISTS public.expenses CASCADE;
DROP TABLE IF EXISTS public.payroll CASCADE;
DROP TABLE IF EXISTS public.leads CASCADE;
DROP TABLE IF EXISTS public.customers CASCADE;
DROP TABLE IF EXISTS public.profiles CASCADE;

-- Drop Enums
DROP TYPE IF EXISTS public.order_status_enum CASCADE;
DROP TYPE IF EXISTS public.payment_status_enum CASCADE;
DROP TYPE IF EXISTS public.fiscal_status_enum CASCADE;
DROP TYPE IF EXISTS public.payment_direction_enum CASCADE;
DROP TYPE IF EXISTS public.payment_kind_enum CASCADE;
DROP TYPE IF EXISTS public.payment_method_enum CASCADE;
DROP TYPE IF EXISTS public.lead_status_enum CASCADE;
DROP TYPE IF EXISTS public.record_origin_enum CASCADE;

-- ============================================================
-- 2. ENUM TYPES (Operational Sales Model)
-- ============================================================

CREATE TYPE public.order_status_enum AS ENUM ('draft', 'confirmed', 'scheduled', 'in_progress', 'completed', 'cancelled');
CREATE TYPE public.payment_status_enum AS ENUM ('pending', 'partial', 'paid', 'overpaid');
CREATE TYPE public.fiscal_status_enum AS ENUM ('not_requested', 'requested', 'issued', 'cancelled');
CREATE TYPE public.payment_direction_enum AS ENUM ('in', 'out');
CREATE TYPE public.payment_kind_enum AS ENUM ('anticipo', 'abono', 'liquidacion', 'ajuste', 'refund', 'chargeback');
CREATE TYPE public.payment_method_enum AS ENUM ('efectivo', 'transferencia', 'credito', 'deposito', 'otro');
CREATE TYPE public.lead_status_enum AS ENUM ('new', 'contacted', 'qualified', 'converted', 'lost', 'archived');

-- ============================================================
-- 3. GENERIC FUNCTION: updated_at
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
-- 4. TABLE: PROFILES
-- ============================================================

CREATE TABLE public.profiles (
  id           uuid REFERENCES auth.users ON DELETE CASCADE PRIMARY KEY,
  email        text,
  full_name    text,
  phone        text,
  role         text NOT NULL DEFAULT 'guest', -- guest, operator, admin, owner
  company_name text,
  rfc          text,
  address      jsonb,
  created_at   timestamptz NOT NULL DEFAULT now(),
  updated_at   timestamptz NOT NULL DEFAULT now()
);

-- Security definer function to read role without triggering RLS recursively
CREATE OR REPLACE FUNCTION public.get_auth_role()
RETURNS text
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT role FROM public.profiles WHERE id = auth.uid();
$$;

-- RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "profiles service_role all" ON public.profiles FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "profiles select_own" ON public.profiles FOR SELECT TO authenticated USING (auth.uid() = id);
CREATE POLICY "profiles select_admin" ON public.profiles FOR SELECT TO authenticated USING (
  public.get_auth_role() IN ('admin', 'owner')
);

CREATE TRIGGER set_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE PROCEDURE public.set_updated_at();

-- Trigger: create/update profile for new auth users
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog, public
AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, role)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1)),
    COALESCE(NEW.raw_user_meta_data->>'role', 'guest')
  )
  ON CONFLICT (id) DO UPDATE SET
    email = EXCLUDED.email,
    full_name = EXCLUDED.full_name,
    role = COALESCE(EXCLUDED.role, profiles.role),
    updated_at = now();
  RETURN NEW;
END;
$$;

-- Note: elevated privileges required
DO $$
BEGIN
  DROP TRIGGER IF EXISTS cej_on_auth_user_created ON auth.users;
  CREATE TRIGGER cej_on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();
EXCEPTION WHEN OTHERS THEN
  RAISE NOTICE 'Could not create trigger cej_on_auth_user_created on auth.users due to privileges';
END $$;

-- ============================================================
-- 5. TABLE: LEADS
-- ============================================================

CREATE TABLE public.leads (
  id          bigint GENERATED BY DEFAULT AS IDENTITY PRIMARY KEY,
  name        text NOT NULL,
  phone       text NOT NULL,
  phone_norm  text,
  status      public.lead_status_enum NOT NULL DEFAULT 'new',
  quote_data  jsonb NOT NULL,
  customer_id uuid,
  visitor_id  text,
  fb_event_id text,
  utm_source  text,
  utm_medium  text,
  utm_campaign text,
  utm_term    text,
  utm_content text,
  fbclid      text,
  gclid       text,
  delivery_date timestamptz,
  delivery_address text,
  notes       text,
  lost_reason text,
  privacy_accepted boolean NOT NULL DEFAULT false,
  privacy_accepted_at timestamptz,
  created_at  timestamptz NOT NULL DEFAULT now(),
  updated_at  timestamptz NOT NULL DEFAULT now()
);

-- RLS: Service Role Only
ALTER TABLE public.leads ENABLE ROW LEVEL SECURITY;
CREATE POLICY "leads service_role all" ON public.leads FOR ALL TO service_role USING (true) WITH CHECK (true);

CREATE TRIGGER set_leads_updated_at
  BEFORE UPDATE ON public.leads
  FOR EACH ROW EXECUTE PROCEDURE public.set_updated_at();

-- ============================================================
-- 5.5 TABLE: CUSTOMERS
-- ============================================================

CREATE TABLE public.customers (
  id                      uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  display_name            text NOT NULL,
  primary_phone_norm      text,
  primary_email_norm      text,
  identity_status         text NOT NULL DEFAULT 'unverified' CHECK (identity_status IN ('unverified', 'verified', 'merged')),
  merged_into_customer_id uuid REFERENCES public.customers(id) ON DELETE SET NULL,
  created_at              timestamptz NOT NULL DEFAULT now(),
  updated_at              timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.customers ENABLE ROW LEVEL SECURITY;
CREATE POLICY "customers service_role all" ON public.customers FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "customers select_authenticated" ON public.customers FOR SELECT TO authenticated USING (
  public.get_auth_role() IN ('operator', 'admin', 'owner')
);

CREATE TRIGGER set_customers_updated_at
  BEFORE UPDATE ON public.customers
  FOR EACH ROW EXECUTE PROCEDURE public.set_updated_at();

CREATE TABLE public.customer_identities (
  id          uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  customer_id uuid NOT NULL REFERENCES public.customers(id) ON DELETE CASCADE,
  type        text NOT NULL CHECK (type IN ('phone', 'email', 'visitor_id')),
  value_norm  text NOT NULL,
  is_primary  boolean NOT NULL DEFAULT false,
  verified_at timestamptz,
  created_at  timestamptz NOT NULL DEFAULT now(),
  updated_at  timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT customer_identities_unique_identity UNIQUE(type, value_norm)
);

ALTER TABLE public.customer_identities ENABLE ROW LEVEL SECURITY;
CREATE POLICY "customer_identities service_role all" ON public.customer_identities FOR ALL TO service_role USING (true) WITH CHECK (true);

CREATE TRIGGER set_customer_identities_updated_at
  BEFORE UPDATE ON public.customer_identities
  FOR EACH ROW EXECUTE PROCEDURE public.set_updated_at();

CREATE TABLE public.customer_merge_log (
  id                   uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  survivor_customer_id uuid NOT NULL REFERENCES public.customers(id) ON DELETE CASCADE,
  merged_customer_id   uuid NOT NULL REFERENCES public.customers(id) ON DELETE CASCADE,
  reason               text,
  merged_by            uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  merged_at            timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.customer_merge_log ENABLE ROW LEVEL SECURITY;
CREATE POLICY "customer_merge_log service_role all" ON public.customer_merge_log FOR ALL TO service_role USING (true) WITH CHECK (true);

ALTER TABLE public.leads
  ADD CONSTRAINT leads_customer_id_fkey
  FOREIGN KEY (customer_id)
  REFERENCES public.customers(id)
  ON DELETE SET NULL;

-- ============================================================
-- 6. TABLE: SERVICE_SLOTS
-- ============================================================

CREATE TABLE public.service_slots (
  slot_code text PRIMARY KEY,
  label text NOT NULL,
  start_time time NOT NULL,
  end_time time NOT NULL
);

-- RLS: Service Role Only
ALTER TABLE public.service_slots ENABLE ROW LEVEL SECURITY;
CREATE POLICY "service_slots service_role all" ON public.service_slots FOR ALL TO service_role USING (true) WITH CHECK (true);

-- ============================================================
-- 7. TABLE: ORDERS
-- ============================================================

CREATE TABLE public.orders (
  id               uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  folio            text NOT NULL UNIQUE,

  -- Ownership / operator semantics:
  user_id          uuid REFERENCES public.profiles(id) NOT NULL, -- CEJ tenant or future owner
  seller_id        uuid REFERENCES public.profiles(id),          -- Internal staff member representing sale
  created_by       uuid REFERENCES public.profiles(id),          -- User who captured the entry

  -- Operational fields
  order_status     public.order_status_enum NOT NULL DEFAULT 'draft',
  payment_status   public.payment_status_enum NOT NULL DEFAULT 'pending',
  fiscal_status    public.fiscal_status_enum NOT NULL DEFAULT 'not_requested',
  ordered_at       timestamptz NOT NULL DEFAULT now(),
  created_at       timestamptz NOT NULL DEFAULT now(),
  updated_at       timestamptz NOT NULL DEFAULT now(),

  -- Service/pricing (nullable in draft, frozen state later)
  service_type     text CHECK (service_type IS NULL OR service_type IN ('bombeado', 'tirado')),
  product_id       text,
  quantity_m3      numeric(12,2) CHECK (quantity_m3 IS NULL OR quantity_m3 > 0),
  unit_price_before_vat numeric(12,2) CHECK (unit_price_before_vat IS NULL OR unit_price_before_vat >= 0),
  vat_rate         numeric(6,4) CHECK (vat_rate IS NULL OR (vat_rate >= 0 AND vat_rate <= 1)),
  total_before_vat numeric(12,2) CHECK (total_before_vat IS NULL OR total_before_vat >= 0),
  total_with_vat   numeric(12,2) CHECK (total_with_vat IS NULL OR total_with_vat >= 0),
  pricing_snapshot_json jsonb NOT NULL DEFAULT '{}'::jsonb,

  -- Financial Summaries (maintained by triggers)
  payments_summary_json jsonb NOT NULL DEFAULT '{}'::jsonb,
  balance_amount   numeric(12,2) NOT NULL DEFAULT 0,

  -- Delivery / scheduling
  delivery_address_text text,
  delivery_address_id uuid,
  scheduled_date   date,
  scheduled_slot_code text REFERENCES public.service_slots(slot_code),
  scheduled_time_label text,
  scheduled_window_start timestamptz,
  scheduled_window_end timestamptz,

  -- Attribution
  lead_id          bigint REFERENCES public.leads(id) ON DELETE SET NULL,
  customer_id      uuid REFERENCES public.customers(id) ON DELETE SET NULL,
  visitor_id       text,
  fb_event_id      text,
  utm_source       text,
  utm_medium       text,
  utm_campaign     text,
  utm_term         text,
  utm_content      text,
  fbclid           text,
  gclid            text,
  attribution_extra_json jsonb NOT NULL DEFAULT '{}'::jsonb,

  -- Import and sync
  import_source    text,
  import_batch_id  text,
  import_row_hash  text,
  legacy_folio_raw text,
  external_ref     text,
  notes            text,

  -- Invariants
  CONSTRAINT valid_scheduling_window CHECK (
    (scheduled_window_start IS NULL AND scheduled_window_end IS NULL) OR
    (scheduled_window_start IS NOT NULL AND scheduled_window_end IS NOT NULL AND scheduled_window_end >= scheduled_window_start)
  ),
  CONSTRAINT valid_scheduling_slots CHECK (
    (scheduled_slot_code IS NULL OR scheduled_date IS NOT NULL) AND
    (order_status != 'scheduled' OR (scheduled_date IS NOT NULL AND scheduled_slot_code IS NOT NULL))
  ),
  CONSTRAINT valid_operational_state CHECK (
    order_status = 'draft' OR (
      service_type IS NOT NULL AND
      product_id IS NOT NULL AND
      length(trim(product_id)) > 0 AND
      quantity_m3 IS NOT NULL AND
      unit_price_before_vat IS NOT NULL AND
      vat_rate IS NOT NULL AND
      total_before_vat IS NOT NULL AND
      total_with_vat IS NOT NULL AND
      delivery_address_text IS NOT NULL AND
      length(trim(delivery_address_text)) > 0
    )
  ),
  CONSTRAINT ck_orders_attribution_extra_is_object CHECK (
    jsonb_typeof(attribution_extra_json) = 'object'
  )
);

-- RLS
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
CREATE POLICY "orders service_role all" ON public.orders FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "orders select_own" ON public.orders FOR SELECT TO authenticated USING (auth.uid() = created_by OR auth.uid() = seller_id);
CREATE POLICY "orders select_admin" ON public.orders FOR SELECT TO authenticated USING (
  public.get_auth_role() IN ('admin', 'owner')
);
CREATE POLICY "orders insert_staff" ON public.orders FOR INSERT TO authenticated WITH CHECK (
  public.get_auth_role() IN ('operator', 'admin', 'owner')
);

CREATE TRIGGER set_orders_updated_at
  BEFORE UPDATE ON public.orders
  FOR EACH ROW EXECUTE PROCEDURE public.set_updated_at();

CREATE OR REPLACE FUNCTION public.prevent_order_pricing_edits_non_draft()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  IF OLD.order_status <> 'draft' THEN
    IF (NEW.service_type, NEW.product_id, NEW.quantity_m3, NEW.unit_price_before_vat, NEW.vat_rate, NEW.total_before_vat, NEW.total_with_vat)
       IS DISTINCT FROM
       (OLD.service_type, OLD.product_id, OLD.quantity_m3, OLD.unit_price_before_vat, OLD.vat_rate, OLD.total_before_vat, OLD.total_with_vat) THEN
      RAISE EXCEPTION 'Pricing fields cannot be edited when order is not draft';
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER prevent_order_pricing_edits_non_draft_trigger
  BEFORE UPDATE ON public.orders
  FOR EACH ROW EXECUTE PROCEDURE public.prevent_order_pricing_edits_non_draft();

-- ============================================================
-- 7.5 TABLE: ORDER_IMPORT_LOG
-- ============================================================

CREATE TABLE public.order_import_log (
  order_id       uuid PRIMARY KEY REFERENCES public.orders(id) ON DELETE CASCADE,
  import_source  text,
  import_batch_id text,
  import_row_hash text,
  legacy_folio_raw text,
  created_at     timestamptz NOT NULL DEFAULT now(),
  updated_at     timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.order_import_log ENABLE ROW LEVEL SECURITY;
CREATE POLICY "order_import_log service_role all" ON public.order_import_log FOR ALL TO service_role USING (true) WITH CHECK (true);

CREATE TRIGGER set_order_import_log_updated_at
  BEFORE UPDATE ON public.order_import_log
  FOR EACH ROW EXECUTE PROCEDURE public.set_updated_at();

-- ============================================================
-- 8. TABLE: ORDER_PAYMENTS
-- ============================================================

CREATE TABLE public.order_payments (
  id             uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  order_id       uuid NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  direction      public.payment_direction_enum NOT NULL,
  kind           public.payment_kind_enum NOT NULL,
  method         public.payment_method_enum NOT NULL,
  amount_mxn     numeric(12,2) NOT NULL CHECK (amount_mxn > 0),
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

-- Trigger to prevent destructive edits of core payment facts
CREATE OR REPLACE FUNCTION public.prevent_payment_edits()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  IF (NEW.order_id IS DISTINCT FROM OLD.order_id) OR
     (NEW.created_by IS DISTINCT FROM OLD.created_by) OR
     (NEW.direction IS DISTINCT FROM OLD.direction) OR
     (NEW.kind IS DISTINCT FROM OLD.kind) OR
     (NEW.method IS DISTINCT FROM OLD.method) OR
     (NEW.amount_mxn IS DISTINCT FROM OLD.amount_mxn) OR
     (NEW.paid_at IS DISTINCT FROM OLD.paid_at) THEN
    RAISE EXCEPTION 'Destructive edits of payment facts are not allowed. Please void and recreate.';
  END IF;

  IF OLD.voided_at IS NOT NULL AND NEW.voided_at IS NULL THEN
    RAISE EXCEPTION 'Once a payment is voided, it cannot be un-voided.';
  END IF;

  RETURN NEW;
END;
$$;

CREATE TRIGGER enforce_append_only_payments
  BEFORE UPDATE ON public.order_payments
  FOR EACH ROW EXECUTE PROCEDURE public.prevent_payment_edits();

-- Trigger to compute payment status on order
CREATE OR REPLACE FUNCTION public.recompute_order_payment_summary()
RETURNS trigger
LANGUAGE plpgsql
AS $$
DECLARE
  v_order_id uuid;
  v_total numeric(12,2);
  v_paid_in numeric(12,2) := 0;
  v_paid_out numeric(12,2) := 0;
  v_net_paid numeric(12,2) := 0;
  v_balance numeric(12,2) := 0;
  v_last_paid_at timestamptz;
  v_status public.payment_status_enum;
  v_epsilon numeric := 0.01;
BEGIN
  IF TG_OP = 'DELETE' THEN
    v_order_id := OLD.order_id;
  ELSE
    v_order_id := NEW.order_id;
  END IF;

  SELECT total_with_vat INTO v_total FROM public.orders WHERE id = v_order_id;
  IF v_total IS NULL THEN
    RETURN NULL;
  END IF;

  SELECT
    COALESCE(SUM(amount_mxn) FILTER (WHERE direction = 'in'), 0),
    COALESCE(SUM(amount_mxn) FILTER (WHERE direction = 'out'), 0),
    MAX(paid_at)
  INTO v_paid_in, v_paid_out, v_last_paid_at
  FROM public.order_payments
  WHERE order_id = v_order_id AND voided_at IS NULL;

  v_net_paid := v_paid_in - v_paid_out;
  v_balance := v_total - v_net_paid;

  IF v_net_paid <= 0 THEN
    v_status := 'pending';
  ELSIF v_balance < -v_epsilon THEN
    v_status := 'overpaid';
  ELSIF ABS(v_balance) <= v_epsilon THEN
    v_status := 'paid';
  ELSE
    v_status := 'partial';
  END IF;

  UPDATE public.orders
  SET
    balance_amount = v_balance,
    payment_status = v_status,
    payments_summary_json = jsonb_build_object(
      'total', v_total,
      'net_paid', v_net_paid,
      'paid_in', v_paid_in,
      'paid_out', v_paid_out,
      'balance', v_balance,
      'last_paid_at', v_last_paid_at,
      'recomputed_at', now()
    )
  WHERE id = v_order_id;

  RETURN NULL;
END;
$$;

CREATE TRIGGER recompute_order_payments_trigger
  AFTER INSERT OR UPDATE OR DELETE ON public.order_payments
  FOR EACH ROW EXECUTE PROCEDURE public.recompute_order_payment_summary();

-- RLS: Service Role Only
ALTER TABLE public.order_payments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "order_payments service_role all" ON public.order_payments FOR ALL TO service_role USING (true) WITH CHECK (true);

CREATE TRIGGER set_order_payments_updated_at
  BEFORE UPDATE ON public.order_payments
  FOR EACH ROW EXECUTE PROCEDURE public.set_updated_at();

-- ============================================================
-- 9. TABLE: ORDER_STATUS_HISTORY
-- ============================================================

CREATE TABLE public.order_status_history (
  id          uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  order_id    uuid NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  from_status public.order_status_enum,
  to_status   public.order_status_enum NOT NULL,
  reason      text,
  changed_by  uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  changed_at  timestamptz NOT NULL DEFAULT now()
);

-- Trigger to automate history linking
CREATE OR REPLACE FUNCTION public.log_order_status_history()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  IF OLD.order_status IS DISTINCT FROM NEW.order_status THEN
    INSERT INTO public.order_status_history (
      order_id,
      from_status,
      to_status,
      changed_by
    )
    VALUES (
      NEW.id,
      OLD.order_status,
      NEW.order_status,
      COALESCE(auth.uid(), NEW.created_by) -- Resolves correctly even in Service Role context if fallback exists
    );
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER order_status_history_trigger
  AFTER UPDATE OF order_status ON public.orders
  FOR EACH ROW EXECUTE PROCEDURE public.log_order_status_history();

-- RLS: Service Role Only
ALTER TABLE public.order_status_history ENABLE ROW LEVEL SECURITY;
CREATE POLICY "order_status_history service_role all" ON public.order_status_history FOR ALL TO service_role USING (true) WITH CHECK (true);

-- ============================================================
-- 10. TABLE: ORDER_FISCAL_DATA
-- ============================================================

CREATE TABLE public.order_fiscal_data (
  order_id            uuid PRIMARY KEY REFERENCES public.orders(id) ON DELETE CASCADE,
  requires_invoice    boolean NOT NULL DEFAULT false,
  invoice_requested_at timestamptz,
  invoice_number      text,
  rfc                 text,
  razon_social        text,
  cfdi_use            text,
  created_at          timestamptz NOT NULL DEFAULT now(),
  updated_at          timestamptz NOT NULL DEFAULT now()
);

-- RLS: Service Role Only
ALTER TABLE public.order_fiscal_data ENABLE ROW LEVEL SECURITY;
CREATE POLICY "order_fiscal_data service_role all" ON public.order_fiscal_data FOR ALL TO service_role USING (true) WITH CHECK (true);

CREATE TRIGGER set_order_fiscal_data_updated_at
  BEFORE UPDATE ON public.order_fiscal_data
  FOR EACH ROW EXECUTE PROCEDURE public.set_updated_at();

-- ============================================================
-- 11. TABLE: PRICE_CONFIG
-- ============================================================

CREATE TABLE public.price_config (
  id            bigint GENERATED BY DEFAULT AS IDENTITY PRIMARY KEY,
  version       integer NOT NULL DEFAULT 1,
  pricing_rules jsonb NOT NULL,
  active        boolean NOT NULL DEFAULT true,
  created_at    timestamptz NOT NULL DEFAULT now(),
  updated_at    timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.price_config ENABLE ROW LEVEL SECURITY;
CREATE POLICY "price_config public read" ON public.price_config FOR SELECT USING (true);
CREATE POLICY "price_config service_role all" ON public.price_config FOR ALL TO service_role USING (true) WITH CHECK (true);

CREATE TRIGGER set_price_config_updated_at
  BEFORE UPDATE ON public.price_config
  FOR EACH ROW EXECUTE PROCEDURE public.set_updated_at();

-- ============================================================
-- 12. TABLE: EXPENSES & PAYROLL
-- ============================================================

CREATE TABLE public.expenses (
  id           uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id      uuid REFERENCES public.profiles(id) NOT NULL,
  amount       numeric(10,2) NOT NULL,
  currency     text NOT NULL DEFAULT 'MXN',
  category     text NOT NULL,
  expense_date timestamptz NOT NULL,
  reference    text,
  notes        text,
  created_at   timestamptz NOT NULL DEFAULT now(),
  updated_at   timestamptz NOT NULL DEFAULT now()
);

-- RLS: Service Role Only
ALTER TABLE public.expenses ENABLE ROW LEVEL SECURITY;
CREATE POLICY "expenses service_role all" ON public.expenses FOR ALL TO service_role USING (true) WITH CHECK (true);

CREATE TRIGGER set_expenses_updated_at
  BEFORE UPDATE ON public.expenses
  FOR EACH ROW EXECUTE PROCEDURE public.set_updated_at();

CREATE TABLE public.payroll (
  id           uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id      uuid REFERENCES public.profiles(id) NOT NULL,
  employee     text NOT NULL,
  period_start timestamptz NOT NULL,
  period_end   timestamptz NOT NULL,
  amount       numeric(10,2) NOT NULL,
  currency     text NOT NULL DEFAULT 'MXN',
  notes        text,
  created_at   timestamptz NOT NULL DEFAULT now(),
  updated_at   timestamptz NOT NULL DEFAULT now()
);

-- RLS: Service Role Only
ALTER TABLE public.payroll ENABLE ROW LEVEL SECURITY;
CREATE POLICY "payroll service_role all" ON public.payroll FOR ALL TO service_role USING (true) WITH CHECK (true);

CREATE TRIGGER set_payroll_updated_at
  BEFORE UPDATE ON public.payroll
  FOR EACH ROW EXECUTE PROCEDURE public.set_updated_at();

-- ============================================================
-- 13. INDEXES
-- ============================================================

-- Orders
CREATE INDEX IF NOT EXISTS idx_orders_order_status_scheduled_date ON public.orders(order_status, scheduled_date);
CREATE INDEX IF NOT EXISTS idx_orders_scheduled_date ON public.orders(scheduled_date);
CREATE INDEX IF NOT EXISTS idx_orders_lead_id ON public.orders(lead_id);
CREATE INDEX IF NOT EXISTS idx_orders_customer_id_ordered_at ON public.orders(customer_id, ordered_at DESC);
CREATE INDEX IF NOT EXISTS idx_orders_created_at ON public.orders(created_at);
CREATE INDEX IF NOT EXISTS idx_orders_ordered_at ON public.orders(ordered_at);
CREATE INDEX IF NOT EXISTS idx_orders_seller_id ON public.orders(seller_id);
CREATE INDEX IF NOT EXISTS idx_orders_payment_status ON public.orders(payment_status);
CREATE INDEX IF NOT EXISTS idx_orders_fiscal_status ON public.orders(fiscal_status);
CREATE INDEX IF NOT EXISTS idx_orders_order_status_payment_status_ordered_at ON public.orders(order_status, payment_status, ordered_at DESC);
CREATE INDEX IF NOT EXISTS idx_orders_visitor_id ON public.orders(visitor_id);

-- Order import log
CREATE UNIQUE INDEX IF NOT EXISTS ux_order_import_log_idempotency
  ON public.order_import_log(import_source, import_row_hash)
  WHERE import_source IS NOT NULL AND import_row_hash IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_order_import_log_batch ON public.order_import_log(import_batch_id);

-- Payments
CREATE INDEX IF NOT EXISTS idx_order_payments_order_paid_at ON public.order_payments(order_id, paid_at DESC);

-- Status History
CREATE INDEX IF NOT EXISTS idx_order_status_history_order_id ON public.order_status_history(order_id, changed_at DESC);

-- Leads
CREATE INDEX IF NOT EXISTS idx_leads_created_at ON public.leads(created_at);
CREATE INDEX IF NOT EXISTS idx_leads_status ON public.leads(status);
CREATE INDEX IF NOT EXISTS idx_leads_phone ON public.leads(phone);
CREATE INDEX IF NOT EXISTS idx_leads_phone_norm ON public.leads(phone_norm);
CREATE INDEX IF NOT EXISTS idx_leads_visitor_id ON public.leads(visitor_id);
CREATE INDEX IF NOT EXISTS idx_leads_customer_id_created_at ON public.leads(customer_id, created_at DESC);

-- Customers
CREATE INDEX IF NOT EXISTS idx_customers_primary_phone_norm ON public.customers(primary_phone_norm);
CREATE INDEX IF NOT EXISTS idx_customers_primary_email_norm ON public.customers(primary_email_norm);
CREATE INDEX IF NOT EXISTS idx_customer_identities_customer_id ON public.customer_identities(customer_id);

-- ============================================================
-- 14. LEGACY RECONCILIATION FOUNDATION
-- ============================================================


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

