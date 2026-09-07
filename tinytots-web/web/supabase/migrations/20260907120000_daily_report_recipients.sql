-- Daily sales report — configurable recipient list.
--
-- Until now the Electron POS backend emailed the daily sales report to a
-- single hard-coded address (process.env.OWNER_EMAIL, sent from
-- backend/services/emailService.js). This table turns that into a small
-- config list so the owner plus additional accounts can each receive the
-- SAME single generated report.
--
-- Contract:
--   * ONE report is still generated once per report_date (unchanged —
--     reportService.generateDailyReport + report_history PK/status gating
--     are untouched). Only the delivery step fans out.
--   * emailService reads the active rows here and sends the report to each
--     recipient individually (never a shared To/CC list — one recipient
--     failing must not stop the others, and addresses are not exposed
--     between recipients).
--   * If this table has ZERO active rows the backend falls back to
--     process.env.OWNER_EMAIL, so an empty table === today's behaviour.
--     No seed row is written here (OWNER_EMAIL is deployment config, not
--     schema), which keeps the migration free of any personal address.
--   * Disable a recipient by setting is_active = false — history/audit of
--     who was on the list is preserved, unlike a DELETE.
--
-- Access: service_role only, matching public.report_history and the rest of
-- the POS reporting tables. All reads/writes go through the Electron admin
-- backend (SUPABASE_SERVICE_ROLE_KEY), never a browser client.
--
-- Rollback: drop trigger, then `drop table public.daily_report_recipients`.

create table if not exists public.daily_report_recipients (
  id          bigint generated always as identity primary key,
  name        text,
  email       text not null,
  is_active   boolean not null default true,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now(),
  constraint daily_report_recipients_email_not_blank check (btrim(email) <> '')
);

comment on table public.daily_report_recipients is
  'Recipients of the daily sales report email. ONE report is generated per day (see public.report_history) and delivered to every is_active row here, each as an individual send. Empty/no active rows => backend falls back to OWNER_EMAIL (legacy single-recipient behaviour). service_role only — written via the Electron admin backend, never a client.';
comment on column public.daily_report_recipients.email is
  'Delivery address. Stored lower-cased by the application. Uniqueness is enforced case-insensitively by daily_report_recipients_email_key below.';
comment on column public.daily_report_recipients.is_active is
  'false = keep the row for audit but skip delivery. Preferred over DELETE.';

-- Case-insensitive uniqueness so "Owner@x.com" and "owner@x.com" can't both
-- be on the list.
create unique index if not exists daily_report_recipients_email_key
  on public.daily_report_recipients (lower(email));

create index if not exists daily_report_recipients_active_idx
  on public.daily_report_recipients (is_active)
  where is_active;

-- Reuse the shared updated_at trigger function (public.set_updated_at).
drop trigger if exists trg_daily_report_recipients_updated_at
  on public.daily_report_recipients;
create trigger trg_daily_report_recipients_updated_at
  before update on public.daily_report_recipients
  for each row execute function public.set_updated_at();

-- Lock down: Supabase grants new tables to anon/authenticated by default.
-- This is internal POS reporting config, not a customer-facing contract, so
-- revoke those grants and define no RLS policies (default-deny). Only the
-- service_role (Electron admin backend) touches this table.
alter table public.daily_report_recipients enable row level security;
revoke all on table public.daily_report_recipients from anon, authenticated;
