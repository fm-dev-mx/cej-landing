create unique index order_external_reference on public.orders(company_id,external_ref) where external_ref is not null;
create function public.cej_promote_import(c uuid,actor uuid,row_id uuid,expected_hash text) returns jsonb
language plpgsql security definer set search_path=public,pg_temp as $$
declare r import_rows; m jsonb; customer uuid; o orders;
begin
  if coalesce(cej_role(c,actor),'') not in ('owner','admin') then raise exception 'permission_denied'; end if;
  select * into r from import_rows where id=row_id and company_id=c for update;
  if not found or r.row_hash<>expected_hash then raise exception 'version_conflict'; end if;
  if r.status='promoted' then select * into o from orders where id=r.order_id;return jsonb_build_object('id',o.id,'folio',o.folio);end if;
  if r.status<>'staged' or r.mapped is null or jsonb_array_length(r.issues)>0 then raise exception 'import_issues'; end if;
  m:=r.mapped;
  if length(trim(coalesce(m->>'reference','')))=0 or length(trim(coalesce(m->>'customer','')))=0 or m->>'ordered_at' is null then raise exception 'import_issues'; end if;
  -- No overwrite, even if a historical file is older than a later operational correction.
  perform pg_advisory_xact_lock(hashtextextended(c::text||':'||(m->>'reference'),0));
  if exists(select 1 from orders where company_id=c and external_ref=m->>'reference') then raise exception 'import_conflict'; end if;
  if nullif(m->>'phone','') is not null then
    select id into customer from customers where company_id=c and primary_phone_norm=m->>'phone';
  end if;
  if customer is null then
    insert into customers(company_id,display_name,primary_phone_norm) values(c,m->>'customer',nullif(m->>'phone','')) returning id into customer;
  end if;
  insert into orders(company_id,folio,created_by,customer_id,ordered_at,quantity_m3,total_with_vat,
    delivery_address_text,legacy_folio_raw,external_ref,import_source,import_row_hash,pricing_snapshot_json)
    values(c,'H-'||upper(substr(gen_random_uuid()::text,1,8)),actor,customer,(m->>'ordered_at')::timestamptz,
      (m->>'volume')::numeric,(m->>'total')::numeric,m->>'address',m->>'reference',m->>'reference',r.source_name,r.row_hash,
      jsonb_build_object('historical',true,'source',r.source_name,'sheet',r.sheet,'row_hash',r.row_hash,
        'original_values',m,'payment_balance','unknown','delivery','unknown')) returning * into o;
  insert into order_import_log(company_id,order_id,import_source,import_row_hash,legacy_folio_raw)
    values(c,o.id,r.source_name,r.row_hash,m->>'reference');
  update import_rows set status='promoted',order_id=o.id where id=r.id;
  return jsonb_build_object('id',o.id,'folio',o.folio);
end $$;
revoke all on function public.cej_promote_import(uuid,uuid,uuid,text) from public,anon,authenticated;
grant execute on function public.cej_promote_import(uuid,uuid,uuid,text) to service_role;

-- SECURITY INVOKER aggregates honor RLS and do not truncate at PostgREST's row limit.
create function public.cej_summary(c uuid) returns jsonb language sql stable security invoker set search_path=public,pg_temp as $$
  select jsonb_build_object(
    'requests',(select count(*) from leads where company_id=c),
    'sales',(select count(*) from sale_facts where company_id=c),
    'sold',(select coalesce(sum(amount_mxn),0) from sale_facts where company_id=c),
    'collected',(select coalesce(sum(case when direction='in' then amount_mxn else -amount_mxn end),0) from order_payments where company_id=c and voided_at is null),
    'delivered',(select count(*) from orders where company_id=c and order_status='completed'),
    'pending_events',(select count(*) from marketing_outbox where company_id=c and status<>'accepted')
  );
$$;
revoke all on function public.cej_summary(uuid) from public,anon;
grant execute on function public.cej_summary(uuid) to authenticated;

-- Quarantined legacy data remains invisible. A future production cutover must establish
-- ownership explicitly rather than inferring it from user_id or automatically assigning CEJ.
create table public.marketing_destinations (
  company_id uuid primary key references companies,
  dataset_id text, api_version text, verified boolean not null default false,
  test_only boolean not null default true check(test_only), enabled boolean not null default false
);
alter table marketing_destinations enable row level security;
create policy own_destination on marketing_destinations for select to authenticated using(cej_role(company_id,auth.uid()) in ('owner','admin'));
revoke all on marketing_destinations from anon,authenticated;grant select on marketing_destinations to authenticated;
create function public.cej_lease_test_outbox(c uuid, max_items integer default 10) returns setof marketing_outbox
language plpgsql security definer set search_path=public,pg_temp as $$ begin
  if not exists(select 1 from marketing_destinations where company_id=c and test_only and enabled and verified) then return;end if;
  return query update marketing_outbox set status='processing',attempts=attempts+1,leased_until=now()+interval '2 minutes'
    where id in (select id from marketing_outbox where company_id=c and
      ((status in ('ready','retry') and next_attempt_at<=now()) or (status='processing' and leased_until<now()))
      order by next_attempt_at for update skip locked limit greatest(1,least(max_items,50))) returning *;
end $$;
revoke all on function public.cej_lease_test_outbox(uuid,integer) from public,anon,authenticated;
grant execute on function public.cej_lease_test_outbox(uuid,integer) to service_role;
