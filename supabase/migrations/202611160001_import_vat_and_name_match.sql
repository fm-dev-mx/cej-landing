-- Historical import: derive the VAT split from the reviewed rate already included in the source
-- total (never from current prices), and reuse a customer by exact normalized name when the row
-- has no phone. Name keys ignore case, repeated spaces and accents.
create extension if not exists unaccent with schema extensions;

create function public.cej_name_key(t text) returns text
language sql stable set search_path=public,extensions,pg_temp as $$
  select nullif(lower(extensions.unaccent(regexp_replace(trim(coalesce(t,'')),'\s+',' ','g'))),'')
$$;

create or replace function public.cej_promote_import(c uuid,actor uuid,row_id uuid,expected_hash text) returns jsonb
language plpgsql security definer set search_path=public,pg_temp as $$
declare r import_rows; m jsonb; customer uuid; o orders; v_key text; v_hits int; v_match text;
  v_rate numeric; v_total numeric; v_volume numeric; v_before numeric;
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
    v_match:=case when customer is null then 'new' else 'phone' end;
  else
    -- Only phoneless customers are candidates, so the grouping does not depend on promotion order.
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
  v_total:=round((m->>'total')::numeric,2); -- same cents the total_with_vat column stores
  v_volume:=(m->>'volume')::numeric;
  if v_rate is not null and v_total is not null then v_before:=round(v_total/(1+v_rate),2); end if;
  insert into orders(company_id,folio,created_by,customer_id,ordered_at,quantity_m3,total_with_vat,
    vat_rate,total_before_vat,unit_price_before_vat,
    delivery_address_text,legacy_folio_raw,external_ref,import_source,import_row_hash,pricing_snapshot_json)
    values(c,'H-'||upper(substr(gen_random_uuid()::text,1,8)),actor,customer,(m->>'ordered_at')::timestamptz,
      v_volume,v_total,
      case when v_before is not null then v_rate end,v_before,
      case when v_before is not null and v_volume>0 then round(v_before/v_volume,2) end,
      m->>'address',m->>'reference',m->>'reference',r.source_name,r.row_hash,
      jsonb_build_object('historical',true,'source',r.source_name,'sheet',r.sheet,'row_hash',r.row_hash,
        'original_values',m,'payment_balance','unknown','delivery','unknown','customer_match',v_match)
      || case when v_before is not null then jsonb_build_object('vat_basis','included_in_source_total',
        'vat_amount',v_total-v_before,'unit_price_before_vat_derived',true) else '{}'::jsonb end) returning * into o;
  insert into order_import_log(company_id,order_id,import_source,import_row_hash,legacy_folio_raw)
    values(c,o.id,r.source_name,r.row_hash,m->>'reference');
  update import_rows set status='promoted',order_id=o.id where id=r.id;
  return jsonb_build_object('id',o.id,'folio',o.folio);
end $$;
revoke all on function public.cej_promote_import(uuid,uuid,uuid,text) from public,anon,authenticated;
grant execute on function public.cej_promote_import(uuid,uuid,uuid,text) to service_role;
revoke all on function public.cej_name_key(text) from public,anon,authenticated;
grant execute on function public.cej_name_key(text) to service_role;
