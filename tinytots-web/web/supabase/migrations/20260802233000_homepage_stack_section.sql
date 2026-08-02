-- Separate product selection + heading for the perspective card-stack
-- section (below Meadow/Boys/Girls), independent of the Trending Now grid.

alter table public.homepage_content
  add column if not exists stack_heading text not null default 'Trending Now',
  add column if not exists stack_selection_type text not null default 'products',
  add column if not exists stack_category text,
  add column if not exists stack_product_ids bigint[] default '{}';

do $$
begin
  if not exists (
    select 1 from pg_constraint where conname = 'homepage_content_stack_selection_type_check'
  ) then
    alter table public.homepage_content
      add constraint homepage_content_stack_selection_type_check
      check (stack_selection_type = any (array['products', 'category']));
  end if;
end $$;
