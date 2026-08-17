-- Adds editorial curation flags to blog_posts. Both are manually-set by an
-- admin (not derived from view counts or any real analytics, since no such
-- tracking exists) - "featured" and "popular" are honest editorial choices
-- here, not fabricated metrics. Note: featured_image_url and category
-- already exist on this table in the live database (used by the existing
-- admin editor and blog pages) but featured_image_url has no corresponding
-- migration file in this repo's history - flagging that gap, not fixing it
-- retroactively since the column demonstrably already exists and works.
alter table public.blog_posts
  add column if not exists is_featured boolean not null default false,
  add column if not exists is_popular boolean not null default false;

-- Hero banner + email-subscribe banner content for the /blog page, same
-- singleton admin-editable pattern as shop_page_content.
create table if not exists public.blog_page_content (
  id int primary key default 1,
  hero_image_url text not null default '/images/homepage/promotional-campaign.webp',
  hero_image_url_mobile text not null default '',
  hero_eyebrow text not null default 'The Journal',
  hero_headline text not null default 'Stories, style guides, and care tips.',
  hero_subtext text not null default 'For your little ones, from our family to yours.',
  subscribe_image_url text not null default '/images/homepage/cta-closing-visual.webp',
  subscribe_headline text not null default 'Never miss a story.',
  subscribe_subtext text not null default 'Get new articles, style guides, and care tips delivered to your inbox.',
  updated_at timestamptz default now(),
  constraint blog_page_content_singleton check (id = 1)
);

alter table public.blog_page_content enable row level security;

create policy "Public can view blog page content" on public.blog_page_content
for select using (true);

insert into public.blog_page_content (id) values (1)
on conflict (id) do nothing;
