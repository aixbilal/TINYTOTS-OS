-- Per-recipient delivery tracking for the daily sales report + a hard
-- ceiling of 5 ACTIVE recipients.
--
-- Context: 20260907120000 added public.daily_report_recipients and the
-- Electron report backend fans a single generated report out to every
-- active recipient. That first cut recorded only a report-LEVEL outcome in
-- public.report_history ("sent" if >=1 delivery succeeded), so a recovery
-- run could re-send yesterday's report to recipients who already got it.
--
-- This migration makes delivery per-recipient and idempotent:
--
--   * public.daily_report_deliveries — one row per (report_date, recipient
--     destination). The recipient's name/email are SNAPSHOT at the moment a
--     report's delivery set is first created, so later add/disable/remove of
--     a recipient never rewrites a historical report's intended audience.
--   * Unique (report_date, recipient_email_snapshot) — the app stores the
--     snapshot email lower-cased, so this is effectively case-insensitive
--     and blocks a double row for the same destination on the same day.
--   * recipient_id -> daily_report_recipients ON DELETE SET NULL: removing a
--     recipient keeps the delivery-history rows (evidence) intact via the
--     snapshot columns.
--   * Recovery retries only rows with status in ('pending','failed');
--     'sent' rows are skipped, so A/C are never emailed twice while B is
--     retried.
--   * report_history stays the report-level record; the backend now marks
--     it 'sent' only when every delivery row for that date is 'sent'.
--
-- Max 5 active recipients: enforce_max_active_report_recipients() is a
-- BEFORE INSERT/UPDATE trigger on daily_report_recipients. It takes a
-- transaction-scoped advisory lock first, so two concurrent requests that
-- each see "4 active" cannot both commit a 5th/6th. Raising with errcode
-- 'check_violation' + a plain-language message lets the API layers surface
-- "Maximum 5 active daily report recipients are allowed." without leaking
-- SQL.
--
-- Access: both new objects are service_role only (RLS default-deny, grants
-- revoked from anon/authenticated) — same posture as report_history and
-- daily_report_recipients. All reads/writes go through the Electron report
-- backend or the authenticated website Admin API.
--
-- Rollback:
--   drop trigger trg_daily_report_recipients_max_active on public.daily_report_recipients;
--   drop function public.enforce_max_active_report_recipients();
--   drop table public.daily_report_deliveries;

-- ---------------------------------------------------------------------------
-- 1) Per-recipient delivery rows
-- ---------------------------------------------------------------------------
create table if not exists public.daily_report_deliveries (
  id                        bigint generated always as identity primary key,
  report_date               date not null,
  recipient_id              bigint references public.daily_report_recipients(id) on delete set null,
  recipient_email_snapshot  text not null,
  recipient_name_snapshot   text,
  status                    text not null default 'pending'
                              check (status in ('pending', 'sent', 'failed')),
  attempt_count             integer not null default 0,
  last_attempt_at           timestamptz,
  sent_at                   timestamptz,
  last_error                text,
  created_at                timestamptz not null default now(),
  updated_at                timestamptz not null default now(),
  constraint daily_report_deliveries_email_not_blank
    check (btrim(recipient_email_snapshot) <> ''),
  constraint daily_report_deliveries_dest_key
    unique (report_date, recipient_email_snapshot)
);

comment on table public.daily_report_deliveries is
  'One row per (report_date, recipient destination) for the daily sales report. recipient_*_snapshot freeze the audience when the delivery set is first created — later recipient add/disable/remove never rewrites a historical report. Recovery retries status in (pending,failed); sent rows are never re-emailed. service_role only.';
comment on column public.daily_report_deliveries.recipient_id is
  'FK public.daily_report_recipients(id), ON DELETE SET NULL. Null once the recipient row is deleted — the snapshot columns still identify who this delivery was for.';
comment on column public.daily_report_deliveries.recipient_email_snapshot is
  'Destination email as it was when the delivery set was created. Stored lower-cased by the application.';
comment on column public.daily_report_deliveries.status is
  'pending = not yet attempted / to retry; sent = delivered (never retried); failed = last attempt errored (retried on recovery).';

create index if not exists daily_report_deliveries_date_status_idx
  on public.daily_report_deliveries (report_date, status);
create index if not exists daily_report_deliveries_recipient_idx
  on public.daily_report_deliveries (recipient_id);

drop trigger if exists trg_daily_report_deliveries_updated_at on public.daily_report_deliveries;
create trigger trg_daily_report_deliveries_updated_at
  before update on public.daily_report_deliveries
  for each row execute function public.set_updated_at();

alter table public.daily_report_deliveries enable row level security;
revoke all on table public.daily_report_deliveries from anon, authenticated;

-- ---------------------------------------------------------------------------
-- 2) Hard limit: at most 5 ACTIVE recipients
-- ---------------------------------------------------------------------------
create or replace function public.enforce_max_active_report_recipients()
returns trigger
language plpgsql
set search_path = ''
as $$
declare
  active_count integer;
begin
  -- Only care when this row ends up ACTIVE: a fresh active insert, or a
  -- flip from inactive -> active. Editing an already-active row's name, or
  -- disabling one, is always fine.
  if (tg_op = 'INSERT' and new.is_active)
     or (tg_op = 'UPDATE' and new.is_active and old.is_active is distinct from true) then

    -- Serialize all recipient mutations for the duration of the tx so two
    -- concurrent "activate" requests can't both pass the count check.
    perform pg_advisory_xact_lock(hashtext('daily_report_recipients:active_limit'));

    select count(*) into active_count
    from public.daily_report_recipients
    where is_active = true
      and id is distinct from new.id;

    if active_count >= 5 then
      raise exception 'Maximum 5 active daily report recipients are allowed.'
        using errcode = 'check_violation';
    end if;
  end if;

  return new;
end;
$$;

drop trigger if exists trg_daily_report_recipients_max_active
  on public.daily_report_recipients;
create trigger trg_daily_report_recipients_max_active
  before insert or update on public.daily_report_recipients
  for each row execute function public.enforce_max_active_report_recipients();
