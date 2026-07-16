-- tinytots-web/web/supabase/migrations/20260718090000_add_web_pricing.sql
ALTER TABLE public.variants ADD COLUMN web_base_price numeric(10,2);
ALTER TABLE public.variants ADD COLUMN web_discount_percent numeric(5,2) NOT NULL DEFAULT 0;
ALTER TABLE public.variants ADD COLUMN web_price numeric(10,2);