-- Adds a real hex value alongside the existing free-text color name on
-- variants, so product-card swatches can render actual colors instead of
-- generic dots. Nullable + admin-editable, not authoritative on its own -
-- auto-suggested via lib/extract-color.ts (average color from the
-- product's primary image) when a variant is created, but always
-- overridable in the admin product editor.
alter table public.variants
  add column if not exists color_hex text;

comment on column public.variants.color_hex is
  'Hex swatch color (e.g. #C9A876). Auto-suggested from the product photo on variant creation; admin can override for accuracy.';
