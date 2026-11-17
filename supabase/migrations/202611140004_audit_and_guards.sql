create table public.membership_history (
  id uuid primary key default gen_random_uuid(),company_id uuid not null references companies,
  user_id uuid not null references auth.users,role text not null,active boolean not null,
  actor_id uuid not null references auth.users,reason text not null,changed_at timestamptz not null default now()
);
alter table membership_history enable row level security;
create policy managed_history on membership_history for select to authenticated using(cej_role(company_id,auth.uid()) in ('owner','admin'));
revoke all on membership_history from anon,authenticated;grant select on membership_history to authenticated;
create trigger immutable_membership_history before update or delete on membership_history for each row execute function cej_immutable();
create function public.cej_create_profile() returns trigger language plpgsql security definer set search_path=public,pg_temp as $$ begin
  insert into profiles(id,email,role) values(new.id,new.email,'guest') on conflict(id) do nothing;
  return new;
end $$;
create trigger cej_profile_after_signup after insert on auth.users for each row execute function cej_create_profile();
revoke all on function cej_create_profile() from public,anon,authenticated;
-- Cross-company consistency also applies to payment/status/import evidence.
alter table order_status_history add foreign key(company_id,order_id) references orders(company_id,id);
alter table order_import_log add foreign key(company_id,order_id) references orders(company_id,id);
alter table customer_identities add foreign key(company_id,customer_id) references customers(company_id,id);
alter table order_fiscal_data add foreign key(company_id,order_id) references orders(company_id,id);
alter table companies add constraint freight_tax_complete check ((freight_tax is null and freight_vat_rate is null) or (freight_tax is not null and freight_vat_rate is not null));
-- Every mutation of persisted operational data is through a service-only command; no
-- authenticated/anon write policies exist. Immutable evidence cannot be updated even by commands.
