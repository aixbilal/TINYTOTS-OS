-- SECURITY REMEDIATION BATCH A — SEC-01 (P0) + SEC-11 (P2)
-- Revoke unauthenticated / ordinary-user EXECUTE on state-changing functions.
--
-- WHY THIS REGRESSED:
--   Migrations 20260803135750 / 20260803135914 re-created restore_order_stock /
--   restore_complaint_stock. Supabase runs
--     ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT EXECUTE ON FUNCTIONS TO anon, authenticated, service_role
--   so every (re)created function is granted EXECUTE to anon + authenticated.
--   `REVOKE ... FROM PUBLIC` (used by 20260803135750) does NOT remove those
--   explicit per-role grants — anon / authenticated must be named in the REVOKE.
--
-- LEGITIMATE CALLERS (all use the service-role key — unaffected by these revokes):
--   restore_complaint_stock(bigint)  -> app/api/admin/complaints/[id]/route.ts (supabaseAdmin.rpc)
--   restore_order_stock(bigint)      -> trigger trg_restore_stock_on_cancel (runs as owner) and
--                                       nested PERFORM inside restore_complaint_stock (SECURITY DEFINER)
--   notify_whatsapp_order_webhook()  -> trigger trg_whatsapp_order_notify ONLY
--                                       (trigger firing does not require EXECUTE privilege)
--   checkout_transaction(uuid,jsonb) -> no caller found in tinytots-web or the Electron POS;
--                                       legacy. REVOKE only (not dropped) per Batch A scope.

-- restore_order_stock(bigint)
REVOKE EXECUTE ON FUNCTION public.restore_order_stock(bigint) FROM PUBLIC, anon, authenticated;
GRANT  EXECUTE ON FUNCTION public.restore_order_stock(bigint) TO service_role;

-- restore_complaint_stock(bigint)
REVOKE EXECUTE ON FUNCTION public.restore_complaint_stock(bigint) FROM PUBLIC, anon, authenticated;
GRANT  EXECUTE ON FUNCTION public.restore_complaint_stock(bigint) TO service_role;

-- notify_whatsapp_order_webhook() — trigger function; no client role should call it directly
REVOKE EXECUTE ON FUNCTION public.notify_whatsapp_order_webhook() FROM PUBLIC, anon, authenticated;

-- checkout_transaction(uuid, jsonb) — legacy POS RPC, no known caller. service_role grant left intact.
REVOKE EXECUTE ON FUNCTION public.checkout_transaction(uuid, jsonb) FROM PUBLIC, anon, authenticated;
