-- Prebuilt pools for hero features, hero stats, and product card badges.
-- Campaigns select feature/stat IDs (like trust_item_ids). Product badges
-- become free text backed by a badge_items suggestion library.

begin;

-- ---------------------------------------------------------------------------
-- feature_items
-- ---------------------------------------------------------------------------
create table if not exists public.feature_items (
  id bigserial primary key,
  icon text not null default 'eco',
  label text not null,
  is_active boolean not null default true,
  sort_order integer not null default 0,
  created_at timestamptz not null default now()
);

alter table public.feature_items enable row level security;

drop policy if exists "Public can view active feature items" on public.feature_items;
create policy "Public can view active feature items"
  on public.feature_items for select
  using (is_active = true);

insert into public.feature_items (icon, label, is_active, sort_order)
select v.icon, v.label, true, v.sort_order
from (
  values
    ('eco', 'Premium Cotton', 0),
    ('spa', 'Soft on Skin', 1),
    ('verified', 'Built to Last', 2),
    ('air', 'Insulated Warmth', 3),
    ('favorite', 'Soft Lining', 4),
    ('shield_check', 'Wind Resistant', 5),
    ('eco', 'Organic Fabric', 6),
    ('sync_alt', 'Easy Care', 7),
    ('checkroom', 'Stretch Fit', 8),
    ('air', 'Breathable Weave', 9),
    ('verified', 'Fade Resistant', 10),
    ('construction', 'Reinforced Stitching', 11),
    ('spa', 'Hypoallergenic', 12),
    ('bolt', 'Moisture Wicking', 13),
    ('favorite', 'Tagless Comfort', 14),
    ('construction', 'Double Knees', 15),
    ('checkroom', 'Adjustable Waist', 16),
    ('bolt', 'Quick Dry', 17),
    ('spa', 'Extra Soft Touch', 18),
    ('sync_alt', 'Machine Washable', 19),
    ('verified', 'Colorfast Dye', 20),
    ('eco', 'Skin Friendly', 21)
) as v(icon, label, sort_order)
where not exists (select 1 from public.feature_items limit 1);

-- ---------------------------------------------------------------------------
-- stat_items
-- ---------------------------------------------------------------------------
create table if not exists public.stat_items (
  id bigserial primary key,
  icon text not null default 'group',
  value text not null,
  label text not null,
  is_active boolean not null default true,
  sort_order integer not null default 0,
  created_at timestamptz not null default now()
);

alter table public.stat_items enable row level security;

drop policy if exists "Public can view active stat items" on public.stat_items;
create policy "Public can view active stat items"
  on public.stat_items for select
  using (is_active = true);

insert into public.stat_items (icon, value, label, is_active, sort_order)
select v.icon, v.value, v.label, true, v.sort_order
from (
  values
    ('group', '50,000+', 'Happy Parents', 0),
    ('checkroom', '200+', 'Unique Designs', 1),
    ('eco', '100%', 'Premium Cotton', 2),
    ('local_shipping', '25,000+', 'Orders Delivered', 3),
    ('verified', '98%', 'Parent Satisfaction', 4),
    ('bolt', '500+', 'New Arrivals', 5),
    ('local_shipping', 'Free', 'Nationwide Delivery', 6),
    ('favorite', '4.9★', 'Average Rating', 7),
    ('sync_alt', '30-Day', 'Easy Returns', 8),
    ('verified', 'Since 2020', 'Trusted Brand', 9),
    ('group', '12', 'Cities Covered', 10),
    ('bolt', 'Same-Day', 'Dispatch', 11),
    ('construction', '1M+', 'Stitches Inspected', 12),
    ('spa', 'Zero', 'Scratchy Tags', 13),
    ('eco', '100%', 'Skin-Safe Dyes', 14)
) as v(icon, value, label, sort_order)
where not exists (select 1 from public.stat_items limit 1);

-- ---------------------------------------------------------------------------
-- badge_items (suggestion pool)
-- ---------------------------------------------------------------------------
create table if not exists public.badge_items (
  id bigserial primary key,
  label text not null,
  is_active boolean not null default true,
  sort_order integer not null default 0,
  created_at timestamptz not null default now()
);

alter table public.badge_items enable row level security;

drop policy if exists "Public can view active badge items" on public.badge_items;
create policy "Public can view active badge items"
  on public.badge_items for select
  using (is_active = true);

