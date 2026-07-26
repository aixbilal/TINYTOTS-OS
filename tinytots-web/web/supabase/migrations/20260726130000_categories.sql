create table if not exists public.categories (
  id bigserial primary key,
  name text not null unique,
  slug text not null unique,
  display_order int not null default 0,
  created_at timestamptz default now()
);

alter table public.categories enable row level security;

create policy "Public can view categories" on public.categories
for select using (true);

-- No insert/update/delete policy — only service-role (supabaseAdmin) writes.

-- Seed from whatever distinct category strings already exist on products,
-- so nothing already assigned to a product goes "missing" from the dropdown.
insert into public.categories (name, slug, display_order)
select distinct
  category,
  lower(regexp_replace(trim(category), '[^a-zA-Z0-9]+', '-', 'g')),
  0
from public.products
where category is not null and trim(category) <> ''
on conflict (name) do nothing;
