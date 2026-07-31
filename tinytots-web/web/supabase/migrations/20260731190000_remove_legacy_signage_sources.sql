begin;

create or replace function public.activate_campaign(target_campaign_id bigint)
returns setof public.campaigns
language plpgsql
security definer
set search_path = public
as $$
begin
  if not exists (select 1 from public.campaigns where id = target_campaign_id) then
    raise exception 'Campaign % does not exist', target_campaign_id;
  end if;

  update public.campaigns
  set is_active = false,
      updated_at = now()
  where is_active = true
    and id <> target_campaign_id;

  return query
  update public.campaigns
  set is_active = true,
      updated_at = now()
  where id = target_campaign_id
  returning *;
end;
$$;

revoke all on function public.activate_campaign(bigint) from public;
grant execute on function public.activate_campaign(bigint) to service_role;

alter table public.campaigns
  drop column if exists scheduled_at,
  drop column if exists rotation_seconds,
  drop column if exists hero_mode,
  drop column if exists hero_banner_image,
  drop column if exists hero_product_image,
  drop column if exists lifestyle_image;

drop table if exists public.signage_bento_banners cascade;
drop table if exists public.signage_marquee_words cascade;
drop table if exists public.signage_content cascade;
drop table if exists public.social_links cascade;
drop table if exists public.footer_settings cascade;

create or replace function public.remove_deleted_campaign_content_reference()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if tg_table_name = 'testimonials' then
    update public.campaigns
    set testimonial_ids = array_remove(testimonial_ids, old.id),
        updated_at = now()
    where old.id = any(testimonial_ids);
  elsif tg_table_name = 'trust_items' then
    update public.campaigns
    set trust_item_ids = array_remove(trust_item_ids, old.id),
        updated_at = now()
    where old.id = any(trust_item_ids);
  end if;
  return old;
end;
$$;

drop trigger if exists remove_deleted_testimonial_campaign_reference on public.testimonials;
create trigger remove_deleted_testimonial_campaign_reference
after delete on public.testimonials
for each row execute function public.remove_deleted_campaign_content_reference();

drop trigger if exists remove_deleted_trust_item_campaign_reference on public.trust_items;
create trigger remove_deleted_trust_item_campaign_reference
after delete on public.trust_items
for each row execute function public.remove_deleted_campaign_content_reference();

commit;
