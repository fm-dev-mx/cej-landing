-- Local/Preview candidate. No automatic tenant backfill: unknown ownership stays quarantined.
create table public.companies (
  id uuid primary key default gen_random_uuid(), name text not null,
  quote_profile jsonb not null default '{}', profile_verified boolean not null default false,
  freight_tax text check (freight_tax in ('included','additional')),
  freight_vat_rate numeric check (freight_vat_rate between 0 and 1),
  created_at timestamptz not null default now()
);
create table public.company_memberships (
  company_id uuid references public.companies not null,
  user_id uuid references auth.users not null,
  role text not null check (role in ('owner','admin','operator','viewer')),
  active boolean not null default true, primary key (company_id,user_id)
);
-- Only managed memberships confer access. Never consult user_metadata or profiles.role.
create function public.cej_role(c uuid, u uuid) returns text language sql stable security definer
set search_path = public, pg_temp as $$
  select role from company_memberships where company_id=c and user_id=u and active and (u=auth.uid() or auth.role()='service_role');
$$;
revoke all on function public.cej_role(uuid,uuid) from public,anon;
grant execute on function public.cej_role(uuid,uuid) to authenticated,service_role;

do $$ declare t text; begin
  foreach t in array array['customers','leads','orders','order_payments','order_status_history',
    'order_import_log','customer_identities','customer_merge_log','order_fiscal_data','price_config',
    'expenses','payroll','products','legacy_ingest_batches','legacy_row_rejections'] loop
    execute format('alter table public.%I add column company_id uuid references public.companies',t);
    execute format('alter table public.%I enable row level security',t);
    execute format('create policy company_read on public.%I for select to authenticated using (public.cej_role(company_id,auth.uid()) is not null)',t);
    execute format('revoke all on public.%I from anon, authenticated',t);
    execute format('grant select on public.%I to authenticated',t);
    execute format('grant all on public.%I to service_role',t);
  end loop;
end $$;
alter table public.profiles enable row level security;
create policy own_profile on public.profiles for select to authenticated using (id=auth.uid());
revoke all on public.profiles from anon,authenticated;
grant select on public.profiles to authenticated;
alter table public.service_slots enable row level security;
create policy slot_read on public.service_slots for select to authenticated using (true);
revoke all on public.service_slots from anon,authenticated;
grant select on public.service_slots to authenticated;
alter table public.orders alter column user_id drop not null;
alter table public.orders add column version integer not null default 1;
alter table public.orders add column project_id uuid;
alter table public.orders add column quote_revision_id uuid;
alter table public.orders add column customer_accepted_at timestamptz;
alter table public.orders add column confirmed_at timestamptz;
alter table public.orders add column confirmed_by uuid references auth.users;
alter table public.orders add column currency text not null default 'MXN';
alter table public.orders drop constraint valid_scheduling_slots;
alter table public.orders add constraint scheduled_window_required check (
  order_status <> 'scheduled' or (scheduled_window_start is not null and scheduled_window_end > scheduled_window_start));
