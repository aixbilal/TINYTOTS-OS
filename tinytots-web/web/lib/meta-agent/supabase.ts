import { createClient, type SupabaseClient } from "@supabase/supabase-js";

/**
 * Server-side Supabase client for Meta Agent + WhatsApp webhook API routes.
 * Uses the Service Role Key so it can read data regardless of RLS policies.
 * This file must NEVER be imported into client-side ("use client") code.
 *
 * Returns a lazy proxy: the real client — and the SUPABASE_SERVICE_ROLE_KEY
 * check — is created on first property access. Some routes do
 * `const supabase = getMetaAgentSupabaseClient()` at module scope; deferring
 * creation this way means `next build` / the OpenNext build can collect
 * those routes without the runtime secret. The public URL / anon key stay
 * the only build-time inputs; the secret is used when a handler runs.
 */
function createMetaAgentSupabaseClient(): SupabaseClient {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !serviceRoleKey) {
    throw new Error("Supabase environment variables are not configured");
  }

  return createClient(url, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}

export function getMetaAgentSupabaseClient(): SupabaseClient {
  let real: SupabaseClient | null = null;
  const resolve = (): SupabaseClient => (real ??= createMetaAgentSupabaseClient());

  return new Proxy({} as SupabaseClient, {
    get(_target, prop, receiver) {
      const value = Reflect.get(resolve(), prop, receiver);
      return typeof value === "function" ? value.bind(real) : value;
    },
  });
}
