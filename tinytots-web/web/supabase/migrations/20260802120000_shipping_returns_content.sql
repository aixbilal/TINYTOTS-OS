-- Shipping & Returns public page uses a structured bento layout (timeline
-- cards, COD tiers, return steps, contact CTA). The Quill site_pages row
-- for slug=shipping-returns never drove that UI — give it a dedicated
-- single-row table (same pattern as about_page_content) and drop the
-- orphaned site_pages entry so admin isn't misled.
CREATE TABLE IF NOT EXISTS public.shipping_returns_content (
    id integer PRIMARY KEY DEFAULT 1,
    hero_title text NOT NULL DEFAULT 'Shipping & Returns',
    hero_subtitle text NOT NULL DEFAULT '',
    toc jsonb NOT NULL DEFAULT '[]'::jsonb,
    timelines_heading text NOT NULL DEFAULT 'Delivery Timelines in Pakistan',
    timelines jsonb NOT NULL DEFAULT '[]'::jsonb,
    cod_heading text NOT NULL DEFAULT 'Cash on Delivery Terms',
    cod_intro text NOT NULL DEFAULT '',
    cod_tiers jsonb NOT NULL DEFAULT '[]'::jsonb,
    steps_heading text NOT NULL DEFAULT 'Return & Exchange Process',
    steps jsonb NOT NULL DEFAULT '[]'::jsonb,
    contact_heading text NOT NULL DEFAULT 'Need help with an order?',
    contact_body text NOT NULL DEFAULT '',
    contact_button_text text NOT NULL DEFAULT 'Visit Help Center',
    contact_button_link text NOT NULL DEFAULT '/help',
    updated_at timestamptz NOT NULL DEFAULT now(),
    CONSTRAINT shipping_returns_content_single_row CHECK (id = 1)
);

ALTER TABLE public.shipping_returns_content ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public can view shipping returns content" ON public.shipping_returns_content;
CREATE POLICY "Public can view shipping returns content" ON public.shipping_returns_content
FOR SELECT USING (true);

INSERT INTO public.shipping_returns_content (
  id,
  hero_title,
  hero_subtitle,
  toc,
  timelines_heading,
  timelines,
  cod_heading,
  cod_intro,
  cod_tiers,
  steps_heading,
  steps,
  contact_heading,
  contact_body,
  contact_button_text,
  contact_button_link
) VALUES (
  1,
  'Shipping & Returns',
  'Clear timelines and straightforward policies, so you always know where your order stands.',
  '[
    {"id": "delivery-timelines", "title": "Delivery Timelines"},
    {"id": "cash-on-delivery", "title": "Cash on Delivery Terms"},
    {"id": "returns-process", "title": "Return & Exchange Process"}
  ]'::jsonb,
  'Delivery Timelines in Pakistan',
  '[
    {"icon": "package_2", "label": "Order Preparation", "value": "Within 24 Hours"},
    {"icon": "local_shipping", "label": "Punjab & Islamabad", "value": "2–3 Business Days"},
    {"icon": "map", "label": "Other Provinces", "value": "4–7 Business Days"}
  ]'::jsonb,
  'Cash on Delivery Terms',
  'To keep our delivery network running smoothly, some COD orders require a small advance token payment before dispatch. Your order total determines which tier applies:',
  '[
    {"range": "Under Rs. 5,000", "detail": "Full Cash on Delivery — no advance payment needed."},
    {"range": "Rs. 5,000 – Rs. 10,000", "detail": "A 10% advance token payment is required before dispatch."},
    {"range": "Above Rs. 10,000", "detail": "A flat Rs. 2,000 advance token payment is required before dispatch."}
  ]'::jsonb,
  'Return & Exchange Process',
  '[
    {"icon": "assignment_return", "title": "Request Initiation", "body": "Start a return request from your Account within 7 days of delivery. Items must be unworn, unwashed, with tags intact."},
    {"icon": "airport_shuttle", "title": "Pickup or Drop-off", "body": "Once approved, we''ll arrange collection or share drop-off details, depending on your area."},
    {"icon": "verified", "title": "Validation & Refund", "body": "Once we receive and inspect the item, your refund or store credit is issued according to your chosen method."}
  ]'::jsonb,
  'Need help with an order?',
  'Our team is happy to help with delivery or return questions.',
  'Visit Help Center',
  '/help'
) ON CONFLICT (id) DO NOTHING;

DELETE FROM public.site_pages WHERE slug = 'shipping-returns';
