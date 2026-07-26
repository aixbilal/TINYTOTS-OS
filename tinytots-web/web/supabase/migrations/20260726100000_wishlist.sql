create table if not exists public.wishlist_items (
  id bigserial primary key,
  customer_id bigint not null references public.customers(id) on delete cascade,
  product_id bigint not null references public.products(id) on delete cascade,
  created_at timestamptz default now(),
  unique (customer_id, product_id)
);

alter table public.wishlist_items enable row level security;

create policy "Customers can view own wishlist" on public.wishlist_items
for select using (
  customer_id in (select id from public.customers where auth_user_id = auth.uid())
);

create policy "Customers can insert own wishlist items" on public.wishlist_items
for insert with check (
  customer_id in (select id from public.customers where auth_user_id = auth.uid())
);

create policy "Customers can delete own wishlist items" on public.wishlist_items
for delete using (
  customer_id in (select id from public.customers where auth_user_id = auth.uid())
);
