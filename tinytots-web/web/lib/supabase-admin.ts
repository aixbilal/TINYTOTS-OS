import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { forceIpv4Outbound } from "@/lib/force-ipv4";

// Force IPv4 for all outbound network requests on a real Node.js server
// (fixes ~20-30s IPv6 "happy eyeballs" hangs). No-op on Cloudflare Workers,
// where the runtime owns outbound connections. See lib/force-ipv4.ts.
void forceIpv4Outbound();

// SERVER-ONLY. Never import this in a "use client" component or expose this
// key to the browser — it bypasses Row Level Security entirely.
//
// The real client is created lazily on first use. `next build` / the
// OpenNext build collect every API route's module graph, which imports this
// file; doing the env check + createClient() at module scope made the build
// require SUPABASE_SERVICE_ROLE_KEY (a runtime secret). The secret is now
// read and validated only when a server handler actually touches the client
// at runtime — the public URL/anon key stay the only build-time inputs.
let cachedClient: SupabaseClient | null = null;

function getSupabaseAdmin(): SupabaseClient {
  if (cachedClient) return cachedClient;

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !serviceRoleKey) {
    throw new Error("Missing Supabase service role environment variables");
  }

  cachedClient = createClient(supabaseUrl, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
  return cachedClient;
}

// A thin proxy that defers client creation until a property is actually
// read, so every existing `supabaseAdmin.from(...)` / `.storage` / `.auth`
// call site keeps working unchanged, but merely importing this module does
// not construct the client or require the service-role key.
export const supabaseAdmin: SupabaseClient = new Proxy({} as SupabaseClient, {
  get(_target, prop, receiver) {
    const real = getSupabaseAdmin();
    const value = Reflect.get(real, prop, receiver);
    return typeof value === "function" ? value.bind(real) : value;
  },
});
