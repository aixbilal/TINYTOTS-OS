-- Calendar / time-of-day scheduling for campaigns in the live rotation queue.
-- is_active still means "in the queue"; schedule_* filters which queue
-- members are eligible right now.

begin;

alter table public.campaigns
  add column if not exists schedule_enabled boolean not null default false,
  add column if not exists schedule_start_at timestamptz,
  add column if not exists schedule_end_at timestamptz,
  add column if not exists schedule_days smallint[] not null default '{}'::smallint[],
  add column if not exists schedule_daily_start time,
  add column if not exists schedule_daily_end time,
  add column if not exists schedule_timezone text not null default 'Asia/Karachi';

alter table public.campaigns
  drop constraint if exists campaigns_schedule_days_valid;

alter table public.campaigns
  add constraint campaigns_schedule_days_valid
  check (
    schedule_days <@ array[0,1,2,3,4,5,6]::smallint[]
  );

alter table public.campaigns
  drop constraint if exists campaigns_schedule_window_valid;

alter table public.campaigns
  add constraint campaigns_schedule_window_valid
  check (
    schedule_start_at is null
    or schedule_end_at is null
    or schedule_start_at <= schedule_end_at
  );

comment on column public.campaigns.schedule_enabled is
  'When true, campaign only plays while within start/end, days, and daily hours.';
comment on column public.campaigns.schedule_days is
  '0=Sunday .. 6=Saturday. Empty array means every day.';

alter table public.signage_revision
  add column if not exists store_timezone text not null default 'Asia/Karachi';

update public.signage_revision
set store_timezone = coalesce(nullif(store_timezone, ''), 'Asia/Karachi')
where id = 1;

commit;
