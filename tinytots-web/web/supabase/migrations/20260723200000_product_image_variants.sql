-- tinytots-web/web/supabase/migrations/20260723200000_product_image_variants.sql
-- Lets each image optionally be linked to one or more specific variants
-- (e.g. a "Sea Green" photo should show for all sizes of that color, but
-- not for "Beige"). An image with no rows here applies to the whole product
-- (falls back to showing on every variant) — this keeps existing images
-- (uploaded before this feature existed) working exactly as before.

CREATE TABLE public.product_image_variants (
    image_id bigint NOT NULL REFERENCES public.product_images(id) ON DELETE CASCADE,
    variant_id bigint NOT NULL REFERENCES public.variants(id) ON DELETE CASCADE,
    PRIMARY KEY (image_id, variant_id)
);

CREATE INDEX idx_product_image_variants_variant_id ON public.product_image_variants (variant_id);

ALTER TABLE public.product_image_variants ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public can view image-variant links" ON public.product_image_variants
FOR SELECT USING (true);

-- Writes only via service_role, same pattern as product_images itself.