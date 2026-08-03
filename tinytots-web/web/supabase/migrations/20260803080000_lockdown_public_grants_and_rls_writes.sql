-- Phase 2 pre-deploy: remove dangerous public write access.
-- Storefront keeps SELECT on catalog/content tables via anon key.
-- Account self-service keeps authenticated own-row access (addresses/wishlist/orders read).
-- All sensitive writes go through service_role (API routes / admin).

-- 1) Drop unrestricted write policies on catalog tables
DROP POLICY IF EXISTS "insert_products" ON public.products;
DROP POLICY IF EXISTS "products_insert" ON public.products;
DROP POLICY IF EXISTS "products_update" ON public.products;
DROP POLICY IF EXISTS "insert_variants" ON public.variants;
DROP POLICY IF EXISTS "variants_insert" ON public.variants;
DROP POLICY IF EXISTS "variants_update" ON public.variants;

-- 2) Strip all table privileges from anon + authenticated, then re-grant minimum
DO $$
DECLARE
  r record;
BEGIN
  FOR r IN
    SELECT tablename FROM pg_tables WHERE schemaname = 'public'
  LOOP
    EXECUTE format('REVOKE ALL ON TABLE public.%I FROM anon, authenticated', r.tablename);
  END LOOP;
END $$;

DO $$
DECLARE
  r record;
BEGIN
  FOR r IN
    SELECT c.relname AS seqname
    FROM pg_class c
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE n.nspname = 'public' AND c.relkind = 'S'
  LOOP
    EXECUTE format('REVOKE ALL ON SEQUENCE public.%I FROM anon, authenticated', r.seqname);
  END LOOP;
END $$;

-- 3) Public catalog / CMS content: SELECT only
GRANT SELECT ON TABLE
  public.products,
  public.variants,
  public.product_images,
  public.product_image_variants,
  public.homepage_content,
  public.help_articles,
  public.categories,
  public.about_page_content,
  public.site_pages,
  public.shipping_returns_content,
  public.blog_posts,
  public.campaigns,
  public.badge_items,
  public.feature_items,
  public.trust_items,
  public.stat_items,
  public.testimonials,
  public.ugc_posts,
  public.discounts,
  public.signage_revision
TO anon, authenticated;

-- 4) Authenticated self-service (RLS policies already scope to auth.uid() / own rows)
GRANT SELECT, UPDATE ON TABLE public.customers TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.addresses TO authenticated;
GRANT SELECT, INSERT, DELETE ON TABLE public.wishlist_items TO authenticated;
GRANT SELECT ON TABLE public.orders TO authenticated;
GRANT SELECT ON TABLE public.order_items TO authenticated;
GRANT SELECT ON TABLE public.vouchers TO authenticated;
GRANT SELECT ON TABLE public.complaints TO authenticated;
GRANT SELECT ON TABLE public.admin_users TO authenticated;

GRANT USAGE, SELECT ON SEQUENCE public.addresses_id_seq TO authenticated;
GRANT USAGE, SELECT ON SEQUENCE public.wishlist_items_id_seq TO authenticated;

-- 5) Revoke public EXECUTE on SECURITY DEFINER RPCs (service_role keeps access)
REVOKE EXECUTE ON FUNCTION public.activate_campaign(bigint) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.set_campaign_active(bigint, boolean) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.bump_signage_revision() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.increment_coupon_uses(bigint) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.increment_coupon_uses(text) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.link_guest_referral_on_signup() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.remove_deleted_campaign_content_reference() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.rls_auto_enable() FROM PUBLIC, anon, authenticated;

GRANT EXECUTE ON FUNCTION public.activate_campaign(bigint) TO service_role;
GRANT EXECUTE ON FUNCTION public.set_campaign_active(bigint, boolean) TO service_role;
GRANT EXECUTE ON FUNCTION public.bump_signage_revision() TO service_role;
GRANT EXECUTE ON FUNCTION public.handle_new_user() TO service_role;
GRANT EXECUTE ON FUNCTION public.increment_coupon_uses(bigint) TO service_role;
GRANT EXECUTE ON FUNCTION public.increment_coupon_uses(text) TO service_role;
GRANT EXECUTE ON FUNCTION public.link_guest_referral_on_signup() TO service_role;
GRANT EXECUTE ON FUNCTION public.remove_deleted_campaign_content_reference() TO service_role;
GRANT EXECUTE ON FUNCTION public.rls_auto_enable() TO service_role;
