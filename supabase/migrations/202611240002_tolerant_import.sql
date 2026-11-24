-- Tolerant historical import:
-- 1. Orders store pending import issues in a structured column.
-- 2. cej_promote_import blocks only on blocking issue codes (mapped.issue_codes runs parallel to
--    import_rows.issues) and promotes rows with pending ones, leaving the missing value null.
-- 3. A later file for an order that already exists completes its null fields only, never
--    overwrites a captured value, and raises import_conflict when the reference points at another
--    customer, date or total.
-- 4. order_import_log keeps one entry per (order, source row) instead of one per order.

alter table public.orders add column if not exists pending_issues jsonb not null default '[]'::jsonb;

alter table public.order_import_log drop constraint if exists order_import_log_pkey;
create unique index if not exists order_import_log_order_row_key
  on public.order_import_log(order_id, coalesce(import_row_hash,''));

create or replace function public.cej_is_pending_issue_code(t text) returns boolean
language sql immutable set search_path=public,pg_temp as $$
  select t in ('phone_invalid','amount_invalid','formula_empty','date_out_of_range','grouped_line_without_total');
$$;
revoke all on function public.cej_is_pending_issue_code(text) from public,anon,authenticated;
grant execute on function public.cej_is_pending_issue_code(text) to service_role;

create or replace function public.cej_promote_import(c uuid,actor uuid,row_id uuid,expected_hash text) returns jsonb
language plpgsql security definer set search_path=public,pg_temp as $$
declare
  r import_rows;
  m jsonb;
  customer uuid;
  o orders;
  ex orders;
  v_key text;
  v_hits int;
  v_match text;
  v_rate numeric;
  v_total numeric;
  v_volume numeric;
  v_before numeric;
  v_pending jsonb := '[]'::jsonb;
  v_codes jsonb;
  v_ex_key text;
  n_qty numeric;
  n_total numeric;
  n_before numeric;
  n_vat numeric;
  n_unit numeric;
  n_pending jsonb;
