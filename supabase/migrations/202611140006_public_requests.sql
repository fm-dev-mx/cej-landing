-- An explicit owner-reviewed domain binding is required; no inferred company assignment.
create table public.company_websites (
  hostname text primary key,company_id uuid not null references companies,
  enabled boolean not null default false,check(hostname=lower(hostname) and hostname !~ '[/:]')
);
alter table company_websites enable row level security;
create policy managed_website_read on company_websites for select to authenticated using(cej_role(company_id,auth.uid()) in ('owner','admin'));
revoke all on company_websites from public,anon,authenticated;
grant select on company_websites to authenticated;
create unique index company_lead_event on leads(company_id,fb_event_id) where company_id is not null and fb_event_id is not null;
create function public.cej_capture_web_request(host text,p jsonb) returns jsonb
language plpgsql security definer set search_path=public,pg_temp as $$
declare c uuid;customer uuid;lead leads;event text;
begin
  select company_id into c from company_websites where hostname=host and enabled;
  if c is null then raise exception 'website_binding_missing';end if;
  if not coalesce((p->>'privacy_accepted')::boolean,false) or nullif(p->>'phone_norm','') is null then raise exception 'request_requirements';end if;
  event:=coalesce(nullif(p->>'fb_event_id',''),gen_random_uuid()::text);
  perform pg_advisory_xact_lock(hashtextextended(c::text||':web:'||event,0));
  select * into lead from leads where company_id=c and fb_event_id=event;
  if found then return jsonb_build_object('id',lead.id,'event_id',event);end if;
  insert into customers(company_id,display_name,primary_phone_norm) values(c,p->>'name',p->>'phone_norm')
    on conflict(company_id,primary_phone_norm) do update set primary_phone_norm=excluded.primary_phone_norm returning id into customer;
  insert into leads(company_id,customer_id,name,phone,phone_norm,quote_data,visitor_id,utm_source,utm_medium,utm_campaign,utm_term,utm_content,fbclid,privacy_accepted,privacy_accepted_at,fb_event_id,occurred_at,source_channel,customer_source)
    values(c,customer,p->>'name',p->>'phone',p->>'phone_norm',p->'quote_data',p->>'visitor_id',p->>'utm_source',p->>'utm_medium',p->>'utm_campaign',p->>'utm_term',p->>'utm_content',p->>'fbclid',true,now(),event,now(),'website',null)
    returning * into lead;
  insert into marketing_outbox(company_id,event_name,event_id,fact_id,occurred_at)
    values(c,'Lead',event,lead.id::text,lead.occurred_at);
  return jsonb_build_object('id',lead.id,'event_id',event);
end $$;
revoke all on function public.cej_capture_web_request(text,jsonb) from public,anon,authenticated;
grant execute on function public.cej_capture_web_request(text,jsonb) to service_role;
