-- Adds the "Meadow Edit / Boys / Girls" promo bento section (added to the
-- storefront homepage directly in app/page.tsx) as admin-editable fields,
-- so it isn't hardcoded content that only a code change can update.
alter table public.homepage_content
  add column if not exists meadow_image_url text not null default 'https://lh3.googleusercontent.com/aida-public/AB6AXuD8Kx1YOh37r9_tpddrRx-z8ThyZ74VSqpZ8NqUnuAkyKpMprUo6QvWwqSSsEAdqYjmB8_VspVcq243mW9a22_3h2uBkoj0HsGYa9zMowQLOW9MHk0XF5DbcrXkdkT-N_-7h5kT9AGG2BKHkZ6lR4Z-1-JuIolvhibU6NmMriHSQUJDGTJf97EnY-lHUWEAB0lC50ARUK0xVIRuln4l0asI6-ON9Q36p900XcyxhlFoKFDQGDSKpihL40rJhWsAylmx-xlFJabMaUOM',
  add column if not exists meadow_badge_text text not null default 'Spring Collection',
  add column if not exists meadow_heading text not null default 'The Meadow Edit',
  add column if not exists meadow_button_text text not null default 'Explore Collection',
  add column if not exists meadow_link text not null default '/products',
  add column if not exists boys_image_url text not null default 'https://lh3.googleusercontent.com/aida-public/AB6AXuBOxH5NNX2M4TZ_MpabUd6iR43Lqhl4mFUPL1vygsT6U1bIZ5Wap_3XSxsXwMWuTpJtQjGi1xQUQ0xlBJTfeIdLJbliy7pXKJo4yrKNaOC-9z47-0vKeKtG0yMUAieIJkIQzShvCusjWv4HMiprijPupQmRH7maK_H1bGvYeJOQPSB6-Vvc2ST4xCIh72JtiSddsb8tEqrSymHPvPcFy4cFJ4xxnkl7A9vkWZEQ12bIJVnmM-Pu-aPA1yPpjf6jsWkS9BLBw74821_i',
  add column if not exists boys_link text not null default '/products',
  add column if not exists girls_image_url text not null default 'https://lh3.googleusercontent.com/aida-public/AB6AXuAex1tG2uv7lMIPIdDrPkL8txTXP-5lNjCD9jng7kNs6OcH_Ky94n8BWlY6cuBw71fG3Y01Wk_cRUvqnae2Q0zgpo5_zC77fJXWem1322uBxd60gIILFisAPS8wpWKA21VbKHRG7-aJ41OJBfx8Za033flnWypc0wBXWIfw6Z0DtvlSFrUpW0waIQ7CT6yae7FvGXNj0ydtDn_RlUQCdvs-59xozzxbXO0S77lPanQ7IV2gjCXPsPIhHgv2Vr3i3DLgN9EgUgj0WR_s',
  add column if not exists girls_link text not null default '/products';

-- Returns portal wizard (tinytots_returns_refunds_portal reference) lets the
-- customer choose how they want refunded — needed as a real column rather
-- than folding it into the free-text message.
alter table public.complaints
  add column if not exists refund_method text;

alter table public.complaints drop constraint if exists complaints_refund_method_check;
alter table public.complaints add constraint complaints_refund_method_check
  check (refund_method is null or refund_method = any (array['voucher', 'original_payment']));