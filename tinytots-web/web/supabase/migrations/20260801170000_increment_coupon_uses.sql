-- Ensure coupon limit columns exist (used by admin + checkout; may already be live).
alter table public.coupons
  add column if not exists uses_count integer not null default 0,
  add column if not exists max_uses integer,
  add column if not exists min_spend numeric(10, 2) not null default 0;

alter table public.coupons
  drop constraint if exists coupons_uses_count_nonnegative;
alter table public.coupons
  add constraint coupons_uses_count_nonnegative check (uses_count >= 0);

alter table public.coupons
  drop constraint if exists coupons_max_uses_positive;
alter table public.coupons
  add constraint coupons_max_uses_positive check (max_uses is null or max_uses > 0);

-- Atomic claim: increments only when under max_uses (or unlimited). Returns false
-- if the coupon is missing, inactive, or already at its limit — no check-then-set race.
create or replace function public.increment_coupon_uses(p_coupon_id bigint)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  updated_id bigint;
begin
  update public.coupons
  set uses_count = uses_count + 1
  where id = p_coupon_id
    and is_active = true
    and (max_uses is null or uses_count < max_uses)
  returning id into updated_id;

  return updated_id is not null;
end;
$$;

revoke all on function public.increment_coupon_uses(bigint) from public;
grant execute on function public.increment_coupon_uses(bigint) to service_role;
