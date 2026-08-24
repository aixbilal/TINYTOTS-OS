-- Collections/Categories admin gap flagged since Phase C: no image, no
-- description, no active/visible flag existed. Adds exactly those three -
-- not featured or a Collections-landing hero, since nothing in the current
-- customer frontend reads either of those yet. Defaults are non-destructive:
-- empty image/description (existing icon-placeholder fallback keeps working),
-- is_active true (every existing category stays visible as before).
alter table public.categories
  add column if not exists image_url text not null default '',
  add column if not exists description text not null default '',
  add column if not exists is_active boolean not null default true;
