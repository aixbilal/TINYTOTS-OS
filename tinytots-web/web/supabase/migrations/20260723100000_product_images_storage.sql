-- tinytots-web/web/supabase/migrations/20260723_product_images_storage.sql
-- Creates the storage bucket for product images. Public read (so storefront
-- and POS can display images directly), writes only via service_role
-- (your admin API routes), matching the pattern used everywhere else.

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'product-images',
  'product-images',
  true,                                  -- public read
  5242880,                               -- 5MB max per image
  ARRAY['image/jpeg', 'image/png', 'image/webp']
)
ON CONFLICT (id) DO NOTHING;

-- Public (anon) can only READ objects in this bucket
CREATE POLICY "Public can view product images objects"
ON storage.objects FOR SELECT
USING (bucket_id = 'product-images');

-- No INSERT/UPDATE/DELETE policy for anon/authenticated — only service_role
-- (which bypasses RLS) can write, matching your existing admin-write pattern.
-- This is intentional: uploads must always go through supabaseAdmin in an
-- API route, never directly from the browser with the anon key.