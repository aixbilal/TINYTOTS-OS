-- Additive-only contract migration for POS customer association.
--
-- Adds a nullable customer_id to public.sales (the in-store POS sales
-- table) referencing the canonical public.customers identity that the
-- storefront already populates. This lets the Electron POS optionally
-- attribute a sale to a known customer while keeping every existing and
-- future guest sale valid (customer_id IS NULL = guest, which is every
-- POS sale today).
--
-- NOT applied to any live database in this batch. No application code
-- writes this column yet; the POS checkout contract, the deduct_stock
-- trigger, receipt numbering, idempotency (client_sale_id), RLS and the
-- offline queue are all unchanged. A rollback is a plain DROP COLUMN.

alter table public.sales
  add column if not exists customer_id bigint references public.customers(id);

create index if not exists idx_sales_customer_id
  on public.sales (customer_id)
  where customer_id is not null;

comment on column public.sales.customer_id is
  'Optional link to public.customers for in-store POS sales. Null means a guest sale, which is every POS sale today. Web orders use orders.customer_id; this is the POS-side equivalent.';
