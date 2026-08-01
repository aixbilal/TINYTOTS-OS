-- Residue from schema dump in 20260630181512_init_schema.sql.
-- MAINTAIN / REFERENCES / TRIGGER / TRUNCATE must not be held by anon or
-- authenticated (TRUNCATE alone lets an anon-key client wipe a table).
-- service_role grants are left unchanged.
--
-- Affected tables (only ones with this GRANT pattern in init_schema):
--   coupons, products, sale_items, sales, variants

REVOKE MAINTAIN, REFERENCES, TRIGGER, TRUNCATE ON public.coupons FROM anon, authenticated;
REVOKE MAINTAIN, REFERENCES, TRIGGER, TRUNCATE ON public.products FROM anon, authenticated;
REVOKE MAINTAIN, REFERENCES, TRIGGER, TRUNCATE ON public.sale_items FROM anon, authenticated;
REVOKE MAINTAIN, REFERENCES, TRIGGER, TRUNCATE ON public.sales FROM anon, authenticated;
REVOKE MAINTAIN, REFERENCES, TRIGGER, TRUNCATE ON public.variants FROM anon, authenticated;
