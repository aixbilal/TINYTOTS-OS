-- Our Story ("About") page was fully hardcoded (hero, quote, pillar cards,
-- CTA banner) despite site_pages having an unused row for it — the admin
-- editor there was a plain text box with zero effect on the real page.
-- This gives it a proper structured, bento-matching editor instead.
CREATE TABLE IF NOT EXISTS public.about_page_content (
    id integer PRIMARY KEY DEFAULT 1,
    hero_image_url text,
    hero_headline text,
    quote_text text,
    quote_attribution text,
    body_paragraph_1 text,
    body_paragraph_2 text,
    body_paragraph_3 text,
    pillars jsonb NOT NULL DEFAULT '[]'::jsonb,
    cta_image_url text,
    cta_heading text,
    cta_button_text text,
    cta_button_link text,
    updated_at timestamptz NOT NULL DEFAULT now(),
    CONSTRAINT about_page_content_single_row CHECK (id = 1)
);

ALTER TABLE public.about_page_content ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public can view about page content" ON public.about_page_content
FOR SELECT USING (true);

INSERT INTO public.about_page_content (
  id, hero_image_url, hero_headline, quote_text, quote_attribution,
  body_paragraph_1, body_paragraph_2, body_paragraph_3, pillars,
  cta_image_url, cta_heading, cta_button_text, cta_button_link
) VALUES (
  1,
  'https://lh3.googleusercontent.com/aida-public/AB6AXuDcHOEBpwtxoe3pT3NNiOQoUlZSPXHZXzjeoQOBkGcnwMqk8LNEfS_BLaNFvbDX-hie2mEl7T0RXcYZiRo62Rvdf50WGU9U4BD5oXHj7_E-gwRRFNXsBN-fTWavIdwpKxC17urnpJTVwBoPKRa1I79HkhFnqTLljxe6--Z6Hlwkbqweez3itoFTvxizLNFwL3tMrsZt3LeJQ-PBMbb1EiJJB23UvYLpk3iw905UJTcODCR79jbCm2P_w_RYfYB_hiR-KWOI441C-kke',
  'Designed for play. Made for comfort. Built for Pakistan.',
  'We believe childhood is a brief, magical window. Our garments shouldn''t distract from the play — they should enable it, naturally.',
  'The Founders',
  'TinyTots was born out of a simple necessity: the search for uncompromising quality in children''s wear that didn''t forsake the environment or local craftsmanship.',
  'We champion ethical manufacturing processes, partnering directly with artisanal workshops across Pakistan. Every piece is constructed from thoughtfully sourced organic materials, ensuring a gentle touch against delicate skin while remaining robust enough for the rigors of playground adventures.',
  'By streamlining our supply chain and focusing on timeless essentials, we deliver sustainable luxury at a pricing model that respects families. It''s a commitment to our children, our community, and our earth.',
  '[
    {"icon": "eco", "title": "Soft on Skin", "body": "Sourced from pure, organic cotton fields. Free from harsh chemicals, synthetic dyes, or irritating tags, ensuring maximum comfort for sensitive early years."},
    {"icon": "strikethrough_s", "title": "Built for Play", "body": "Engineered with reinforced double-stitching at critical stress points. Our garments withstand crawling, climbing, and countless wash cycles without losing their shape."},
    {"icon": "map", "title": "Ethically Sourced", "body": "Proudly designed and ethically produced in Pakistan. We ensure fair wages, safe working conditions, and actively support local artisan communities."}
  ]'::jsonb,
  'https://lh3.googleusercontent.com/aida-public/AB6AXuC7yxVcADAps3cmNLkJr8FGA6JeKmVrlesZnXqwQdhOLqdCGmVEKY22R7aE09WRXqNokfy8JzvSPf3tssmBSiWdkYwuIooiwQQfCn8_jlfsUFc1RbMINfy5orTZSQHYih3obVl7aqtOJBD_jt1CxBXMFKAUEkAe59L0zZspz8oyJFHsPhjfLpcIj4hQWwp8lx3tMlWlR0RX3UoQ0ZVBf1Gzs8Do92kjAB4OpHGYrUYsGE5gjbGuH3Ez-MwiXx_V2uhCVSGd0GHJGZlT',
  'Ready to experience the difference?',
  'Explore Our Collections',
  '/products'
) ON CONFLICT (id) DO NOTHING;
