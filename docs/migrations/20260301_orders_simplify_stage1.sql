begin;

alter table public.orders
  add column if not exists attribution_extra_json jsonb not null default '{}'::jsonb;

alter table public.orders
  drop constraint if exists ck_orders_attribution_extra_is_object;

alter table public.orders
  add constraint ck_orders_attribution_extra_is_object
  check (jsonb_typeof(attribution_extra_json) = 'object');

create table if not exists public.order_import_log (
  order_id uuid primary key references public.orders(id) on delete cascade,
  import_source text,
  import_batch_id text,
  import_row_hash text,
  legacy_folio_raw text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index if not exists ux_order_import_log_idempotency
  on public.order_import_log(import_source, import_row_hash)
  where import_source is not null and import_row_hash is not null;

create index if not exists idx_order_import_log_batch
  on public.order_import_log(import_batch_id);

drop trigger if exists set_order_import_log_updated_at on public.order_import_log;
create trigger set_order_import_log_updated_at
  before update on public.order_import_log
  for each row execute procedure public.set_updated_at();

alter table public.order_import_log enable row level security;
drop policy if exists "order_import_log service_role all" on public.order_import_log;
create policy "order_import_log service_role all"
  on public.order_import_log for all to service_role using (true) with check (true);

commit;
