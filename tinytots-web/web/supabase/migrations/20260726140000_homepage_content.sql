create table if not exists public.homepage_content (
  id int primary key default 1,
  hero_image_url text not null default '',
  hero_headline text not null default 'Playful Designs for Little Pioneers',
  hero_subtext text not null default 'Ethically crafted, modern essentials for every stage of your child''s early journey.',
  hero_button_text text not null default 'Shop New Arrivals',
  hero_button_link text not null default '#trending',
  trending_heading text not null default 'Trending Now',
  updated_at timestamptz default now(),
  constraint homepage_content_singleton check (id = 1)
);

alter table public.homepage_content enable row level security;

create policy "Public can view homepage content" on public.homepage_content
for select using (true);

-- No insert/update/delete policy — only service-role (supabaseAdmin) writes.

insert into public.homepage_content (
  id, hero_image_url, hero_headline, hero_subtext, hero_button_text, hero_button_link, trending_heading
) values (
  1,
  'https://lh3.googleusercontent.com/aida-public/AB6AXuDcHOEBpwtxoe3pT3NNiOQoUlZSPXHZXzjeoQOBkGcnwMqk8LNEfS_BLaNFvbDX-hie2mEl7T0RXcYZiRo62Rvdf50WGU9U4BD5oXHj7_E-gwRRFNXsBN-fTWavIdwpKxC17urnpJTVwBoPKRa1I79HkhFnqTLljxe6--Z6Hlwkbqweez3itoFTvxizLNFwL3tMrsZt3LeJQ-PBMbb1EiJJB23UvYLpk3iw905UJTcODCR79jbCm2P_w_RYfYB_hiR-KWOI441C-kke',
  'Playful Designs for Little Pioneers',
  'Ethically crafted, modern essentials for every stage of your child''s early journey.',
  'Shop New Arrivals',
  '#trending',
  'Trending Now'
)
on conflict (id) do nothing;
