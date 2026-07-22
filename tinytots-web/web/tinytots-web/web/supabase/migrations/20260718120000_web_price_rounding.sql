ALTER TABLE public.variants ADD COLUMN web_round_to numeric NOT NULL DEFAULT 50 CHECK (web_round_to IN (50, 100));

CREATE OR REPLACE FUNCTION public.auto_fill_web_pricing()
RETURNS TRIGGER AS $$
DECLARE
  default_markup_percent numeric := 25;
BEGIN
  IF NOT NEW.web_price_locked THEN
    NEW.web_base_price := ROUND(COALESCE(NEW.base_price, NEW.price) * (1 + default_markup_percent / 100), 2);
  END IF;

  NEW.web_price := CEIL(
    ROUND(NEW.web_base_price * (1 - COALESCE(NEW.web_discount_percent, 0) / 100), 2) / NEW.web_round_to
  ) * NEW.web_round_to;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Re-run rounding on all existing variants now that web_round_to exists
UPDATE public.variants SET web_round_to = web_round_to;