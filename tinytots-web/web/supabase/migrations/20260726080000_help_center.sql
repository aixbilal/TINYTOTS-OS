create table if not exists public.help_articles (
  id bigserial primary key,
  title text not null,
  slug text not null unique,
  content text not null,
  category text not null default 'general',
  display_order int not null default 0,
  is_published boolean not null default false,
  published_at timestamptz,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

alter table public.help_articles enable row level security;

create policy "Public can view published help articles" on public.help_articles
for select using (is_published = true);
