-- Additive-only contract migration for future branch-aware inventory.
-- Adds a nullable location_id to orders (web) and sales (POS) so a future
-- website/Electron cutover has one shared, canonical place to attribute an
-- order/sale to a physical location, without requiring any existing or new
-- row to have one. NOT applied to any live database. No application code
-- reads or writes this column yet; existing checkout/POS behavior,
-- triggers, and RLS are unchanged.

alter table public.orders
  add column if not exists location_id bigint references public.locations(id);

alter table public.sales
  add column if not exists location_id bigint references public.locations(id);

comment on column public.orders.location_id is
  'Reserved for future branch attribution (e.g. in-store pickup/fulfillment). Null means fulfilled from central/aggregate stock, which is every order today. Not read or written by any current code path.';
comment on column public.sales.location_id is
  'Reserved for future in-store POS branch attribution. Null means no branch tracking, which is every sale today. Not read or written by any current code path.';
