-- Adds the net-new homepage sections required by the approved final
-- visual specification (Website Redesign Docs, 2026-08-16 handoff):
--   - Editorial story ("Designed with love. Made for childhood.")
--   - Two supporting lifestyle/brand modules
--   - Closing emotional CTA
--
-- Sections already covered by existing columns are NOT duplicated here:
--   - Spring Moments campaign reuses meadow_* (badge_text -> eyebrow)
--   - Hero eyebrow is a new key inside the existing hero_slides jsonb,
--     no migration needed
--   - Girls/Boys/New Arrivals reuse boys_*/girls_*/new_arrivals_*
--   - Trending row, trust strip, USP, testimonials, footer, announcement
--     bar all reuse existing columns/systems, restyle only

alter table public.homepage_content
  -- Editorial story section
  add column if not exists editorial_eyebrow text not null default 'Made With Heart',
  add column if not exists editorial_headline text not null default 'Designed with love. Made for childhood.',
  add column if not exists editorial_body text not null default 'Every piece is crafted from premium natural fabrics with gentle details and timeless silhouettes - made to be worn, loved, and passed down.',
  add column if not exists editorial_image_url text not null default '',
  add column if not exists editorial_cta_text text not null default 'Our Story',
  add column if not exists editorial_cta_link text not null default '/our-story',

  -- Lifestyle module 1 ("Beautiful pieces for real life")
  add column if not exists lifestyle_1_eyebrow text not null default 'Rooted In Quality',
  add column if not exists lifestyle_1_headline text not null default 'Beautiful pieces for real life.',
  add column if not exists lifestyle_1_body text not null default 'We believe in slow fashion, lasting quality, and the little details that make a big difference.',
  add column if not exists lifestyle_1_image_url text not null default '',
  add column if not exists lifestyle_1_cta_text text not null default 'Learn More',
  add column if not exists lifestyle_1_cta_link text not null default '/our-story',

  -- Lifestyle module 2 ("For the moments that matter")
  add column if not exists lifestyle_2_eyebrow text not null default 'Made For Together',
  add column if not exists lifestyle_2_headline text not null default 'For the moments that matter.',
  add column if not exists lifestyle_2_body text not null default 'From everyday adventures to memory-making days - we''re here for it all.',
  add column if not exists lifestyle_2_image_url text not null default '',
  add column if not exists lifestyle_2_cta_text text not null default 'Explore More',
  add column if not exists lifestyle_2_cta_link text not null default '/products',

  -- Closing emotional CTA
  add column if not exists closing_cta_image_url text not null default '',
  add column if not exists closing_cta_headline text not null default 'Made to be memories. Beautiful always.',
  add column if not exists closing_cta_subtext text not null default 'Styles today. Memories forever.',
  add column if not exists closing_cta_button_text text not null default 'Shop the Collection',
  add column if not exists closing_cta_button_link text not null default '/products';
