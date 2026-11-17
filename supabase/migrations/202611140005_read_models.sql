-- Company-scoped invoker reads: search/count before pagination, without intermediate ID caps.
create function public.cej_search_orders(c uuid,term text default '',state text default '',page_number integer default 1)
returns jsonb language sql stable security invoker set search_path=public,pg_temp as $$
  with matched as (
    select o.*,jsonb_build_object('display_name',cu.display_name,'primary_phone_norm',cu.primary_phone_norm) as customers
    from orders o left join customers cu on cu.company_id=o.company_id and cu.id=o.customer_id
    where o.company_id=c and (state='' or o.order_status::text=state)
      and (term='' or o.folio ilike '%'||term||'%' or o.legacy_folio_raw ilike '%'||term||'%'
        or cu.display_name ilike '%'||term||'%'
        or (regexp_replace(term,'\D','','g')<>'' and cu.primary_phone_norm like '%'||regexp_replace(term,'\D','','g')||'%'))
  ), paged as (select * from matched order by ordered_at desc,id limit 20 offset (greatest(1,least(page_number,100000))-1)*20)
  select jsonb_build_object('total',(select count(*) from matched),'orders',coalesce((select jsonb_agg(to_jsonb(paged)) from paged),'[]'::jsonb));
$$;
revoke all on function public.cej_search_orders(uuid,text,text,integer) from public,anon;
grant execute on function public.cej_search_orders(uuid,text,text,integer) to authenticated;

create view public.followup_queue with (security_invoker=true) as
select f.*,cu.display_name as customer_name,p.name as project_name,
  case when (f.due_at at time zone 'America/Ciudad_Juarez')::date < (now() at time zone 'America/Ciudad_Juarez')::date then 'overdue'
    when (f.due_at at time zone 'America/Ciudad_Juarez')::date = (now() at time zone 'America/Ciudad_Juarez')::date then 'today'
    else 'upcoming' end as due_bucket
from followups f join customers cu on cu.company_id=f.company_id and cu.id=f.customer_id
left join projects p on p.company_id=f.company_id and p.id=f.project_id
where f.completed_at is null;
revoke all on public.followup_queue from public,anon;
grant select on public.followup_queue to authenticated;
