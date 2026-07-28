-- Lets the admin set a dedicated hero image for mobile, since the
-- wide desktop crop looks off when squeezed into a narrow viewport
-- with bg-cover.
ALTER TABLE public.homepage_content
  ADD COLUMN IF NOT EXISTS hero_image_url_mobile text;
