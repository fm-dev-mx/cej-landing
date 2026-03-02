begin;

update public.orders o
set attribution_extra_json = jsonb_strip_nulls(
  coalesce(o.attribution_extra_json, '{}'::jsonb) ||
  jsonb_build_object(
    'utm_term', o.utm_term,
    'utm_content', o.utm_content,
    'fbclid', o.fbclid,
    'gclid', o.gclid
  )
)
where
  coalesce(o.attribution_extra_json, '{}'::jsonb) = '{}'::jsonb
  and (o.utm_term is not null or o.utm_content is not null or o.fbclid is not null or o.gclid is not null);

update public.orders o
set scheduled_slot_code = s.slot_code
from public.service_slots s
where
  o.scheduled_slot_code is null
  and o.scheduled_time_label is not null
  and lower(trim(o.scheduled_time_label)) = lower(trim(s.label));

insert into public.order_import_log(order_id, import_source, import_batch_id, import_row_hash, legacy_folio_raw)
select id, import_source, import_batch_id, import_row_hash, legacy_folio_raw
from public.orders
where import_source is not null
   or import_batch_id is not null
   or import_row_hash is not null
   or legacy_folio_raw is not null
on conflict (order_id) do update
set import_source = excluded.import_source,
    import_batch_id = excluded.import_batch_id,
    import_row_hash = excluded.import_row_hash,
    legacy_folio_raw = excluded.legacy_folio_raw,
    updated_at = now();

commit;
