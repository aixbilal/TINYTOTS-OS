-- Fixed blog category column (dropdown values enforced in app + CHECK).

alter table public.blog_posts
  add column if not exists category text;

alter table public.blog_posts
  drop constraint if exists blog_posts_category_check;

alter table public.blog_posts
  add constraint blog_posts_category_check
  check (
    category is null
    or category in (
      'Parenting Tips',
      'Sizing & Fit',
      'Policies, Explained Simply',
      'Behind the Scenes',
      'Brand Story'
    )
  );
