-- Allow category-wide discounts, and store which category when used
ALTER TABLE public.discounts DROP CONSTRAINT discounts_applies_to_check;
ALTER TABLE public.discounts ADD CONSTRAINT discounts_applies_to_check
  CHECK (applies_to = ANY (ARRAY['single_product'::text, 'product_set'::text, 'category'::text]));

ALTER TABLE public.discounts ADD COLUMN category text;