-- Hero video (optional, desktop only — mobile keeps the static image to
-- avoid unnecessary data usage).
ALTER TABLE public.homepage_content
  ADD COLUMN IF NOT EXISTS hero_video_url text;

-- Shoppable Instagram / UGC feed — manually curated, since integrating the
-- real Instagram API requires app review + tokens; admins add posts here
-- (image, caption, optional Instagram permalink) instead.
CREATE TABLE IF NOT EXISTS public.ugc_posts (
    id bigserial PRIMARY KEY,
    image_url text NOT NULL,
    caption text,
    instagram_handle text,
    link text,
    is_published boolean NOT NULL DEFAULT true,
    sort_order integer NOT NULL DEFAULT 0,
    created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.ugc_posts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public can view published UGC posts" ON public.ugc_posts
FOR SELECT USING (is_published = true);
