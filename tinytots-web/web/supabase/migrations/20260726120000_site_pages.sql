-- Admin-editable static content pages (About Us, Privacy Policy, Terms,
-- Shipping & Returns Policy). Store owner can edit wording without a dev,
-- since content like "About Us" differs for the online store vs the
-- physical shop, and policies change over time.
create table if not exists public.site_pages (
  slug text primary key,
  title text not null,
  content text not null,
  updated_at timestamptz default now()
);

alter table public.site_pages enable row level security;

create policy "Public can view site pages" on public.site_pages
for select using (true);

-- No insert/update/delete policies — only service-role (supabaseAdmin) writes.

insert into public.site_pages (slug, title, content) values
  ('our-story', 'Our Story', '<p>Write your About Us content here from the admin panel.</p>'),
  ('privacy-policy', 'Privacy Policy', '<p>Write your Privacy Policy content here from the admin panel.</p>'),
  ('terms', 'Terms & Conditions', '<p>Write your Terms & Conditions here from the admin panel.</p>'),
  ('shipping-returns', 'Shipping & Returns Policy', '<p>Write your Shipping & Returns Policy here from the admin panel.</p>')
on conflict (slug) do nothing;
