import { createClient } from "@supabase/supabase-js";
import { Agent, setGlobalDispatcher } from "undici";

// Force IPv4 for all outbound network requests in this Node process.
// Fixes ~20-30s hangs caused by slow IPv6 "happy eyeballs" fallback on
// networks where IPv6 is advertised but doesn't actually route properly.
setGlobalDispatcher(new Agent({ connect: { family: 4 } }));

// SERVER-ONLY. Never import this in a "use client" component or expose
// this key to the browser — it bypasses Row Level Security entirely.
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

if (!supabaseUrl || !serviceRoleKey) {
  throw new Error("Missing Supabase service role environment variables");
}

export const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});