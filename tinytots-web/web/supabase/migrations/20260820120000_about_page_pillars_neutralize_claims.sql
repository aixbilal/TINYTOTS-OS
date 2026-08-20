-- The live about_page_content.pillars row still held its original 2026-07-28
-- seed copy ("we ensure fair wages, safe working conditions, and actively
-- support local artisan communities", "sourced from pure, organic cotton
-- fields") even though app/our-story/page.tsx's own DEFAULTS constant was
-- already rewritten to safe, honest language in a later session — the DB
-- row (which always wins over DEFAULTS) was never updated to match, so the
-- live page was still showing unsubstantiated ethical-sourcing/labor claims
-- TinyTots (a new, small, Toba Tek Singh-based curator of local + imported
-- stock, per its own real hero copy) cannot actually back up. This aligns
-- the live row with the same safe copy already approved in the page code.
update public.about_page_content
set pillars = '[
  {"icon": "eco", "title": "Thoughtful Quality", "body": "We use premium, breathable fabrics that are gentle on delicate skin and made to last."},
  {"icon": "favorite", "title": "Made with Care", "body": "Every piece is designed with love and attention to every little detail."},
  {"icon": "spa", "title": "Timeless Style", "body": "Classic, neutral designs that never go out of style and can be cherished for years."},
  {"icon": "diversity_3", "title": "For Every Family", "body": "Inclusive sizing, flexible essentials, and pieces that fit beautifully into real family life."}
]'::jsonb
where id = 1;
