-- Help Center hero + "Need More Help" support visual, admin-editable,
-- same singleton pattern as shop_page_content/blog_page_content. Needed
-- for the Help Center major-redesign pass (was a plain categorized list
-- with zero imagery/hero of its own before this).
create table if not exists public.help_page_content (
  id int primary key default 1,
  hero_image_url text not null default '',
  hero_image_url_mobile text not null default '',
  hero_eyebrow text not null default 'Help Center',
  hero_headline text not null default 'How can we help you?',
  hero_subtext text not null default 'Find answers to common questions or get in touch with our team.',
  support_image_url text not null default '',
  updated_at timestamptz default now(),
  constraint help_page_content_singleton check (id = 1)
);

alter table public.help_page_content enable row level security;

create policy "Public can view help page content" on public.help_page_content
for select using (true);

insert into public.help_page_content (id) values (1)
on conflict (id) do nothing;
