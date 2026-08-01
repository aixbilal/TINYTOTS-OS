-- Allow multiple campaigns to be active at once for TV rotation.
-- Signage cycles every active campaign on a shared interval.

begin;

drop index if exists public.campaigns_single_active_idx;

alter table public.signage_revision
  add column if not exists rotation_seconds integer not null default 18;

alter table public.signage_revision
  drop constraint if exists signage_revision_rotation_seconds_check;

alter table public.signage_revision
  add constraint signage_revision_rotation_seconds_check
  check (rotation_seconds between 10 and 60);

update public.signage_revision
set rotation_seconds = 18
where id = 1 and (rotation_seconds is null or rotation_seconds < 10);

-- Toggle helper: mark a campaign active without forcing others off.
create or replace function public.set_campaign_active(
  target_campaign_id bigint,
  make_active boolean
)
returns setof public.campaigns
language plpgsql
security definer
set search_path = public
as $$
declare
  updated_row public.campaigns%rowtype;
begin
  perform pg_advisory_xact_lock(hashtext('tinytots_campaign_activation'));

  if not exists (select 1 from public.campaigns where id = target_campaign_id) then
    raise exception 'Campaign not found';
  end if;

  update public.campaigns
  set is_active = make_active,
      updated_at = now()
  where id = target_campaign_id
  returning * into updated_row;

  return next updated_row;
end;
$$;

revoke all on function public.set_campaign_active(bigint, boolean) from public;
grant execute on function public.set_campaign_active(bigint, boolean) to service_role;

-- Keep activate_campaign as "add to rotation" (no longer exclusive).
create or replace function public.activate_campaign(target_campaign_id bigint)
returns setof public.campaigns
language plpgsql
security definer
set search_path = public
as $$
begin
  return query select * from public.set_campaign_active(target_campaign_id, true);
end;
$$;

revoke all on function public.activate_campaign(bigint) from public;
grant execute on function public.activate_campaign(bigint) to service_role;

commit;
