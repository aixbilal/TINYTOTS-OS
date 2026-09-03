-- =====================================================================
-- TINYTOTS OS — BATCH I / PART III
-- ONE AUTHORITATIVE CHANNEL-PRICING CONTRACT
--
-- PREPARE-ONLY: not applied by the batch. Review, then apply to project
-- vldjscskhsrrzdhhvcht. Additive + backward compatible.
--
-- WHAT CHANGES
--   1. Two business settings in app_settings (admin-manageable, no DB jargon):
--        default_web_markup_percent  (default 25)
--        web_round_to                (default 50)
--   2. auto_fill_web_pricing() reads those settings instead of a hard-coded 25
--      and a per-variant-only round value. The per-variant variants.web_round_to
--      column stays as an OPTIONAL override (NULL = follow the global setting).
--   3. variants.web_round_to: NOT NULL dropped, default changed to NULL, CHECK
--      widened to allow NULL. Existing rows keep their current value, so NO
--      existing web price moves. New variants follow the global setting.
--
-- WHAT DOES NOT CHANGE
--   * web_price_locked = true still freezes web_base_price (manual web price).
--   * web_discount_percent still applies on top, locked or not.
--   * Physical-shop price (variants.price / base_price) is a separate channel
--     and is never touched here.
--   * NO backfill / NO mass recompute. Existing live prices are business data
--     and stay exactly as they are until each variant is next edited (same as
--     today's trigger behaviour).
-- =====================================================================

-- ---------------------------------------------------------------------
-- 1. Business settings
-- ---------------------------------------------------------------------
insert into public.app_settings (key, value)
values ('default_web_markup_percent', '25')
on conflict (key) do nothing;

insert into public.app_settings (key, value)
values ('web_round_to', '50')
on conflict (key) do nothing;

-- ---------------------------------------------------------------------
-- 2. variants.web_round_to becomes an optional override
-- ---------------------------------------------------------------------
alter table public.variants alter column web_round_to drop not null;
alter table public.variants alter column web_round_to drop default;

-- widen the existing CHECK to permit NULL (name is the Postgres default)
alter table public.variants drop constraint if exists variants_web_round_to_check;
alter table public.variants
  add constraint variants_web_round_to_check
  check (web_round_to is null or web_round_to in (50, 100));

-- ---------------------------------------------------------------------
-- 3. Pricing trigger — settings-driven, lock-aware, no NULL web_price
-- ---------------------------------------------------------------------
create or replace function public.auto_fill_web_pricing()
returns trigger as $$
declare
  v_markup numeric;
  v_round  numeric;
begin
  -- Global default web markup (%), manageable in Admin > Settings > Online Pricing.
  select nullif(value, '')::numeric into v_markup
  from public.app_settings where key = 'default_web_markup_percent';
  if v_markup is null or v_markup < 0 then
    v_markup := 25;
  end if;

  -- Rounding step: per-variant override (variants.web_round_to) wins when set,
  -- otherwise the global setting, otherwise 50.
  v_round := NEW.web_round_to;
  if v_round is null then
    select nullif(value, '')::numeric into v_round
    from public.app_settings where key = 'web_round_to';
  end if;
  if v_round is null or v_round <= 0 then
    v_round := 50;
  end if;

  -- Unlocked: web base tracks the shop price + global markup.
  -- Locked: keep whatever web_base_price the admin set by hand, but if it was
  -- never set, derive it once so the storefront never sees a NULL web price.
  if not NEW.web_price_locked then
    NEW.web_base_price := round(coalesce(NEW.base_price, NEW.price) * (1 + v_markup / 100), 2);
  elsif NEW.web_base_price is null then
    NEW.web_base_price := round(coalesce(NEW.base_price, NEW.price) * (1 + v_markup / 100), 2);
  end if;

  -- web_price always derives from web_base_price + web_discount_percent,
  -- then rounds UP to the nearest v_round.
  NEW.web_price := ceil(
    round(NEW.web_base_price * (1 - coalesce(NEW.web_discount_percent, 0) / 100), 2) / v_round
  ) * v_round;

  return NEW;
end;
$$ language plpgsql;

-- SEC-12: keep the pinned empty search_path (function body is fully qualified).
alter function public.auto_fill_web_pricing() set search_path = '';

-- Trigger binding is unchanged (trg_auto_fill_web_pricing, BEFORE INSERT OR
-- UPDATE) and is preserved by CREATE OR REPLACE.
