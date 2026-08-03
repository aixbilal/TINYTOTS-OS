-- Defense in depth: never allow negative sellable stock or price at the DB layer.

-- Clamp any existing negatives so the CHECK can be applied safely.
update public.variants set stock = 0 where stock < 0;
update public.variants set price = 0 where price < 0;
update public.variants set base_price = 0 where base_price is not null and base_price < 0;
update public.variants set cost_price = 0 where cost_price is not null and cost_price < 0;

alter table public.variants drop constraint if exists variants_stock_non_negative;
alter table public.variants drop constraint if exists variants_price_non_negative;

alter table public.variants
  add constraint variants_stock_non_negative check (stock is null or stock >= 0);

alter table public.variants
  add constraint variants_price_non_negative check (price is null or price >= 0);
