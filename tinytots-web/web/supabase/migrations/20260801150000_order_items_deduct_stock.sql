-- Web checkout stock deduction.
-- Repo migrations historically only had trg_deduct_stock on sale_items (POS).
-- Some live DBs also have a weak trg_deduct_stock_order / deduct_stock_order()
-- without FOR UPDATE — drop that so we don't double-decrement, then install the
-- locked version modeled on deduct_stock() with row locking + is_low_stock.
-- Live DB may be missing is_low_stock (schema drift from init dump) — add it first.

alter table public.variants
  add column if not exists is_low_stock boolean not null default false;

-- Remove legacy/live-only duplicate if present (not defined in older migration files).
drop trigger if exists trg_deduct_stock_order on public.order_items;
drop function if exists public.deduct_stock_order();

create or replace function public.deduct_stock_order_item()
returns trigger
language plpgsql
as $$
declare
  current_stock integer;
  current_reorder integer;
begin
  select stock, reorder_level
    into current_stock, current_reorder
  from public.variants
  where id = new.variant_id
  for update;

  if not found then
    raise exception 'Variant % not found for stock deduction', new.variant_id;
  end if;

  if current_stock < new.quantity then
    raise exception
      'Insufficient stock for variant %: have %, need %',
      new.variant_id, current_stock, new.quantity;
  end if;

  update public.variants
  set
    stock = current_stock - new.quantity,
    is_low_stock = (current_stock - new.quantity) <= current_reorder
  where id = new.variant_id;

  return new;
end;
$$;

-- Restore stock when order_items are removed (checkout rollback after a failed
-- coupon claim, or deleting items before the order ships).
create or replace function public.restore_stock_order_item()
returns trigger
language plpgsql
as $$
declare
  current_stock integer;
  current_reorder integer;
begin
  select stock, reorder_level
    into current_stock, current_reorder
  from public.variants
  where id = old.variant_id
  for update;

  if found then
    update public.variants
    set
      stock = current_stock + old.quantity,
      is_low_stock = (current_stock + old.quantity) <= current_reorder
    where id = old.variant_id;
  end if;

  return old;
end;
$$;

drop trigger if exists trg_deduct_stock_order_item on public.order_items;
create trigger trg_deduct_stock_order_item
after insert on public.order_items
for each row
execute function public.deduct_stock_order_item();

drop trigger if exists trg_restore_stock_order_item on public.order_items;
create trigger trg_restore_stock_order_item
after delete on public.order_items
for each row
execute function public.restore_stock_order_item();
