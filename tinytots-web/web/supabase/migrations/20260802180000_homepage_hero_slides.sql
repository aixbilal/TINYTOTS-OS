-- Multi-slide homepage hero. Seed slide 1 from the existing single-hero fields.
ALTER TABLE public.homepage_content
  ADD COLUMN IF NOT EXISTS hero_slides jsonb NOT NULL DEFAULT '[]'::jsonb;

UPDATE public.homepage_content
SET hero_slides = jsonb_build_array(
  jsonb_build_object(
    'image_url', coalesce(nullif(trim(hero_image_url), ''), ''),
    'headline', coalesce(hero_headline, ''),
    'subtitle', coalesce(hero_subtext, ''),
    'button_text', coalesce(hero_button_text, ''),
    'button_link', coalesce(hero_button_link, '')
  )
)
WHERE id = 1
  AND (
    hero_slides IS NULL
    OR hero_slides = '[]'::jsonb
    OR jsonb_typeof(hero_slides) <> 'array'
    OR jsonb_array_length(hero_slides) = 0
  );
