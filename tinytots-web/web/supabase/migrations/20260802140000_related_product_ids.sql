-- Manual related-product picks for PDP "You May Also Like" carousel.
-- Matches homepage *_product_ids convention (bigint[]).
ALTER TABLE public.products
  ADD COLUMN IF NOT EXISTS related_product_ids bigint[] NOT NULL DEFAULT '{}';

ALTER TABLE public.categories
  ADD COLUMN IF NOT EXISTS related_product_ids bigint[] NOT NULL DEFAULT '{}';
