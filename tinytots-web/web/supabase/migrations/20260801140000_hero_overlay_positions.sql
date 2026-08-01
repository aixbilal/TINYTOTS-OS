-- Per-campaign manual placement for hero badge circle and feature callouts.

begin;

alter table public.campaigns
  add column if not exists hero_badge_position jsonb not null default '{"x":58,"y":14}'::jsonb,
  add column if not exists feature_list_position jsonb not null default '{"x":56,"y":55}'::jsonb;

comment on column public.campaigns.hero_badge_position is
  'Hero circular badge placement: {x,y} percent within the banner box (left/top).';
comment on column public.campaigns.feature_list_position is
  'Hero feature callout stack placement: {x,y} percent within the banner box (left/top).';

commit;