alter table public.customers add unique(company_id,id);
alter table public.customers add constraint company_phone unique(company_id,primary_phone_norm);
alter table public.orders add unique(company_id,id);
alter table public.orders add constraint order_customer_company foreign key(company_id,customer_id) references public.customers(company_id,id);
alter table public.leads add unique(company_id,id);
alter table public.leads add column customer_source text;
alter table public.leads add column captured_by uuid references auth.users;
alter table public.leads add column occurred_at timestamptz;
alter table public.leads add column source_channel text;
alter table public.leads add constraint lead_customer_company foreign key(company_id,customer_id) references public.customers(company_id,id);
create table public.projects (
  id uuid primary key default gen_random_uuid(), company_id uuid references companies not null,
  customer_id uuid not null, name text not null, address text not null,
  responsible_id uuid references auth.users, created_at timestamptz not null default now(),
  unique(company_id,id), unique(company_id,id,customer_id),
  foreign key(company_id,customer_id) references customers(company_id,id)
);
create table public.quotes (
  id uuid primary key default gen_random_uuid(), company_id uuid references companies not null,
  folio text not null default ('C-' || upper(substr(gen_random_uuid()::text,1,8))),
  customer_id uuid, project_id uuid, lead_id bigint, current_revision integer not null default 1,
  created_by uuid references auth.users not null, created_at timestamptz not null default now(),
  unique(company_id,id), unique(company_id,folio),
  foreign key(company_id,customer_id) references customers(company_id,id),
  foreign key(company_id,project_id,customer_id) references projects(company_id,id,customer_id),
  foreign key(company_id,lead_id) references leads(company_id,id),
  check(project_id is null or customer_id is not null)
);
create table public.quote_revisions (
  id uuid primary key default gen_random_uuid(), company_id uuid references companies not null,
  quote_id uuid not null, revision integer not null check(revision>0),
  snapshot jsonb not null, customer_id uuid, project_id uuid, lead_id bigint,
  foreign key(company_id,customer_id) references customers(company_id,id),
  foreign key(company_id,project_id,customer_id) references projects(company_id,id,customer_id),
  foreign key(company_id,lead_id) references leads(company_id,id),
  exception_reason text, needs_approval boolean not null default false,
  pending_tax boolean not null default false, created_by uuid references auth.users not null,
  created_at timestamptz not null default now(), unique(quote_id,revision), unique(company_id,id),
  foreign key(company_id,quote_id) references quotes(company_id,id)
);
create table public.quote_approvals (
  revision_id uuid primary key, company_id uuid not null references companies,
  authorized_by uuid references auth.users not null, reason text not null check(length(trim(reason))>0),
  authorized_at timestamptz not null default now(),
  foreign key(company_id,revision_id) references quote_revisions(company_id,id)
);
alter table public.orders add foreign key(company_id,project_id,customer_id) references projects(company_id,id,customer_id);
alter table public.orders add foreign key(company_id,quote_revision_id) references quote_revisions(company_id,id);
create unique index one_order_per_accepted_revision on public.orders(quote_revision_id) where quote_revision_id is not null;
alter table public.orders add foreign key(company_id,lead_id) references leads(company_id,id);
alter table public.order_payments add foreign key(company_id,order_id) references orders(company_id,id);
create table public.followups (
  id uuid primary key default gen_random_uuid(), company_id uuid references companies not null,
  customer_id uuid not null, project_id uuid, responsible_id uuid references auth.users not null,
  action text not null, due_at timestamptz not null, completed_at timestamptz, result text,
  previous_id uuid, version integer not null default 1, unique(company_id,id),
  foreign key(company_id,customer_id) references customers(company_id,id),
  foreign key(company_id,project_id,customer_id) references projects(company_id,id,customer_id),
  foreign key(company_id,previous_id) references followups(company_id,id)
);
create table public.sale_facts (
  id uuid primary key default gen_random_uuid(), company_id uuid references companies not null,
  order_id uuid not null unique, customer_id uuid not null, quote_revision_id uuid,
  amount_mxn numeric(12,2) not null check(amount_mxn>=0), currency text not null check(currency='MXN'),
  occurred_at timestamptz not null, actor_id uuid references auth.users not null,
  source_channel text, origin text, imported boolean not null default false,
  foreign key(company_id,order_id) references orders(company_id,id),
  foreign key(company_id,customer_id) references customers(company_id,id),
  foreign key(company_id,quote_revision_id) references quote_revisions(company_id,id)
);
create table public.marketing_outbox (
  id uuid primary key default gen_random_uuid(), company_id uuid references companies not null,
  event_name text not null check(event_name in ('Lead','Purchase')), event_id text not null unique,
  fact_id text not null, occurred_at timestamptz not null,
  status text not null default 'pending_eligibility' check(status in ('pending_eligibility','ready','processing','retry','accepted','dead')),
  attempts integer not null default 0, next_attempt_at timestamptz not null default now(),
  leased_until timestamptz, payload jsonb, last_error text, api_receipt jsonb,
  unique(company_id,event_name,fact_id)
);
create table public.import_rows (
  id uuid primary key default gen_random_uuid(), company_id uuid references companies not null,
  source_name text not null, file_hash text not null, sheet text not null, row_number integer not null,
  sheet_state text not null, hidden boolean not null, row_hash text not null,
  raw jsonb not null, mapped jsonb, issues jsonb not null default '[]',
  status text not null default 'staged' check(status in ('staged','promoted','rejected')),
  order_id uuid, created_by uuid references auth.users not null, created_at timestamptz not null default now(),
  unique(company_id,source_name,sheet,row_hash), foreign key(company_id,order_id) references orders(company_id,id)
);
do $$ declare t text; begin
  foreach t in array array['companies','company_memberships'] loop
    execute format('alter table public.%I enable row level security',t);
    execute format('revoke all on public.%I from anon,authenticated',t);
    execute format('grant select on public.%I to authenticated',t);
  end loop;
  foreach t in array array['projects','quotes','quote_revisions','quote_approvals','followups','sale_facts','marketing_outbox','import_rows'] loop
    execute format('alter table public.%I enable row level security',t);
    execute format('create policy company_read on public.%I for select to authenticated using (public.cej_role(company_id,auth.uid()) is not null)',t);
    execute format('revoke all on public.%I from anon,authenticated',t);
    execute format('grant select on public.%I to authenticated',t);
  end loop;