insert into public.badge_items (label, is_active, sort_order)
select v.label, true, v.sort_order
from (
  values
    ('NEW', 0),
    ('BEST SELLER', 1),
    ('LIMITED EDITION', 2),
    ('TRENDING', 3),
    ('STAFF PICK', 4),
    ('BACK IN STOCK', 5),
    ('SELLING FAST', 6),
    ('ONLINE EXCLUSIVE', 7),
    ('JUST ARRIVED', 8),
    ('ALMOST GONE', 9),
    ('PREORDER', 10),
    ('BUNDLE DEAL', 11),
    ('ECO PICK', 12),
    ('EDITOR''S CHOICE', 13),
    ('HOT RIGHT NOW', 14),
    ('WEEKEND SPECIAL', 15),
    ('GIFT READY', 16),
    ('CLASSIC FIT', 17),
    ('SEASONAL', 18),
    ('RUNWAY INSPIRED', 19),
    ('TINYTOTS FAVORITE', 20),
    ('RESTOCKED', 21)
) as v(label, sort_order)
where not exists (select 1 from public.badge_items limit 1);

-- ---------------------------------------------------------------------------
-- Campaign selection columns
-- ---------------------------------------------------------------------------
alter table public.campaigns
  add column if not exists feature_item_ids bigint[] not null default '{}'::bigint[],
  add column if not exists stat_item_ids bigint[] not null default '{}'::bigint[];

-- Backfill feature_item_ids from legacy feature_list titles when possible,
-- otherwise the first 3 active library items.
update public.campaigns c
set feature_item_ids = coalesce(
  (
    select array_agg(fi.id order by ordinality)
    from jsonb_array_elements(coalesce(c.feature_list, '[]'::jsonb)) with ordinality as elem(value, ordinality)
    join public.feature_items fi
      on lower(fi.label) = lower(coalesce(elem.value->>'title', elem.value->>'label', ''))
    where ordinality <= 3
  ),
  (
    select array_agg(id order by sort_order)
    from (
      select id, sort_order from public.feature_items where is_active = true order by sort_order limit 3
    ) top
  ),
  '{}'::bigint[]
)
where coalesce(cardinality(feature_item_ids), 0) = 0;

update public.campaigns c
set stat_item_ids = coalesce(
  (
    select array_agg(si.id order by ordinality)
    from jsonb_array_elements(coalesce(c.statistics, '[]'::jsonb)) with ordinality as elem(value, ordinality)
    join public.stat_items si
      on lower(si.value) = lower(coalesce(elem.value->>'number', elem.value->>'value', ''))
     and lower(si.label) = lower(coalesce(elem.value->>'description', elem.value->>'label', ''))
    where ordinality <= 3
  ),
  (
    select array_agg(id order by sort_order)
    from (
      select id, sort_order from public.stat_items where is_active = true order by sort_order limit 3
    ) top
  ),
  '{}'::bigint[]
)
where coalesce(cardinality(stat_item_ids), 0) = 0;

-- ---------------------------------------------------------------------------
-- products.signage_badge → free text (pool + custom)
-- ---------------------------------------------------------------------------
alter table public.products
  drop constraint if exists products_signage_badge_check;

-- Normalize legacy enum tokens to human labels
update public.products
set signage_badge = case signage_badge
  when 'BEST_SELLER' then 'BEST SELLER'
  when 'LIMITED_EDITION' then 'LIMITED EDITION'
  else signage_badge
end
where signage_badge is not null;

comment on column public.products.signage_badge is
  'Optional free-text signage card badge label. Suggested values live in badge_items.';

-- ---------------------------------------------------------------------------
-- Realtime revision bumps when libraries change
-- ---------------------------------------------------------------------------
drop trigger if exists feature_items_bump_signage_revision on public.feature_items;
create trigger feature_items_bump_signage_revision
after insert or update or delete on public.feature_items
for each statement execute function public.bump_signage_revision();

drop trigger if exists stat_items_bump_signage_revision on public.stat_items;
create trigger stat_items_bump_signage_revision
after insert or update or delete on public.stat_items
for each statement execute function public.bump_signage_revision();

drop trigger if exists badge_items_bump_signage_revision on public.badge_items;
create trigger badge_items_bump_signage_revision
after insert or update or delete on public.badge_items
for each statement execute function public.bump_signage_revision();

commit;
