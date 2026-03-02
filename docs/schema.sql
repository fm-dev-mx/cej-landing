-- CEJ Database bootstrap script for Supabase
-- Snapshot: updated for branch commit-gatekeeper workflow
-- CLEAN SLATE MODE: Drops existing tables/types to enforce the new canonical schema.
-- Note: The auth.users trigger requires elevated privileges (typically handled in Supabase SQL editor).

CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ============================================================
-- 1. CLEANUP (DROP DEPENDENCIES FIRST)
-- ============================================================

-- Drop dependent tables first to avoid foreign key violations
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

-- RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "profiles service_role all" ON public.profiles FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "profiles select_own" ON public.profiles FOR SELECT TO authenticated USING (auth.uid() = id);
CREATE POLICY "profiles select_admin" ON public.profiles FOR SELECT TO authenticated USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('admin', 'owner'))
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
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('operator', 'admin', 'owner'))
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
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('admin', 'owner'))
);
CREATE POLICY "orders insert_staff" ON public.orders FOR INSERT TO authenticated WITH CHECK (
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('operator', 'admin', 'owner'))
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
