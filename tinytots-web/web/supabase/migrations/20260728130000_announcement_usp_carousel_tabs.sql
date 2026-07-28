-- Announcement bar: thin promo strip above the header.
ALTER TABLE public.homepage_content
  ADD COLUMN IF NOT EXISTS announcement_enabled boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS announcement_text text,
  ADD COLUMN IF NOT EXISTS announcement_link text;

-- "Why Choose TinyTots" USP icons — a small admin-editable list of
-- {icon, title, description}, stored as jsonb so the count can vary
-- without more schema changes.
ALTER TABLE public.homepage_content
  ADD COLUMN IF NOT EXISTS usp_items jsonb NOT NULL DEFAULT '[]'::jsonb;

-- Trending Now becomes a tabbed New Arrivals / Bestsellers / Trending
-- carousel. Trending's selection columns already exist; this adds the
-- matching pair for the two new tabs. Each defaults to category=null,
-- selection_type='products' with an empty list, meaning "fall back to
-- newest products" until the admin curates a tab.
ALTER TABLE public.homepage_content
  ADD COLUMN IF NOT EXISTS newarrivals_selection_type text NOT NULL DEFAULT 'products',
  ADD COLUMN IF NOT EXISTS newarrivals_category text,
  ADD COLUMN IF NOT EXISTS newarrivals_product_ids bigint[] DEFAULT '{}',

  ADD COLUMN IF NOT EXISTS bestsellers_selection_type text NOT NULL DEFAULT 'products',
  ADD COLUMN IF NOT EXISTS bestsellers_category text,
  ADD COLUMN IF NOT EXISTS bestsellers_product_ids bigint[] DEFAULT '{}';

ALTER TABLE public.homepage_content DROP CONSTRAINT IF EXISTS homepage_content_carousel_selection_types_check;
ALTER TABLE public.homepage_content ADD CONSTRAINT homepage_content_carousel_selection_types_check
  CHECK (
    (newarrivals_selection_type = ANY (ARRAY['products', 'category']))
    AND (bestsellers_selection_type = ANY (ARRAY['products', 'category']))
  );
