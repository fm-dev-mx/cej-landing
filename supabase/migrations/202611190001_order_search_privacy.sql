-- Keep folio intent separate from customer identity, under the caller's RLS.
create or replace function public.cej_search_orders(c uuid,term text default '',state text default '',page_number integer default 1)
returns jsonb language sql stable security invoker set search_path=public,pg_temp as $$
  with search as (
    select btrim(coalesce(term,'')) as needle,
      regexp_replace(coalesce(term,''),'\D','','g') as digits
  ), intent as (
    select *, needle ~* '^P-[A-Z0-9]+$' or (
      needle ~ '^[0-9]+$' and exists (
        select 1 from orders o where o.company_id=c
          and (strpos(lower(o.folio),lower(needle))>0
            or strpos(lower(o.legacy_folio_raw),lower(needle))>0)
      )
    ) as folio_only from search
  ), matched as (
    select o.*,jsonb_build_object('display_name',cu.display_name,'primary_phone_norm',cu.primary_phone_norm) as customers
    from orders o left join customers cu on cu.company_id=o.company_id and cu.id=o.customer_id
    cross join intent s
    where o.company_id=c and (state='' or o.order_status::text=state)
      and (s.needle='' or case when s.folio_only then
        strpos(lower(o.folio),lower(s.needle))>0 or strpos(lower(o.legacy_folio_raw),lower(s.needle))>0
      else
        strpos(lower(cu.display_name),lower(s.needle))>0
        or (length(s.digits)>=7 and strpos(cu.primary_phone_norm,s.digits)>0)
      end)
  ), paged as (select * from matched order by ordered_at desc,id limit 20 offset (greatest(1,least(page_number,100000))-1)*20)
  select jsonb_build_object('total',(select count(*) from matched),'orders',coalesce((select jsonb_agg(to_jsonb(paged)) from paged),'[]'::jsonb));
$$;
revoke all on function public.cej_search_orders(uuid,text,text,integer) from public,anon;
grant execute on function public.cej_search_orders(uuid,text,text,integer) to authenticated;
