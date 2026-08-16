-- Shop/Products page hero content, admin-editable, mirrors the pattern
-- already used for homepage_content (single-row config table).
CREATE TABLE IF NOT EXISTS public.shop_page_content (
  id bigint PRIMARY KEY DEFAULT 1,
  hero_eyebrow text NOT NULL DEFAULT 'Shop All',
  hero_headline text NOT NULL DEFAULT 'Timeless styles for little hearts.',
  hero_subtext text NOT NULL DEFAULT 'Discover thoughtfully made pieces for every moment, every season, every little adventure.',
  hero_image_url text NOT NULL DEFAULT '',
  hero_image_url_mobile text NOT NULL DEFAULT '',
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT shop_page_content_singleton CHECK (id = 1)
);

INSERT INTO public.shop_page_content (id) VALUES (1)
ON CONFLICT (id) DO NOTHING;

ALTER TABLE public.shop_page_content ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public can view shop page content" ON public.shop_page_content
FOR SELECT USING (true);

GRANT SELECT ON TABLE public.shop_page_content TO anon, authenticated;

-- Reviews table - SCHEMA ONLY per Dev Bilal's explicit instruction. No
-- product-card UI reads from this yet; this is groundwork for a future
-- review feature, not a live feature today. is_approved defaults false so
-- nothing shows publicly even once submissions exist, until moderated.
CREATE TABLE IF NOT EXISTS public.reviews (
  id bigserial PRIMARY KEY,
  product_id bigint NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  customer_id bigint REFERENCES public.customers(id) ON DELETE SET NULL,
  rating smallint NOT NULL CHECK (rating BETWEEN 1 AND 5),
  title text,
  body text,
  reviewer_name text,
  is_approved boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS reviews_product_id_idx ON public.reviews (product_id);

ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;

-- Public can only ever see approved reviews - mirrors the "Public can view
-- active discounts" pattern from 20260714140000_rls_policies.sql.
CREATE POLICY "Public can view approved reviews" ON public.reviews
FOR SELECT USING (is_approved = true);

GRANT SELECT ON TABLE public.reviews TO anon, authenticated;
-- No INSERT/UPDATE/DELETE grants yet - submission flow doesn't exist yet,
-- intentionally not wiring write access until that feature is actually built.
