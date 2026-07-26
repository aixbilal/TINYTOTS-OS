create table if not exists public.shipping_cities (
  id bigserial primary key,
  name text not null unique,
  created_at timestamptz default now()
);

alter table public.shipping_cities enable row level security;

-- No public policy — only admin needs to read/write this; the storefront
-- checkout route uses supabaseAdmin (service role) to check it server-side.

-- Seed from the cities that were previously hardcoded in checkout/route.ts,
-- so behavior doesn't change the moment this migration runs.
insert into public.shipping_cities (name) values
  ('lahore'), ('islamabad'), ('rawalpindi'), ('faisalabad'), ('multan'),
  ('gujranwala'), ('sialkot'), ('sargodha'), ('bahawalpur'), ('sheikhupura')
on conflict (name) do nothing;

-- 'list' = only cities in shipping_cities allow COD, 'all_pakistan' = COD
-- allowed everywhere, the list is ignored.
insert into public.app_settings (key, value, description) values
  ('cod_city_mode', 'list', 'Either "list" (restrict COD to shipping_cities table) or "all_pakistan" (allow COD everywhere)')
on conflict (key) do nothing;
