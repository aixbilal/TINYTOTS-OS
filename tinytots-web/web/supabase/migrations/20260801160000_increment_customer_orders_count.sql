-- customers.orders_count is trusted by checkout referral logic ("first order only")
-- but was never incremented. Keep the counter in sync with orders lifecycle:
-- +1 on insert when customer_id is set, -1 on delete (covers checkout rollback
-- when order_items insert fails and the empty order is removed).

create or replace function public.increment_customer_orders_count()
returns trigger
language plpgsql
as $$
begin
  if new.customer_id is not null then
    update public.customers
    set orders_count = orders_count + 1
    where id = new.customer_id;
  end if;
  return new;
end;
$$;

create or replace function public.decrement_customer_orders_count()
returns trigger
language plpgsql
as $$
begin
  if old.customer_id is not null then
    update public.customers
    set orders_count = greatest(orders_count - 1, 0)
    where id = old.customer_id;
  end if;
  return old;
end;
$$;

drop trigger if exists trg_increment_customer_orders_count on public.orders;
create trigger trg_increment_customer_orders_count
after insert on public.orders
for each row
execute function public.increment_customer_orders_count();

drop trigger if exists trg_decrement_customer_orders_count on public.orders;
create trigger trg_decrement_customer_orders_count
after delete on public.orders
for each row
execute function public.decrement_customer_orders_count();
