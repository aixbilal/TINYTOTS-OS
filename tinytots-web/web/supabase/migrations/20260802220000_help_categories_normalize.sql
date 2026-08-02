-- Normalize legacy free-text help categories onto the fixed slug set.
-- Unknown / 'general' → orders (catch-all for orphaned test content).

update public.help_articles
set category = case lower(trim(category))
  when 'orders' then 'orders'
  when 'shipping' then 'shipping'
  when 'returns' then 'returns'
  when 'sizing' then 'sizing'
  when 'payments' then 'payments'
  when 'account' then 'account'
  when 'general' then 'orders'
  when 'order' then 'orders'
  when 'shipping & delivery' then 'shipping'
  when 'shipping and delivery' then 'shipping'
  when 'delivery' then 'shipping'
  when 'returns & exchanges' then 'returns'
  when 'returns and exchanges' then 'returns'
  when 'return' then 'returns'
  when 'exchange' then 'returns'
  when 'exchanges' then 'returns'
  when 'size' then 'sizing'
  when 'sizes' then 'sizing'
  when 'payment' then 'payments'
  when 'accounts' then 'account'
  else 'orders'
end
where category is distinct from case lower(trim(category))
  when 'orders' then 'orders'
  when 'shipping' then 'shipping'
  when 'returns' then 'returns'
  when 'sizing' then 'sizing'
  when 'payments' then 'payments'
  when 'account' then 'account'
  when 'general' then 'orders'
  when 'order' then 'orders'
  when 'shipping & delivery' then 'shipping'
  when 'shipping and delivery' then 'shipping'
  when 'delivery' then 'shipping'
  when 'returns & exchanges' then 'returns'
  when 'returns and exchanges' then 'returns'
  when 'return' then 'returns'
  when 'exchange' then 'returns'
  when 'exchanges' then 'returns'
  when 'size' then 'sizing'
  when 'sizes' then 'sizing'
  when 'payment' then 'payments'
  when 'accounts' then 'account'
  else 'orders'
end;

alter table public.help_articles
  alter column category set default 'orders';

alter table public.help_articles
  drop constraint if exists help_articles_category_check;

alter table public.help_articles
  add constraint help_articles_category_check
  check (category in ('orders', 'shipping', 'returns', 'sizing', 'payments', 'account'));
