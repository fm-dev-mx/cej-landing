begin;

create or replace function public.prevent_order_pricing_edits_non_draft()
returns trigger
language plpgsql
as $$
begin
  if old.order_status <> 'draft' then
    if (new.service_type, new.product_id, new.quantity_m3, new.unit_price_before_vat, new.vat_rate, new.total_before_vat, new.total_with_vat)
       is distinct from
       (old.service_type, old.product_id, old.quantity_m3, old.unit_price_before_vat, old.vat_rate, old.total_before_vat, old.total_with_vat) then
      raise exception 'Pricing fields cannot be edited when order is not draft';
    end if;
  end if;
  return new;
end;
$$;

drop trigger if exists prevent_order_pricing_edits_non_draft_trigger on public.orders;
create trigger prevent_order_pricing_edits_non_draft_trigger
before update on public.orders
for each row execute procedure public.prevent_order_pricing_edits_non_draft();

commit;
