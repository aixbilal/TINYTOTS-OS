ALTER TABLE public.variants ADD COLUMN web_price_locked boolean NOT NULL DEFAULT false;

CREATE OR REPLACE FUNCTION public.auto_fill_web_pricing()
RETURNS TRIGGER AS $$
DECLARE
  default_markup_percent numeric := 25;
BEGIN
  -- Recompute web_base_price from the shop price whenever unlocked —
  -- this makes web price track shop price increases automatically.
  -- Set web_price_locked = true on a variant to freeze it and edit web price by hand instead.
  IF NOT NEW.web_price_locked THEN
    NEW.web_base_price := ROUND(COALESCE(NEW.base_price, NEW.price) * (1 + default_markup_percent / 100), 2);
  END IF;

  -- web_price always derives from web_base_price + web_discount_percent, regardless of lock state —
  -- locking only freezes the base markup, discounts still apply on top.
  NEW.web_price := ROUND(NEW.web_base_price * (1 - COALESCE(NEW.web_discount_percent, 0) / 100), 2);

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;