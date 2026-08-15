-- Adds the "New Arrivals" tile as the 4th bento-grid banner alongside
-- Soft Pastels/Boys/Girls, mirroring the existing boys_*/girls_* column
-- pattern from 20260727120000_homepage_banners.sql so it is admin-editable
-- rather than hardcoded.
alter table public.homepage_content
  add column if not exists new_arrivals_image_url text not null default '/images/homepage/new-arrivals-tile.webp',
  add column if not exists new_arrivals_heading text not null default 'New Arrivals',
  add column if not exists new_arrivals_button_text text not null default 'Shop Now',
  add column if not exists new_arrivals_link text not null default '/products?sort=newest',
  -- Matches the selection_type/category/product_ids trio added for
  -- meadow/boys/girls in 20260728110000_homepage_section_selections.sql,
  -- so the tile can be driven by category or hand-picked products like
  -- its siblings, not just a static link.
  add column if not exists new_arrivals_selection_type text not null default 'category',
  add column if not exists new_arrivals_category text,
  add column if not exists new_arrivals_product_ids bigint[] default '{}';

alter table public.homepage_content drop constraint if exists homepage_content_selection_types_check;
alter table public.homepage_content add constraint homepage_content_selection_types_check
  check (
    (trending_selection_type = any (array['products', 'category']))
    and (meadow_selection_type = any (array['products', 'category']))
    and (boys_selection_type = any (array['products', 'category']))
    and (girls_selection_type = any (array['products', 'category']))
    and (new_arrivals_selection_type = any (array['products', 'category']))
  );
