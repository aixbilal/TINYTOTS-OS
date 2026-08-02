-- Extra homepage_content fields so every visible homepage block can be edited
-- from /admin/homepage (trust strip, USP heading, carousel tab labels, boys/girls copy).

alter table public.homepage_content
  add column if not exists trust_items jsonb not null default '[
    {"icon":"payments","label":"Cash on Delivery Available"},
    {"icon":"local_shipping","label":"Free Delivery on All Orders"},
    {"icon":"replay","label":"Easy 7-Day Returns"}
  ]'::jsonb,
  add column if not exists usp_heading text not null default 'Why Choose TinyTots',
  add column if not exists newarrivals_heading text not null default 'New Arrivals',
  add column if not exists bestsellers_heading text not null default 'Bestsellers',
  add column if not exists boys_heading text not null default 'Boys',
  add column if not exists boys_button_text text not null default 'Shop Now',
  add column if not exists girls_heading text not null default 'Girls',
  add column if not exists girls_button_text text not null default 'Shop Now';
