-- Make the existing cancel restock trigger idempotent by delegating to
-- restore_order_stock() (uses orders.stock_restored + FOR UPDATE).

create or replace function public.restore_stock_on_cancel()
returns trigger
language plpgsql
as $$
begin
  if new.status = 'cancelled' and old.status is distinct from 'cancelled' then
    perform public.restore_order_stock(new.id);
  end if;
  return new;
end;
$$;
