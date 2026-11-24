-- Tolerant historical import:
-- 1. Orders store pending import issues in a structured column.
-- 2. cej_promote_import only blocks on blocking issues, promotes rows with pending issues,
--    setting missing historical values to null and preserving pending issues list.
-- 3. Staging and promoting an updated Excel with resolved issues updates existing orders without duplicating.
-- 4. An order whose field was manually captured or modified won't be overwritten.

alter table public.orders add column if not exists pending_issues jsonb not null default '[]'::jsonb;

-- Function to check if a specific issue text is considered blocking
create or replace function public.cej_is_blocking_issue(t text) returns boolean
language sql immutable set search_path=public,pg_temp as $$
  select not (
    t like '%Teléfono no normalizable%'
    or t like '%no contiene un número histórico válido%'
    or t like '%El volumen debe ser positivo%'
    or t like '%es fórmula sin valor guardado%'
    or t like '%fuera del periodo de la fuente%'
    or t like '%no tiene total; no se suma ni se estima%'
  );
$$;

revoke all on function public.cej_is_blocking_issue(text) from public,anon,authenticated;
grant execute on function public.cej_is_blocking_issue(text) to service_role;

create or replace function public.cej_promote_import(c uuid,actor uuid,row_id uuid,expected_hash text) returns jsonb
language plpgsql security definer set search_path=public,pg_temp as $$
declare
  r import_rows;
  m jsonb;
  customer uuid;
  o orders;
  v_key text;
  v_hits int;
  v_match text;
  v_rate numeric;
  v_total numeric;
  v_volume numeric;
  v_before numeric;
  v_pending jsonb := '[]'::jsonb;
  iss text;
  v_existing_order orders;
  v_new_issues jsonb;
begin
  if coalesce(cej_role(c,actor),'') not in ('owner','admin') then raise exception 'permission_denied'; end if;
  select * into r from import_rows where id=row_id and company_id=c for update;
  if not found or r.row_hash<>expected_hash then raise exception 'version_conflict'; end if;
  if r.status='promoted' then
    select * into o from orders where id=r.order_id;
    return jsonb_build_object('id',o.id,'folio',o.folio);
  end if;
  if r.status<>'staged' or r.mapped is null then raise exception 'import_issues'; end if;

  -- Separate blocking vs pending issues
  if r.issues is not null and jsonb_array_length(r.issues)>0 then
    for iss in select jsonb_array_elements_text(r.issues) loop
      if cej_is_blocking_issue(iss) then
        raise exception 'import_issues';
      end if;
    end loop;
  end if;

  m:=r.mapped;
  if length(trim(coalesce(m->>'reference','')))=0 or length(trim(coalesce(m->>'customer','')))=0 or m->>'ordered_at' is null then
    raise exception 'import_issues';
  end if;

  -- Extract pending issues list from mapped->'pending_issues' if present, or build from r.issues
  if m->'pending_issues' is not null and jsonb_array_length(m->'pending_issues') > 0 then
    v_pending := m->'pending_issues';
  elsif r.issues is not null and jsonb_array_length(r.issues) > 0 then
    select coalesce(jsonb_agg(jsonb_build_object('code', 'pending', 'message', elem)), '[]'::jsonb)
    into v_pending
    from jsonb_array_elements_text(r.issues) elem;
  end if;

  perform pg_advisory_xact_lock(hashtextextended(c::text||':'||(m->>'reference'),0));

  -- Check if order already exists for this external_ref
  select * into v_existing_order from orders where company_id=c and external_ref=m->>'reference' for update;

  if v_existing_order.id is not null then
    -- If existing order was not imported from this source or has manual changes, don't overwrite manual edits
    -- Only update null pending fields if current file provides them and no manual capture has occurred
    v_rate:=(m->>'vat_included_rate')::numeric;
    v_total:=round((m->>'total')::numeric,2);
    v_volume:=(m->>'volume')::numeric;
    if v_rate is not null and v_total is not null then
      v_before:=round(v_total/(1+v_rate),2);
    end if;

    -- Update only fields that were previously null / pending, preserving any existing manual capture
    update orders set
      quantity_m3 = coalesce(orders.quantity_m3, v_volume),
      total_with_vat = coalesce(orders.total_with_vat, v_total),
      vat_rate = coalesce(orders.vat_rate, case when v_before is not null then v_rate end),
      total_before_vat = coalesce(orders.total_before_vat, v_before),
      unit_price_before_vat = coalesce(orders.unit_price_before_vat, case when v_before is not null and v_volume>0 then round(v_before/v_volume,2) end),
      pending_issues = v_pending,
      updated_at = now()
    where id = v_existing_order.id
    returning * into o;

    insert into order_import_log(company_id,order_id,import_source,import_row_hash,legacy_folio_raw)
      values(c,o.id,r.source_name,r.row_hash,m->>'reference')
      on conflict do nothing;

    update import_rows set status='promoted',order_id=o.id where id=r.id;
    return jsonb_build_object('id',o.id,'folio',o.folio);
  end if;

  -- Create customer if needed
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

  v_rate:=(m->>'vat_included_rate')::numeric;
  v_total:=round((m->>'total')::numeric,2);
  v_volume:=(m->>'volume')::numeric;
  if v_rate is not null and v_total is not null then v_before:=round(v_total/(1+v_rate),2); end if;

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