begin
  if coalesce(cej_role(c,actor),'') not in ('owner','admin') then raise exception 'permission_denied'; end if;
  select * into r from import_rows where id=row_id and company_id=c for update;
  if not found or r.row_hash<>expected_hash then raise exception 'version_conflict'; end if;
  if r.status='promoted' then
    select * into o from orders where id=r.order_id;
    return jsonb_build_object('id',o.id,'folio',o.folio);
  end if;
  if r.status<>'staged' or r.mapped is null then raise exception 'import_issues'; end if;
  m:=r.mapped;

  -- Every issue needs a recorded code and every code must be a pending one. Staging without codes
  -- (older loads) stays blocked until it is staged again.
  if jsonb_typeof(r.issues)<>'array' then raise exception 'import_issues'; end if;
  if jsonb_array_length(r.issues)>0 then
    v_codes:=m->'issue_codes';
    if jsonb_typeof(v_codes)<>'array' or jsonb_array_length(v_codes)<>jsonb_array_length(r.issues) then
      raise exception 'import_issues';
    end if;
    if exists(select 1 from jsonb_array_elements_text(v_codes) k where not cej_is_pending_issue_code(k)) then
      raise exception 'import_issues';
    end if;
    select coalesce(jsonb_agg(jsonb_build_object('code',k.code,'message',i.msg) order by k.n),'[]'::jsonb)
      into v_pending
      from jsonb_array_elements_text(v_codes) with ordinality as k(code,n)
      join jsonb_array_elements_text(r.issues) with ordinality as i(msg,n) on i.n=k.n;
  end if;

  if length(trim(coalesce(m->>'reference','')))=0 or length(trim(coalesce(m->>'customer','')))=0 or m->>'ordered_at' is null then
    raise exception 'import_issues';
  end if;

  v_rate:=(m->>'vat_included_rate')::numeric;
  v_total:=round((m->>'total')::numeric,2);
  v_volume:=(m->>'volume')::numeric;
  if v_volume is not null and v_volume<=0 then v_volume:=null; end if; -- quantity_m3 must be > 0
  if v_rate is not null and v_total is not null then v_before:=round(v_total/(1+v_rate),2); end if;

  perform pg_advisory_xact_lock(hashtextextended(c::text||':'||(m->>'reference'),0));

  select * into ex from orders where company_id=c and external_ref=m->>'reference' for update;
  if found then
    -- The reference must still describe the same order: same imported origin, customer and date,
    -- and no different total. Otherwise an old or unrelated row would silently rewrite it.
    select cej_name_key(display_name) into v_ex_key from customers where id=ex.customer_id;
    if ex.import_source is null
      or v_ex_key is distinct from cej_name_key(m->>'customer')
      or ex.ordered_at<>(m->>'ordered_at')::timestamptz
      or (ex.total_with_vat is not null and v_total is not null and ex.total_with_vat<>v_total)
    then raise exception 'import_conflict'; end if;

    -- Complete null fields only; a value captured by hand (or by an earlier load) is kept.
    n_qty:=coalesce(ex.quantity_m3,v_volume);
    n_total:=coalesce(ex.total_with_vat,v_total);
    n_before:=coalesce(ex.total_before_vat,case when ex.total_with_vat is null then v_before end);
    n_vat:=coalesce(ex.vat_rate,case when n_before is not null and ex.total_with_vat is null then v_rate end);
    n_unit:=coalesce(ex.unit_price_before_vat,case when n_before is not null and n_qty>0 then round(n_before/n_qty,2) end);

    -- Pending list: what was pending before plus what this row reports, minus amount issues that
    -- no longer apply because both the volume and the total are now present.
    select coalesce(jsonb_agg(e),'[]'::jsonb) into n_pending from (
      select distinct on (e->>'code',e->>'message') e
        from jsonb_array_elements(coalesce(ex.pending_issues,'[]'::jsonb)||v_pending) e
       where not (e->>'code' in ('amount_invalid','formula_empty','grouped_line_without_total')
                  and n_qty is not null and n_total is not null)
    ) q;

    if n_qty is distinct from ex.quantity_m3 or n_total is distinct from ex.total_with_vat
      or n_before is distinct from ex.total_before_vat or n_vat is distinct from ex.vat_rate
      or n_unit is distinct from ex.unit_price_before_vat or n_pending is distinct from ex.pending_issues then
      update orders set quantity_m3=n_qty,total_with_vat=n_total,total_before_vat=n_before,vat_rate=n_vat,
        unit_price_before_vat=n_unit,pending_issues=n_pending,version=orders.version+1,updated_at=now()
       where id=ex.id returning * into o;
    else o:=ex; end if;

    insert into order_import_log(company_id,order_id,import_source,import_row_hash,legacy_folio_raw)
      values(c,o.id,r.source_name,r.row_hash,m->>'reference')
      on conflict do nothing;
    update import_rows set status='promoted',order_id=o.id where id=r.id;
    return jsonb_build_object('id',o.id,'folio',o.folio);
  end if;

  if nullif(m->>'phone','') is not null then
    select id into customer from customers where company_id=c and primary_phone_norm=m->>'phone';
    v_match:=case when customer is null then 'new' else 'phone' end;
  else
    v_key:=cej_name_key(m->>'customer');
    perform pg_advisory_xact_lock(hashtextextended(c::text||':name:'||v_key,0));
    select count(*),min(id::text)::uuid into v_hits,customer from customers
      where company_id=c and primary_phone_norm is null and cej_name_key(display_name)=v_key;
    if v_hits>1 then customer:=null; v_match:='new_ambiguous_name';
    elsif v_hits=1 then v_match:='name';
    else v_match:='new'; end if;
  end if;
  if customer is null then
    insert into customers(company_id,display_name,primary_phone_norm) values(c,m->>'customer',nullif(m->>'phone','')) returning id into customer;
  end if;

  insert into orders(company_id,folio,created_by,customer_id,ordered_at,quantity_m3,total_with_vat,
    vat_rate,total_before_vat,unit_price_before_vat,
    delivery_address_text,legacy_folio_raw,external_ref,import_source,import_row_hash,pricing_snapshot_json,
    pending_issues)
    values(c,'H-'||upper(substr(gen_random_uuid()::text,1,8)),actor,customer,(m->>'ordered_at')::timestamptz,
      v_volume,v_total,
      case when v_before is not null then v_rate end,v_before,
      case when v_before is not null and v_volume>0 then round(v_before/v_volume,2) end,
      m->>'address',m->>'reference',m->>'reference',r.source_name,r.row_hash,
      jsonb_build_object('historical',true,'source',r.source_name,'sheet',r.sheet,'row_hash',r.row_hash,
        'original_values',m,'payment_balance','unknown','delivery','unknown','customer_match',v_match)
      || case when v_before is not null then jsonb_build_object('vat_basis','included_in_source_total',
        'vat_amount',v_total-v_before,'unit_price_before_vat_derived',true) else '{}'::jsonb end,
      v_pending) returning * into o;

  insert into order_import_log(company_id,order_id,import_source,import_row_hash,legacy_folio_raw)
    values(c,o.id,r.source_name,r.row_hash,m->>'reference');

  update import_rows set status='promoted',order_id=o.id where id=r.id;
  return jsonb_build_object('id',o.id,'folio',o.folio);
end $$;

revoke all on function public.cej_promote_import(uuid,uuid,uuid,text) from public,anon,authenticated;
grant execute on function public.cej_promote_import(uuid,uuid,uuid,text) to service_role;
