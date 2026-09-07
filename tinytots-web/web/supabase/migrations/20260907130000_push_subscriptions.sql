-- Web Push subscriptions for admin/owner devices.
--
-- Backs the V1.1 "new web order" push notification. A logged-in admin opts
-- in from Admin > My account; the browser's PushSubscription (endpoint +
-- p256dh + auth keys) is stored here, keyed to their Supabase auth user.
-- When an order is committed, the checkout route fires a best-effort push to
-- every is_active row (see lib/push.ts). Delivery is fully decoupled from
-- the order: a failed/expired push NEVER affects checkout.
--
-- Design:
--   * endpoint is UNIQUE — re-subscribing the same browser upserts the row
--     (keys refreshed, is_active reset true) instead of creating duplicates.
--   * A 404/410 from the push service means the subscription is dead; the
--     sender sets is_active = false (soft-deactivate) so it stops being
--     tried without losing the audit trail.
--   * auth_user_id -> auth.users(id) ON DELETE CASCADE, mirroring
--     public.admin_users.auth_user_id. Removing an admin's auth user
--     removes their subscriptions automatically.
--
-- Security:
--   * The p256dh / auth values are per-subscription public transport keys
--     (not account secrets), but this is still admin-only operational data.
--   * RLS default-deny, no policies, grants revoked from anon/authenticated:
--     all access is through server routes using the service-role key
--     (/api/push/*, checkout). The VAPID PRIVATE key lives only in server
--     env (VAPID_PRIVATE_KEY) and is never stored here or shipped to a
--     client bundle.
--
-- Rollback: drop trigger, then `drop table public.push_subscriptions`.

create table if not exists public.push_subscriptions (
  id              bigint generated always as identity primary key,
  auth_user_id    uuid not null references auth.users(id) on delete cascade,
  endpoint        text not null,
  p256dh          text not null,
  auth            text not null,
  user_agent      text,
  is_active       boolean not null default true,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now(),
  last_success_at timestamptz,
  last_failure_at timestamptz,
  constraint push_subscriptions_endpoint_key unique (endpoint)
);

comment on table public.push_subscriptions is
  'Web Push subscriptions for admin/owner devices (V1.1 new-order push). One row per browser endpoint (unique). service_role only — written via /api/push/* and read by the checkout push dispatch. Dead endpoints (404/410) are soft-deactivated (is_active=false), not deleted. VAPID private key is server env only, never stored here.';
comment on column public.push_subscriptions.auth_user_id is
  'Supabase auth user of the admin who subscribed. FK auth.users(id) ON DELETE CASCADE.';
comment on column public.push_subscriptions.is_active is
  'false once the push service reports the endpoint gone (404/410), or when the admin unsubscribes.';

create index if not exists push_subscriptions_active_idx
  on public.push_subscriptions (is_active)
  where is_active;
create index if not exists push_subscriptions_auth_user_id_idx
  on public.push_subscriptions (auth_user_id);

drop trigger if exists trg_push_subscriptions_updated_at on public.push_subscriptions;
create trigger trg_push_subscriptions_updated_at
  before update on public.push_subscriptions
  for each row execute function public.set_updated_at();

alter table public.push_subscriptions enable row level security;
revoke all on table public.push_subscriptions from anon, authenticated;
