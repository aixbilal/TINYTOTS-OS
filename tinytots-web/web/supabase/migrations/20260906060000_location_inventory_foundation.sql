-- Multi-location data foundation (additive groundwork only).
--
-- Adds `locations` (physical TinyTots stores) and `variant_location_stock`
-- (per-store stock counts per variant) so a future store locator, PDP
-- "available at store" experience, and branch-aware Electron POS can be
-- built without another schema rewrite.
--
-- Does NOT touch existing stock authority: public.variants.stock remains the
-- sole source of truth for website ordering/checkout, and the existing
-- trg_deduct_stock_order_item / trg_restore_stock_order_item / deduct_stock
-- triggers are untouched. This migration creates structure only — no data
-- migration, no backfill, no trigger changes, no RLS changes on existing
-- tables. NOT applied to any live database as part of this change.

-- ============ LOCATIONS ============
create table if not exists public.locations (
  id bigserial primary key,
  name text not null,
  slug text not null unique,
  address text,
  city text,
  region text,
  country text not null default 'Pakistan',
  latitude numeric(9,6),
  longitude numeric(9,6),
  directions_url text,
  is_public boolean not null default false,
  is_active boolean not null default true,
  display_order int not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

comment on table public.locations is
  'Physical TinyTots store locations. is_public/is_active gate customer-facing visibility (store locator, PDP availability). Rows are added manually by an admin with verified address/contact data — never auto-generated.';
comment on column public.locations.directions_url is
  'Verified Google Maps / directions link for this location. Never derive or guess this from an address string.';
comment on column public.locations.latitude is
  'Verified coordinate only. Leave null rather than estimate.';
comment on column public.locations.longitude is
  'Verified coordinate only. Leave null rather than estimate.';

alter table public.locations enable row level security;

-- Default-deny, then re-open read-only access explicitly (mirrors the
-- anon/authenticated lockdown pattern used across this schema: Supabase
-- grants new tables full access to anon/authenticated by default, so every
-- new table must explicitly revoke that before re-granting the minimum).
revoke all on table public.locations from anon, authenticated;
grant select on table public.locations to anon, authenticated;

create policy "Public can view active public locations"
on public.locations
for select
using (is_public = true and is_active = true);

-- No insert/update/delete policy for anon/authenticated — location rows are
-- service_role (admin) writes only.

-- ============ VARIANT LOCATION STOCK ============
create table if not exists public.variant_location_stock (
  id bigserial primary key,
  variant_id bigint not null references public.variants(id) on delete cascade,
  location_id bigint not null references public.locations(id) on delete cascade,
  stock integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (variant_id, location_id)
);

alter table public.variant_location_stock
  add constraint variant_location_stock_non_negative check (stock >= 0);

create index if not exists variant_location_stock_location_id_idx
  on public.variant_location_stock (location_id);

comment on table public.variant_location_stock is
  'Per-store stock for a variant. Additive/groundwork only: NOT read by checkout or any deduction trigger today. public.variants.stock remains the sole authority for website ordering. No automatic backfill/redistribution from aggregate stock — rows are populated deliberately (future POS/admin), starting empty.';

alter table public.variant_location_stock enable row level security;

-- Fully closed to anon/authenticated: no policies defined (RLS default-deny)
-- and grants explicitly revoked. Public-facing "available at store" reads
-- must go through a server-side service using the service_role key, never
-- direct client queries — this table exposes raw quantities per store and
-- customers should only ever see a derived in-stock/out-of-stock signal.
revoke all on table public.variant_location_stock from anon, authenticated;
