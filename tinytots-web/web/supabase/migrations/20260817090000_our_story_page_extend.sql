-- Extends the existing about_page_content table (real, already working -
-- hero/quote/body paragraphs/pillars/CTA all already there and admin-
-- editable) with the net-new sections required by FINAL OUR STORY PAGE.png.
-- Reuses existing fields wherever the content genuinely maps 1:1 rather
-- than duplicating: cta_image_url/cta_heading/cta_button_text/
-- cta_button_link already cover the "Creating memories" closing section
-- almost exactly, body_paragraph_1/2/3 already cover flowing copy, and
-- pillars is already a flexible-length array so no schema change was
-- needed to go from 3 to 4 "What We Stand For" items.
alter table public.about_page_content
  add column if not exists hero_image_url_mobile text not null default '',
  add column if not exists hero_eyebrow text not null default 'Our Story',
  add column if not exists hero_subtext text not null default '',
  add column if not exists section2_eyebrow text not null default 'From The Beginning',
  add column if not exists section2_headline text not null default 'Built on love, inspired by little moments.',
  add column if not exists section2_body text not null default 'Founded in 2024, TinyTots was created for modern families who value quality, simplicity, and meaning in the everyday. From the fabrics we choose to the details we design, everything we do is guided by care.',
  add column if not exists section2_image_url text not null default '',
  add column if not exists section2_signature text not null default 'With love, The TinyTots Team',
  add column if not exists section4_eyebrow text not null default 'More Than Clothes';
