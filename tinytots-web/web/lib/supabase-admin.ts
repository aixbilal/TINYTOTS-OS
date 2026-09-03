import { createClient } from "@supabase/supabase-js";
import { forceIpv4Outbound } from "@/lib/force-ipv4";

// Force IPv4 for all outbound network requests on a real Node.js server
// (fixes ~20-30s IPv6 "happy eyeballs" hangs). No-op on Cloudflare Workers,
// where the runtime owns outbound connections. See lib/force-ipv4.ts.
void forceIpv4Outbound();

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