-- Keep the previous and new delivery window in the order history so a reschedule can say
-- "from <window> to <window>". The conflict rule and cej_command stay untouched: two triggers
-- capture the data inside the same transaction as the command.
alter table public.order_status_history
  add column from_window_start timestamptz,
  add column from_window_end timestamptz,
  add column to_window_start timestamptz,
  add column to_window_end timestamptz;

-- Remember, for this transaction only, the window an order had before it changed.
create function public.cej_remember_previous_window() returns trigger
language plpgsql as $$
begin
  if new.scheduled_window_start is distinct from old.scheduled_window_start
     or new.scheduled_window_end is distinct from old.scheduled_window_end then
    perform set_config('cej.previous_window', jsonb_build_object(
      'order_id', old.id,
      'start', old.scheduled_window_start,
      'end', old.scheduled_window_end)::text, true);
  end if;
  return new;
end $$;

create trigger orders_remember_previous_window
  before update on public.orders
  for each row execute function public.cej_remember_previous_window();

-- Stamp each history row with the window before and after the command.
create function public.cej_stamp_history_window() returns trigger
language plpgsql as $$
declare
  o record;
  prev jsonb := nullif(current_setting('cej.previous_window', true), '')::jsonb;
begin
  select scheduled_window_start, scheduled_window_end into o from public.orders where id = new.order_id;
  new.to_window_start := o.scheduled_window_start;
  new.to_window_end := o.scheduled_window_end;
  if prev is not null and prev->>'order_id' = new.order_id::text then
    new.from_window_start := nullif(prev->>'start', '')::timestamptz;
    new.from_window_end := nullif(prev->>'end', '')::timestamptz;
  else
    new.from_window_start := o.scheduled_window_start;
    new.from_window_end := o.scheduled_window_end;
  end if;
  return new;
end $$;

create trigger order_status_history_stamp_window
  before insert on public.order_status_history
  for each row execute function public.cej_stamp_history_window();
