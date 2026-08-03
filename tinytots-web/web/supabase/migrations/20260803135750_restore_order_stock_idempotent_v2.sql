-- Idempotent stock restore for cancelled web orders / approved returns.
-- Keeps order_items history (does NOT delete rows); mirrors restore_stock_order_item math.

alter table public.orders
  add column if not exists stock_restored boolean not null default false;

alter table public.complaints
  add column if not exists stock_restored boolean not null default false;

comment on column public.orders.stock_restored is
  'True after cancel/refund restock ran once — prevents double-restock.';
comment on column public.complaints.stock_restored is
  'True after return restock ran once for this complaint — prevents double-restock.';

-- Restore every line on an order. Returns true if stock was restored this call,
-- false if already restored (idempotent no-op).
create or replace function public.restore_order_stock(p_order_id bigint)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  already boolean;
  item record;
  current_stock integer;
  current_reorder integer;
begin
  select stock_restored into already
  from public.orders
  where id = p_order_id
  for update;

  if not found then
    raise exception 'Order % not found', p_order_id;
  end if;

  if already then
    return false;
  end if;

  for item in
    select id, variant_id, quantity
    from public.order_items
    where order_id = p_order_id
  loop
    select stock, reorder_level
      into current_stock, current_reorder
    from public.variants
    where id = item.variant_id
    for update;

    if found then
      update public.variants
      set
        stock = current_stock + item.quantity,
        is_low_stock = (current_stock + item.quantity) <= coalesce(current_reorder, 0)
      where id = item.variant_id;
    end if;
  end loop;

  update public.orders
  set stock_restored = true, updated_at = now()
  where id = p_order_id;

  return true;
end;
$$;

revoke all on function public.restore_order_stock(bigint) from public;
grant execute on function public.restore_order_stock(bigint) to service_role;

-- Restore specific order_item ids (returns). Idempotent via complaints.stock_restored.
create or replace function public.restore_complaint_stock(p_complaint_id bigint)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  c record;
  item record;
  current_stock integer;
  current_reorder integer;
  ids bigint[];
begin
  select id, stock_restored, order_item_ids, order_id
    into c
  from public.complaints
  where id = p_complaint_id
  for update;

  if not found then
    raise exception 'Complaint % not found', p_complaint_id;
  end if;

  if c.stock_restored then
    return false;
  end if;

  ids := coalesce(c.order_item_ids, '{}'::bigint[]);

  if cardinality(ids) = 0 and c.order_id is not null then
    -- No line selection: restore full order once (also marks order.stock_restored).
    perform public.restore_order_stock(c.order_id);
  else
    for item in
      select id, variant_id, quantity
      from public.order_items
      where id = any (ids)
    loop
      select stock, reorder_level
        into current_stock, current_reorder
      from public.variants
      where id = item.variant_id
      for update;

      if found then
        update public.variants
        set
          stock = current_stock + item.quantity,
          is_low_stock = (current_stock + item.quantity) <= coalesce(current_reorder, 0)
        where id = item.variant_id;
      end if;
    end loop;
  end if;

  update public.complaints
  set stock_restored = true
  where id = p_complaint_id;

  return true;
end;
$$;

revoke all on function public.restore_complaint_stock(bigint) from public;
grant execute on function public.restore_complaint_stock(bigint) to service_role;
