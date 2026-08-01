-- Rotation queue order + per-campaign duration, global header text,
-- and optional per-line hero heading colors.

begin;

alter table public.campaigns
  add column if not exists rotation_order integer not null default 0,
  add column if not exists display_seconds integer not null default 18,
  add column if not exists heading_line1_color text,
  add column if not exists heading_line2_color text;

alter table public.campaigns
  drop constraint if exists campaigns_display_seconds_check;

alter table public.campaigns
  add constraint campaigns_display_seconds_check
  check (display_seconds between 10 and 60);

-- Seed rotation_order for existing active campaigns (stable by updated_at).
with ordered as (
  select id, row_number() over (order by updated_at desc, id desc) - 1 as ord
  from public.campaigns
  where is_active = true
)
update public.campaigns c
set rotation_order = ordered.ord
from ordered
where c.id = ordered.id;

alter table public.signage_revision
  add column if not exists header_logo_text text not null default 'TinyTots',
  add column if not exists header_tagline text not null default 'Premium Kids Wear',
  add column if not exists rotation_seconds integer not null default 18;

-- Ensure rotation_seconds exists even if prior multi-active migration wasn't applied.
update public.signage_revision
set
  header_logo_text = coalesce(nullif(header_logo_text, ''), 'TinyTots'),
  header_tagline = coalesce(nullif(header_tagline, ''), 'Premium Kids Wear'),
  rotation_seconds = coalesce(rotation_seconds, 18)
where id = 1;

commit;
