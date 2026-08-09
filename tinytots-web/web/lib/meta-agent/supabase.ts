import { createClient } from "@supabase/supabase-js";

/**
 * Server-side Supabase client for Meta Agent API routes.
 * Uses the Service Role Key so it can read data regardless of RLS policies.
 * This file must NEVER be imported into client-side ("use client") code.
 */
export function getMetaAgentSupabaseClient() {
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