end $$;
create policy member_company on companies for select to authenticated using (cej_role(id,auth.uid()) is not null);
create policy own_memberships on company_memberships for select to authenticated using(user_id=auth.uid());

create function public.cej_immutable() returns trigger language plpgsql as $$ begin
  raise exception 'immutable_fact';
end $$;
create trigger immutable_revision before update or delete on quote_revisions for each row execute function cej_immutable();
create trigger immutable_sale before update or delete on sale_facts for each row execute function cej_immutable();
create trigger immutable_approval before update or delete on quote_approvals for each row execute function cej_immutable();

-- Atomic use cases. Only server service_role can execute; actor comes from verified auth.getUser.
-- Every branch checks a managed membership; authenticated clients have SELECT only plus RLS.
create function public.cej_command(c uuid, actor uuid, kind text, p jsonb) returns jsonb
language plpgsql security definer set search_path=public,pg_temp as $$
declare r text; q quotes; rev quote_revisions; o orders; f followups; v_id uuid; n integer;
  s jsonb; company companies; start_at timestamptz; end_at timestamptz; customer uuid; project uuid;
  previous text; result jsonb; item jsonb;
begin
  r := cej_role(c,actor);
  if r is null or r='viewer' then raise exception 'permission_denied'; end if;
  if kind in ('approve','configure','stage','promote') and r not in ('owner','admin') then raise exception 'permission_denied'; end if;
  if kind='membership' then
    if r <> 'owner' then raise exception 'permission_denied'; end if;
    perform pg_advisory_xact_lock(hashtextextended(c::text||':membership',0));
    if (p->>'role'<>'owner' or not (p->>'active')::boolean) and
      exists(select 1 from company_memberships where company_id=c and user_id=(p->>'user_id')::uuid and role='owner' and active)
      and (select count(*) from company_memberships where company_id=c and role='owner' and active)<2 then raise exception 'last_owner'; end if;
    insert into company_memberships(company_id,user_id,role,active) values(c,(p->>'user_id')::uuid,p->>'role',(p->>'active')::boolean)
      on conflict(company_id,user_id) do update set role=excluded.role,active=excluded.active;
    insert into membership_history(company_id,user_id,role,active,actor_id,reason) values(c,(p->>'user_id')::uuid,p->>'role',(p->>'active')::boolean,actor,p->>'reason');
    v_id:=(p->>'user_id')::uuid;
  elsif kind='configure' then
    if r <> 'owner' then raise exception 'permission_denied'; end if;
    update companies set quote_profile=p->'profile',profile_verified=(p->>'verified')::boolean,
      freight_tax=nullif(p->>'freight_tax',''),freight_vat_rate=(p->>'freight_vat_rate')::numeric where id=c;
    return jsonb_build_object('id',c);
  elsif kind='customer' then
    insert into customers(company_id,display_name,primary_phone_norm) values(c,p->>'name',nullif(p->>'phone',''))
      returning id into v_id;
  elsif kind='project' then
    if cej_role(c,(p->>'responsible_id')::uuid) is null then raise exception 'invalid_responsible'; end if;
    insert into projects(company_id,customer_id,name,address,responsible_id)
      values(c,(p->>'customer_id')::uuid,p->>'name',p->>'address',(p->>'responsible_id')::uuid) returning id into v_id;
  elsif kind='quote' then
    s:=p->'snapshot'; customer:=nullif(p->>'customer_id','')::uuid; project:=nullif(p->>'project_id','')::uuid;
    if s->>'mode'='generic' and (customer is not null or project is not null or nullif(p->>'lead_id','') is not null) then raise exception 'generic_has_identity'; end if;
    if s->>'mode'='formal' and customer is null then raise exception 'customer_required'; end if;
    if nullif(p->>'lead_id','') is not null and not exists(select 1 from leads where company_id=c and id=(p->>'lead_id')::bigint and customer_id=customer) then raise exception 'request_customer_mismatch'; end if;
    if nullif(p->>'id','') is null then
      insert into quotes(company_id,customer_id,project_id,lead_id,created_by)
        values(c,customer,project,nullif(p->>'lead_id','')::bigint,actor) returning * into q;
    else
      select * into q from quotes where id=(p->>'id')::uuid and company_id=c for update;
      if not found then raise exception 'not_found'; end if;
      if q.current_revision<>(p->>'expected_version')::integer then raise exception 'version_conflict'; end if;
      update quotes set current_revision=current_revision+1,customer_id=customer,project_id=project,lead_id=nullif(p->>'lead_id','')::bigint where id=q.id returning * into q;
    end if;
    insert into quote_revisions(company_id,quote_id,revision,snapshot,customer_id,project_id,lead_id,needs_approval,pending_tax,exception_reason,created_by)
      values(c,q.id,q.current_revision,s,q.customer_id,q.project_id,q.lead_id,coalesce((p->>'needs_approval')::boolean,false),
        coalesce((p->>'pending_tax')::boolean,false),nullif(p->>'reason',''),actor) returning * into rev;
    return jsonb_build_object('id',q.id,'folio',q.folio,'revision_id',rev.id,'revision',rev.revision);
  elsif kind='approve' then
    select * into rev from quote_revisions where id=(p->>'id')::uuid and company_id=c;
    if not found or rev.pending_tax then raise exception 'revision_not_approvable'; end if;
    if not exists(select 1 from quotes where id=rev.quote_id and current_revision=rev.revision) then raise exception 'stale_revision'; end if;
    insert into quote_approvals(revision_id,company_id,authorized_by,reason) values(rev.id,c,actor,p->>'reason');
    v_id:=rev.id;
  elsif kind='order' then
    if nullif(p->>'revision_id','') is not null then
      perform pg_advisory_xact_lock(hashtextextended(c::text||':'||(p->>'revision_id'),0));
      select * into rev from quote_revisions where id=(p->>'revision_id')::uuid and company_id=c;
      if not found then raise exception 'not_found'; end if;
      if rev.pending_tax or (rev.needs_approval and not exists(select 1 from quote_approvals where revision_id=rev.id)) then raise exception 'offer_not_authorized'; end if;
      if rev.snapshot->>'mode'='formal' and not coalesce((rev.snapshot->>'formal_ready')::boolean,false) then raise exception 'formal_profile_pending'; end if;
      select * into q from quotes where id=rev.quote_id;
      if rev.customer_id is null then raise exception 'customer_required'; end if;
      customer:=rev.customer_id; project:=rev.project_id; s:=rev.snapshot;
      if nullif(s->>'valid_until','')::timestamptz<now() then raise exception 'offer_expired'; end if;
      select * into o from orders where quote_revision_id=rev.id;
      if found then return jsonb_build_object('id',o.id,'folio',o.folio); end if;
    else
      customer:=(p->>'customer_id')::uuid; project:=nullif(p->>'project_id','')::uuid; s:=p->'snapshot';
      if coalesce((s->>'pending_tax')::boolean,false) or coalesce((s->>'needs_approval')::boolean,false) then raise exception 'offer_not_authorized'; end if;
    end if;
    if customer is null then raise exception 'customer_required'; end if;
    insert into orders(company_id,folio,created_by,seller_id,customer_id,project_id,quote_revision_id,lead_id,
      service_type,product_id,quantity_m3,unit_price_before_vat,vat_rate,total_before_vat,total_with_vat,
      pricing_snapshot_json,delivery_address_text,balance_amount)
      values(c,'P-'||upper(substr(gen_random_uuid()::text,1,8)),actor,actor,customer,project,rev.id,rev.lead_id,
      case when s->'inputs'->>'type'='pumped' then 'bombeado' else 'tirado' end,
      s->'inputs'->>'strength',(s->'pricing'->'volume'->>'billedM3')::numeric,
      (s->'pricing'->>'unitPricePerM3')::numeric,(s->>'vat_rate')::numeric,
      (s->>'subtotal')::numeric,(s->>'total')::numeric,s,p->>'address',(s->>'total')::numeric) returning * into o;
    return jsonb_build_object('id',o.id,'folio',o.folio);
  elsif kind in ('confirm','schedule','status','payment') then
    select * into o from orders where id=(p->>'id')::uuid and company_id=c for update;
    if not found then raise exception 'not_found'; end if;
    if kind='confirm' and o.confirmed_at is not null then return jsonb_build_object('id',o.id,'folio',o.folio); end if;
    if o.version<>(p->>'expected_version')::integer then raise exception 'version_conflict'; end if;
    previous:=o.order_status::text;
    if kind='confirm' then
      if not coalesce((p->>'accepted')::boolean,false) or o.order_status<>'draft' or o.customer_id is null or length(trim(coalesce(o.delivery_address_text,'')))=0 then raise exception 'confirmation_requirements'; end if;
      update orders set order_status='confirmed',customer_accepted_at=(p->>'accepted_at')::timestamptz,
        confirmed_at=now(),confirmed_by=actor,version=version+1 where id=o.id returning * into o;
      insert into sale_facts(company_id,order_id,customer_id,quote_revision_id,amount_mxn,currency,occurred_at,actor_id,source_channel,origin)
        values(c,o.id,o.customer_id,o.quote_revision_id,o.total_with_vat,o.currency,o.confirmed_at,actor,p->>'source_channel',p->>'origin') returning id into v_id;
      insert into marketing_outbox(company_id,event_name,event_id,fact_id,occurred_at)
        values(c,'Purchase','sale:'||v_id,v_id::text,o.confirmed_at);
    elsif kind='schedule' then
      if o.confirmed_at is null or o.order_status not in ('confirmed','scheduled') then raise exception 'confirm_before_scheduling'; end if;
      start_at:=(p->>'start')::timestamptz; end_at:=(p->>'end')::timestamptz;
      if end_at<=start_at then raise exception 'invalid_window'; end if;
      -- Serializes conflict detection per company without inventing physical fleet capacity.
      perform pg_advisory_xact_lock(hashtextextended(c::text,0));
      if not coalesce((p->>'acknowledge_conflicts')::boolean,false) and exists(select 1 from orders
        where company_id=c and id<>o.id and order_status='scheduled'
        and tstzrange(scheduled_window_start,scheduled_window_end,'[)') && tstzrange(start_at,end_at,'[)')) then raise exception 'schedule_overlap'; end if;
      update orders set scheduled_window_start=start_at,scheduled_window_end=end_at,
        scheduled_date=(start_at at time zone 'America/Ciudad_Juarez')::date,
        order_status='scheduled',version=version+1 where id=o.id returning * into o;
    elsif kind='status' then
      if not ((o.order_status in ('confirmed','scheduled') and p->>'status' in ('in_progress','cancelled'))
        or (o.order_status in ('scheduled','in_progress') and p->>'status'='completed')
        or (o.order_status='in_progress' and p->>'status'='cancelled') or (o.order_status='draft' and p->>'status'='cancelled')) then raise exception 'invalid_transition'; end if;
      update orders set order_status=(p->>'status')::order_status_enum,version=version+1 where id=o.id returning * into o;
    else
      if o.confirmed_at is null then raise exception 'confirm_before_payment'; end if;
      insert into order_payments(company_id,order_id,direction,kind,method,amount_mxn,paid_at,reference,created_by)
        values(c,o.id,'in',(p->>'kind')::payment_kind_enum,(p->>'method')::payment_method_enum,
          (p->>'amount')::numeric,(p->>'paid_at')::timestamptz,p->>'reference',actor);
      update orders set version=version+1 where id=o.id;
    end if;
    if kind<>'payment' then
      insert into order_status_history(company_id,order_id,from_status,to_status,reason,changed_by)
        values(c,o.id,previous::order_status_enum,o.order_status,p->>'reason',actor);
    end if;
    return jsonb_build_object('id',o.id,'folio',o.folio);
  elsif kind='followup' then
    if cej_role(c,(p->>'responsible_id')::uuid) is null then raise exception 'invalid_responsible'; end if;
    insert into followups(company_id,customer_id,project_id,responsible_id,action,due_at)
      values(c,(p->>'customer_id')::uuid,nullif(p->>'project_id','')::uuid,(p->>'responsible_id')::uuid,p->>'action',(p->>'due_at')::timestamptz) returning id into v_id;
  elsif kind='complete_followup' then
    select * into f from followups where id=(p->>'id')::uuid and company_id=c for update;
    if not found then raise exception 'not_found'; end if;
    if f.completed_at is not null or f.version<>(p->>'expected_version')::integer then raise exception 'version_conflict'; end if;
    update followups set completed_at=now(),result=p->>'result',version=version+1 where id=f.id;
    if nullif(p->>'next_action','') is not null then
      insert into followups(company_id,customer_id,project_id,responsible_id,action,due_at,previous_id)
        values(c,f.customer_id,f.project_id,f.responsible_id,p->>'next_action',(p->>'next_due_at')::timestamptz,f.id);
    end if;
    v_id:=f.id;
  elsif kind='request' then
    insert into leads(company_id,name,phone,phone_norm,customer_id,quote_data,status,captured_by,occurred_at,customer_source,source_channel)
      select c,display_name,coalesce(primary_phone_norm,''),primary_phone_norm,id,'{}','new',actor,
        (p->>'occurred_at')::timestamptz,p->>'origin',p->>'source_channel'
      from customers where company_id=c and id=(p->>'customer_id')::uuid returning id into n;
    if n is null then raise exception 'not_found'; end if;
    insert into marketing_outbox(company_id,event_name,event_id,fact_id,occurred_at)
      values(c,'Lead','request:'||c||':'||n,n::text,(p->>'occurred_at')::timestamptz);
    return jsonb_build_object('id',n);
  elsif kind='stage' then
    for item in select * from jsonb_array_elements(p->'rows') loop
      insert into import_rows(company_id,source_name,file_hash,sheet,row_number,sheet_state,hidden,row_hash,raw,mapped,issues,created_by)
        values(c,p->>'source_name',p->>'file_hash',item->>'sheet',(item->>'row_number')::integer,
          item->>'sheet_state',(item->>'hidden')::boolean,item->>'row_hash',item->'raw',item->'mapped',item->'issues',actor)
        on conflict(company_id,source_name,sheet,row_hash) do update set
          mapped=excluded.mapped, issues=excluded.issues
          where import_rows.status='staged' and excluded.mapped is not null;
    end loop;
    return jsonb_build_object('id',p->>'file_hash');
  else raise exception 'unknown_command';
  end if;
  return jsonb_build_object('id',v_id);
end $$;
revoke all on function public.cej_command(uuid,uuid,text,jsonb) from public,anon,authenticated;
grant execute on function public.cej_command(uuid,uuid,text,jsonb) to service_role;

create index orders_company_schedule on orders(company_id,scheduled_window_start);
create index orders_company_recent on orders(company_id,ordered_at desc,id);
create index followups_due on followups(company_id,due_at) where completed_at is null;
create index quotes_customer on quotes(company_id,customer_id);
create index outbox_ready on marketing_outbox(status,next_attempt_at);
