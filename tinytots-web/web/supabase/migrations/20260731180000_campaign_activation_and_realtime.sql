-- Enforce exclusive campaign activation and expose a minimal realtime
-- revision signal without making draft campaign rows publicly readable.

begin;

-- Keep the most recently updated active campaign and deactivate the rest
-- before adding the uniqueness guarantee.
with keeper as (
  select id
  from public.campaigns
  where is_active = true
  order by updated_at desc, id desc
  limit 1
)
update public.campaigns
set is_active = false,
    updated_at = now()
where is_active = true
  and id <> coalesce((select id from keeper), -1);

create unique index if not exists campaigns_single_active_idx
  on public.campaigns (is_active)
  where is_active = true;

create or replace function public.activate_campaign(target_campaign_id bigint)
returns setof public.campaigns
language plpgsql
security definer
set search_path = public
as $$
declare
  activated public.campaigns%rowtype;
begin
  -- Serialize concurrent activation attempts before changing either row.
  perform pg_advisory_xact_lock(hashtext('tinytots_campaign_activation'));

  if not exists (select 1 from public.campaigns where id = target_campaign_id) then
    raise exception 'Campaign not found';
  end if;

  update public.campaigns
  set is_active = false,
      updated_at = now()
  where is_active = true
    and id <> target_campaign_id;

  update public.campaigns
  set is_active = true,
      scheduled_at = null,
      updated_at = now()
  where id = target_campaign_id
  returning * into activated;

  return next activated;
end;
$$;

revoke all on function public.activate_campaign(bigint) from public;
grant execute on function public.activate_campaign(bigint) to service_role;

create table if not exists public.signage_revision (
  id integer primary key default 1 check (id = 1),
  revision bigint not null default 1,
  updated_at timestamptz not null default now()
);

insert into public.signage_revision (id, revision)
values (1, 1)
on conflict (id) do nothing;

alter table public.signage_revision enable row level security;

drop policy if exists "Public can read signage revision" on public.signage_revision;
create policy "Public can read signage revision"
  on public.signage_revision
  for select
  using (true);

create or replace function public.bump_signage_revision()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  update public.signage_revision
  set revision = revision + 1,
      updated_at = now()
  where id = 1;
  return null;
end;
$$;

drop trigger if exists campaigns_bump_signage_revision on public.campaigns;
create trigger campaigns_bump_signage_revision
after insert or update or delete on public.campaigns
for each statement execute function public.bump_signage_revision();

drop trigger if exists products_bump_signage_revision on public.products;
create trigger products_bump_signage_revision
after insert or update or delete on public.products
for each statement execute function public.bump_signage_revision();

drop trigger if exists testimonials_bump_signage_revision on public.testimonials;
create trigger testimonials_bump_signage_revision
after insert or update or delete on public.testimonials
for each statement execute function public.bump_signage_revision();

drop trigger if exists trust_items_bump_signage_revision on public.trust_items;
create trigger trust_items_bump_signage_revision
after insert or update or delete on public.trust_items
for each statement execute function public.bump_signage_revision();

do $$
begin
  if not exists (
    select 1
    from pg_publication_tables
    where pubname = 'supabase_realtime'
      and schemaname = 'public'
      and tablename = 'signage_revision'
  ) then
    alter publication supabase_realtime add table public.signage_revision;
  end if;
end;
$$;

commit;
