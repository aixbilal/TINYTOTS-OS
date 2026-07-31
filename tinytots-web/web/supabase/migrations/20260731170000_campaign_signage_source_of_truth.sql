-- Campaigns are the complete, portable source of truth for signage.
-- Existing shared content is copied into every current campaign so this
-- migration does not change what is live when it is deployed.

begin;

alter table public.campaigns
  add column if not exists hero_banner_original_url text,
  add column if not exists hero_banner_preview_url text,
  add column if not exists hero_banner_crop jsonb,
  add column if not exists hero_banner_focal_point jsonb,
  add column if not exists trust_item_ids bigint[],
  add column if not exists testimonial_ids bigint[],
  add column if not exists social_links jsonb,
  add column if not exists footer_settings jsonb,
  add column if not exists theme jsonb;

update public.campaigns
set
  hero_banner_original_url = coalesce(hero_banner_original_url, hero_banner_image),
  hero_banner_preview_url = coalesce(hero_banner_preview_url, hero_banner_image)
where hero_banner_image is not null
  and (hero_banner_original_url is null or hero_banner_preview_url is null);

update public.campaigns
set hero_banner_crop = '{"unit":"%","x":0,"y":0,"width":100,"height":100}'::jsonb
where hero_banner_crop is null;

update public.campaigns
set hero_banner_focal_point = '{"x":50,"y":50}'::jsonb
where hero_banner_focal_point is null;

update public.campaigns
set theme = '{
    "primary":"#9c422e",
    "secondary":"#3b241a",
    "accent":"#c77b64",
    "button":"#9c422e",
    "buttonText":"#ffffff",
    "badge":"#fffaf5",
    "badgeText":"#9c422e",
    "background":"#faf5f0",
    "surface":"#fffaf7",
    "card":"#ffffff",
    "text":"#221f1d",
    "mutedText":"#6d625c",
    "border":"#ded3cc",
    "icon":"#9c422e",
    "footer":"#3b241a",
    "footerText":"#ffffff"
  }'::jsonb
where theme is null;

update public.campaigns
set trust_item_ids = coalesce(
  (select array_agg(id order by sort_order) from public.trust_items where is_active = true),
  '{}'::bigint[]
)
where trust_item_ids is null;

update public.campaigns
set testimonial_ids = coalesce(
  (
    select array_agg(id order by sort_order, created_at desc)
    from public.testimonials
    where is_published = true
  ),
  '{}'::bigint[]
)
where testimonial_ids is null;

update public.campaigns
set social_links = coalesce(
  (
    select jsonb_agg(
      jsonb_build_object(
        'platform', platform,
        'account_name', account_name,
        'url', url,
        'is_active', is_active
      )
      order by sort_order
    )
    from public.social_links
    where is_active = true
  ),
  '[]'::jsonb
)
where social_links is null;

update public.campaigns
set footer_settings = (
  select jsonb_build_object(
    'website_url', website_url,
    'qr_code_image_url', qr_code_image_url,
    'qr_visible', qr_visible,
    'scan_label', scan_label
  )
  from public.footer_settings
  where id = 1
)
where footer_settings is null;

alter table public.campaigns
  alter column hero_banner_crop set default
    '{"unit":"%","x":0,"y":0,"width":100,"height":100}'::jsonb,
  alter column hero_banner_crop set not null,
  alter column hero_banner_focal_point set default '{"x":50,"y":50}'::jsonb,
  alter column hero_banner_focal_point set not null,
  alter column trust_item_ids set default '{}'::bigint[],
  alter column trust_item_ids set not null,
  alter column testimonial_ids set default '{}'::bigint[],
  alter column testimonial_ids set not null,
  alter column social_links set default '[]'::jsonb,
  alter column social_links set not null,
  alter column theme set default '{
    "primary":"#9c422e",
    "secondary":"#3b241a",
    "accent":"#c77b64",
    "button":"#9c422e",
    "buttonText":"#ffffff",
    "badge":"#fffaf5",
    "badgeText":"#9c422e",
    "background":"#faf5f0",
    "surface":"#fffaf7",
    "card":"#ffffff",
    "text":"#221f1d",
    "mutedText":"#6d625c",
    "border":"#ded3cc",
    "icon":"#9c422e",
    "footer":"#3b241a",
    "footerText":"#ffffff"
  }'::jsonb,
  alter column theme set not null,
  drop constraint if exists campaigns_banner_crop_object,
  add constraint campaigns_banner_crop_object
    check (jsonb_typeof(hero_banner_crop) = 'object'),
  drop constraint if exists campaigns_banner_focal_point_object,
  add constraint campaigns_banner_focal_point_object
    check (jsonb_typeof(hero_banner_focal_point) = 'object'),
  drop constraint if exists campaigns_social_links_array,
  add constraint campaigns_social_links_array
    check (jsonb_typeof(social_links) = 'array'),
  drop constraint if exists campaigns_theme_object,
  add constraint campaigns_theme_object
    check (jsonb_typeof(theme) = 'object');

commit;
