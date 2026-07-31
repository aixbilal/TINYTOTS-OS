-- Security fix: "Customers can update own record" correctly restricts WHICH
-- ROW a customer can touch (their own), but has no WITH CHECK / column
-- restriction, so a customer could call the Supabase client directly to
-- overwrite ANY column on their own row — including orders_count, which
-- checkout's referral logic trusts to decide "is this their first order."
-- A customer could reset orders_count to 0 after every order and farm
-- first-order referral rewards indefinitely.
--
-- Fix: revoke blanket UPDATE and re-grant it only on the columns a
-- customer should legitimately be able to change themselves.
REVOKE UPDATE ON public.customers FROM authenticated;
GRANT UPDATE (full_name, phone, email) ON public.customers TO authenticated;
