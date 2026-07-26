create table if not exists public.addresses (
  id bigserial primary key,
  customer_id bigint not null references public.customers(id) on delete cascade,
  label text not null default 'Home',
  address text not null,
  city text not null,
  is_default boolean not null default false,
  created_at timestamptz default now()
);

alter table public.addresses enable row level security;

create policy "Customers can view own addresses" on public.addresses
for select using (
  customer_id in (select id from public.customers where auth_user_id = auth.uid())
);

create policy "Customers can insert own addresses" on public.addresses
for insert with check (
  customer_id in (select id from public.customers where auth_user_id = auth.uid())
);

create policy "Customers can update own addresses" on public.addresses
for update using (
  customer_id in (select id from public.customers where auth_user_id = auth.uid())
);

create policy "Customers can delete own addresses" on public.addresses
for delete using (
  customer_id in (select id from public.customers where auth_user_id = auth.uid())
);
