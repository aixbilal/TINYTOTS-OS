CREATE TABLE IF NOT EXISTS public.testimonials (
    id bigserial PRIMARY KEY,
    customer_name text NOT NULL,
    rating smallint NOT NULL DEFAULT 5 CHECK (rating BETWEEN 1 AND 5),
    quote text NOT NULL,
    is_published boolean NOT NULL DEFAULT true,
    sort_order integer NOT NULL DEFAULT 0,
    created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.testimonials ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public can view published testimonials" ON public.testimonials
FOR SELECT USING (is_published = true);
-- Writes only via service_role (admin API routes), same pattern as
-- product_images: no INSERT/UPDATE/DELETE policy means anon/authenticated
-- are blocked by default and only service_role (which bypasses RLS) can write.
