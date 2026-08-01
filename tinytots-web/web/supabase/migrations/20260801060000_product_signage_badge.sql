-- Signage product-card badges (NEW / BEST_SELLER / LIMITED_EDITION).
-- Stored on products so any campaign featuring the product inherits the badge.

begin;

alter table public.products
  add column if not exists signage_badge text;

alter table public.products
  drop constraint if exists products_signage_badge_check;

alter table public.products
  add constraint products_signage_badge_check
  check (
    signage_badge is null
    or signage_badge in ('NEW', 'BEST_SELLER', 'LIMITED_EDITION')
  );

comment on column public.products.signage_badge is
  'Optional signage featured-card badge: NEW, BEST_SELLER, or LIMITED_EDITION.';

commit;
