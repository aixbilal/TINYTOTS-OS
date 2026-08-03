-- Harden POS sale_items stock deduction to match web order_items:
-- row lock (FOR UPDATE) + reject insufficient stock instead of going negative.

create or replace function public.deduct_stock()
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
    is_low_stock = (current_stock - new.quantity) <= coalesce(current_reorder, 0)
  where id = new.variant_id;

  return new;
end;
$$;
