-- Lets the admin choose whether the announcement bar sits still or
-- scrolls left-to-right in a continuous loop.
ALTER TABLE public.homepage_content
  ADD COLUMN IF NOT EXISTS announcement_style text NOT NULL DEFAULT 'static';

ALTER TABLE public.homepage_content DROP CONSTRAINT IF EXISTS homepage_content_announcement_style_check;
ALTER TABLE public.homepage_content ADD CONSTRAINT homepage_content_announcement_style_check
  CHECK (announcement_style = ANY (ARRAY['static', 'marquee']));
