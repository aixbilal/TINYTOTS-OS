-- Second overload of increment_coupon_uses(p_code text) was missed in the prior lockdown.
REVOKE EXECUTE ON FUNCTION public.increment_coupon_uses(text) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.increment_coupon_uses(text) TO service_role;
REVOKE EXECUTE ON FUNCTION public.increment_coupon_uses(bigint) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.increment_coupon_uses(bigint) TO service_role;
