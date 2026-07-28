-- Let admins drive Trending Now, The Meadow Edit, Boys, and Girls sections
-- by either a category or a hand-picked product list, instead of only a
-- manually-typed link. trending_product_ids already exists (added earlier);
-- this adds the matching selection_type/category columns for it, plus the
-- same trio for meadow/boys/girls.
ALTER TABLE public.homepage_content
  ADD COLUMN IF NOT EXISTS trending_selection_type text NOT NULL DEFAULT 'products',
  ADD COLUMN IF NOT EXISTS trending_category text,

  ADD COLUMN IF NOT EXISTS meadow_selection_type text NOT NULL DEFAULT 'category',
  ADD COLUMN IF NOT EXISTS meadow_category text,
  ADD COLUMN IF NOT EXISTS meadow_product_ids bigint[] DEFAULT '{}',

  ADD COLUMN IF NOT EXISTS boys_selection_type text NOT NULL DEFAULT 'category',
  ADD COLUMN IF NOT EXISTS boys_category text,
  ADD COLUMN IF NOT EXISTS boys_product_ids bigint[] DEFAULT '{}',

  ADD COLUMN IF NOT EXISTS girls_selection_type text NOT NULL DEFAULT 'category',
  ADD COLUMN IF NOT EXISTS girls_category text,
  ADD COLUMN IF NOT EXISTS girls_product_ids bigint[] DEFAULT '{}';

ALTER TABLE public.homepage_content DROP CONSTRAINT IF EXISTS homepage_content_selection_types_check;
ALTER TABLE public.homepage_content ADD CONSTRAINT homepage_content_selection_types_check
  CHECK (
    (trending_selection_type = ANY (ARRAY['products', 'category']))
    AND (meadow_selection_type = ANY (ARRAY['products', 'category']))
    AND (boys_selection_type = ANY (ARRAY['products', 'category']))
    AND (girls_selection_type = ANY (ARRAY['products', 'category']))
  );
