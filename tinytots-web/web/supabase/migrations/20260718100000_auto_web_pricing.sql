-- Default web markup applied automatically when a variant has no web pricing set yet.
-- Change this single number later if you want a different default markup.
CREATE OR REPLACE FUNCTION public.auto_fill_web_pricing()
RETURNS TRIGGER AS $$
DECLARE
  default_markup_percent numeric := 25;
BEGIN
  -- Only auto-fill web_base_price if it's genuinely untouched (NULL).
  -- Once an admin sets it manually via the web panel, this trigger leaves it alone.
  IF NEW.web_base_price IS NULL THEN
    NEW.web_base_price := ROUND(COALESCE(NEW.base_price, NEW.price) * (1 + default_markup_percent / 100), 2);
  END IF;

  -- web_price is always kept in sync with web_base_price and web_discount_percent,
  -- so admins only ever need to edit one of those two, never web_price directly.
  NEW.web_price := ROUND(NEW.web_base_price * (1 - COALESCE(NEW.web_discount_percent, 0) / 100), 2);

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_auto_fill_web_pricing ON public.variants;
CREATE TRIGGER trg_auto_fill_web_pricing
BEFORE INSERT OR UPDATE ON public.variants
FOR EACH ROW
EXECUTE FUNCTION public.auto_fill_web_pricing();

-- One-time backfill: apply this to every existing variant (old test products,
-- anything created in Electron) that currently has no web price at all.
UPDATE public.variants
SET web_base_price = ROUND(COALESCE(base_price, price) * 1.25, 2)
WHERE web_base_price IS NULL;

UPDATE public.variants
SET web_price = ROUND(web_base_price * (1 - COALESCE(web_discount_percent, 0) / 100), 2)
WHERE web_price IS NULL;