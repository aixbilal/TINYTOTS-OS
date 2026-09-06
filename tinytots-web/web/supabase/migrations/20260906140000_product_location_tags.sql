-- Product ↔ store-location assignment tags (catalog/operational metadata).
--
-- Lets an operator tag a product as "carried at / assigned to" one or more
-- verified physical TinyTots store locations (public.locations), or leave it
-- with no assignment at all. This is CATALOG metadata, not stock: it does
-- not deduct, reserve, transfer, or represent any quantity. A product with
-- zero rows here simply has no store assignment.
--
-- Depends on public.locations (20260906060000_location_inventory_foundation).
-- Additive/groundwork only: NOT applied to any live database as part of this
-- change. No existing table, trigger, RLS policy, grant, or application code
-- path is modified. public.variants.stock remains the sole authoritative
-- aggregate stock; public.variant_location_stock does NOT become
-- authoritative. No backfill — the table starts empty and rows are written
-- deliberately by an operator through the Electron product form / admin API
-- (service_role). Rollback is a plain DROP TABLE.

create table if not exists public.product_location_tags (
  id bigserial primary key,
  product_id bigint not null references public.products(id) on delete cascade,
  location_id bigint not null references public.locations(id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (product_id, location_id)
);

comment on table public.product_location_tags is
  'Which verified store location(s) a product is assigned to / carried at. Catalog metadata only — never a stock quantity, reservation, or deduction. Zero rows for a product = no store assignment. Written deliberately by an operator (service_role) via the Electron product form / admin API; not customer-writable. Not read by checkout, POS deduction, low-stock, or the offline queue. ON DELETE CASCADE from both parents keeps it free of orphan rows.';
comment on column public.product_location_tags.product_id is
  'FK public.products(id). Cascades on product delete.';
comment on column public.product_location_tags.location_id is
  'FK public.locations(id). Cascades on location delete. Must reference a real row in public.locations — never a hardcoded "Branch 1"/"Branch 2" identity.';

create index if not exists product_location_tags_location_id_idx
  on public.product_location_tags (location_id);

alter table public.product_location_tags enable row level security;

-- Fully closed to anon/authenticated: Supabase grants new tables full access
-- to anon/authenticated by default, so revoke that and define no policies
-- (RLS default-deny). All reads/writes go through a server-side service
-- using the service_role key (Electron admin API / web admin), never direct
-- client queries. This tag is operational/catalog metadata and is not a
-- customer-facing contract; if a public "carried at store" surface is ever
-- approved it must be exposed through a dedicated server endpoint that
-- returns only store name/slug, mirroring app/api/stores/availability.
revoke all on table public.product_location_tags from anon, authenticated;
