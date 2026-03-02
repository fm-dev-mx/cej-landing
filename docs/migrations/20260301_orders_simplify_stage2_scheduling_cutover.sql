-- Precondition checks to run before applying constraint hardening:
-- select count(*) as scheduled_missing_slot_or_date
-- from public.orders
-- where order_status = 'scheduled'
--   and (scheduled_date is null or scheduled_slot_code is null);
--
-- select count(*) as rows_with_legacy_schedule_fields
-- from public.orders
-- where scheduled_time_label is not null
--    or scheduled_window_start is not null
--    or scheduled_window_end is not null;

begin;

alter table public.orders
  drop constraint if exists valid_scheduling_window,
  drop constraint if exists valid_scheduling_slots;

alter table public.orders
  add constraint valid_scheduling_slots
  check (
    (scheduled_slot_code is null or scheduled_date is not null) and
    (order_status != 'scheduled' or (scheduled_date is not null and scheduled_slot_code is not null))
  );

commit;
