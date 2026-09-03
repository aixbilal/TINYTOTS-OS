-- SECURITY REMEDIATION BATCH A (continued)
--   SEC-03  move WHATSAPP_NOTIFY_SECRET literal out of the DB function into Vault
--   SEC-02  stop anon/authenticated PostgREST from reading inactive products
--           and cost/margin columns on products / variants
--   SEC-08  block customers from editing protected columns on their own row
--   SEC-12  pin search_path on invoker trigger/helper functions (10 of 11; 1 deferred)
--
-- NOTE FOR FUTURE LOCKDOWN MIGRATIONS: a table-level `GRANT UPDATE ON public.customers`
-- or `GRANT SELECT ON public.products` re-opens SEC-08 / SEC-02. SEC-08 here is a
-- trigger (grant-proof). SEC-02 uses column-level grants — do NOT blanket re-grant.

-- =====================================================================
-- SEC-03 — WHATSAPP_NOTIFY_SECRET -> Vault (value unchanged; see report for
--          the separate manual VALUE-rotation step that also touches Vercel env)
-- =====================================================================
do $$
declare
  v_secret text;
begin
  if not exists (select 1 from vault.secrets where name = 'whatsapp_notify_secret') then
    v_secret := (regexp_match(
      pg_get_functiondef('public.notify_whatsapp_order_webhook()'::regprocedure),
      'Bearer ([a-zA-Z0-9._-]+)'
    ))[1];

    if v_secret is null or length(v_secret) < 8 then
      raise exception 'SEC-03: could not extract current WHATSAPP_NOTIFY_SECRET from function body; aborting';
    end if;

    perform vault.create_secret(
      v_secret,
      'whatsapp_notify_secret',
      'Bearer token for the orders DB webhook -> /api/v1/whatsapp-notify. '
      || 'Mirrors Vercel env WHATSAPP_NOTIFY_SECRET; rotate in BOTH places together.'
    );
  end if;
end $$;

-- Recreate the trigger function reading the secret from Vault instead of a literal.
-- Body is byte-for-byte identical to the previous version except the Authorization
-- header value. Trigger binding (trg_whatsapp_order_notify) is preserved by CREATE OR REPLACE.
create or replace function public.notify_whatsapp_order_webhook()
returns trigger
language plpgsql
security definer
set search_path to 'public'
as $function$
begin
  perform
    net.http_post(
      url := 'https://tinytots-os.vercel.app/api/v1/whatsapp-notify',
      body := jsonb_build_object(
        'type', TG_OP,
        'table', TG_TABLE_NAME,
        'schema', TG_TABLE_SCHEMA,
        'record', to_jsonb(NEW),
        'old_record', case when TG_OP = 'UPDATE' then to_jsonb(OLD) else null end
      ),
      headers := jsonb_build_object(
        'Content-Type', 'application/json',
        'Authorization', 'Bearer ' || coalesce(
          (select decrypted_secret from vault.decrypted_secrets
            where name = 'whatsapp_notify_secret' limit 1),
          ''
        )
      ),
      timeout_milliseconds := 5000
    );
  return NEW;
end;
$function$;

-- Keep the post-20260903070000 lockdown: no anon/authenticated EXECUTE.
revoke execute on function public.notify_whatsapp_order_webhook() from public, anon, authenticated;

-- =====================================================================
-- SEC-02 — products / variants: hide inactive rows and cost/margin columns
--          from the public (anon + authenticated) PostgREST roles.
--          service_role bypasses RLS and keeps full column access, so the
--          web admin API, Electron POS, sitemap and serwist manifest are
--          unaffected. Every storefront read already filters is_active = true
--          and selects an explicit column list that never includes cost_price
--          / selling_price (verified across app/ + lib/).
-- =====================================================================
alter policy "products_select" on public.products using (is_active = true);

revoke select on public.products from anon, authenticated;
grant select (
  id, name, sku, description, brand, category, created_at, is_active,
  hsn_code, unit, image_url, status, public_code, gender, age_bracket,
  supplier_id, aging_flagged, updated_at, signage_badge, related_product_ids
) on public.products to anon, authenticated;

revoke select on public.variants from anon, authenticated;
grant select (
  id, product_id, color, size, price, stock, created_at, reorder_level,
  sku, status, public_code, discount_percent, base_price, web_base_price,
  web_discount_percent, web_price, web_price_locked, web_round_to,
  is_low_stock, color_hex
) on public.variants to anon, authenticated;

-- =====================================================================
-- SEC-08 — customers: an authenticated user may only change non-sensitive
--          profile columns on their own row (RLS already scopes to the row).
--          The only client write in the web app is /account/add-phone
--          (.update({ phone })). full_name is left editable for a future
--          profile-edit feature. Everything else is blocked.
--          A trigger (not a column grant) so a future blanket
--          `GRANT UPDATE ON public.customers` cannot silently re-open it.
-- =====================================================================
create or replace function public.customers_block_protected_columns()
returns trigger
language plpgsql
security invoker
set search_path = ''
as $function$
begin
  -- Privileged / internal contexts (service_role, postgres, auth admin, nested
  -- trigger DML from orders count triggers) pass straight through.
  if current_user not in ('authenticated', 'anon') then
    return new;
  end if;

  if new.id            is distinct from old.id
     or new.auth_user_id is distinct from old.auth_user_id
     or new.orders_count is distinct from old.orders_count
     or new.referral_code is distinct from old.referral_code
     or new.email        is distinct from old.email
     or new.created_at   is distinct from old.created_at
  then
    raise exception
      'customers: updating protected columns (id, auth_user_id, orders_count, referral_code, email, created_at) is not permitted';
  end if;

  return new;
end;
$function$;

drop trigger if exists trg_customers_block_protected_columns on public.customers;
create trigger trg_customers_block_protected_columns
before update on public.customers
for each row execute function public.customers_block_protected_columns();

-- =====================================================================
-- SEC-12 — pin search_path on SECURITY INVOKER trigger/helper functions.
--          All 10 below have fully schema-qualified bodies (verified) so an
--          empty search_path is safe and closes the "role mutable search_path"
--          advisory. get_daily_summary(date) is DEFERRED: its body uses
--          unqualified table names (sales, sale_items, variants) and needs
--          qualification first; it is POS/service-role only (P3).
-- =====================================================================
alter function public.auto_fill_web_pricing()            set search_path = '';
alter function public.decrement_customer_orders_count()  set search_path = '';
alter function public.deduct_stock()                     set search_path = '';
alter function public.deduct_stock_order_item()          set search_path = '';
alter function public.enforce_max_bento_banners()        set search_path = '';
alter function public.get_low_stock_variants(integer)    set search_path = '';
alter function public.increment_customer_orders_count()  set search_path = '';
alter function public.restore_stock_on_cancel()          set search_path = '';
alter function public.restore_stock_order_item()         set search_path = '';
alter function public.set_updated_at()                   set search_path = '';
