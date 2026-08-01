-- Repair activate_campaign: restore advisory lock and remove any leftover
-- reference to dropped column scheduled_at (root cause of activate failures).

begin;

create or replace function public.activate_campaign(target_campaign_id bigint)
returns setof public.campaigns
language plpgsql
security definer
set search_path = public
as $$
declare
  activated public.campaigns%rowtype;
begin
  -- Serialize concurrent activation attempts.
  perform pg_advisory_xact_lock(hashtext('tinytots_campaign_activation'));

  if not exists (select 1 from public.campaigns where id = target_campaign_id) then
    raise exception 'Campaign not found';
  end if;

  -- Deactivate every other live campaign first (single-active rule).
  update public.campaigns
  set is_active = false,
      updated_at = now()
  where is_active = true
    and id <> target_campaign_id;

  update public.campaigns
  set is_active = true,
      updated_at = now()
  where id = target_campaign_id
  returning * into activated;

  return next activated;
end;
$$;

revoke all on function public.activate_campaign(bigint) from public;
grant execute on function public.activate_campaign(bigint) to service_role;

commit;
