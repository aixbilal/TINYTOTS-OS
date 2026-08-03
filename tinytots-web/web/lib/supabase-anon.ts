import { createClient } from "@supabase/supabase-js";

/**
 * Server-safe anon client (RSC + Route Handlers) for public reads.
 * Does not use cookies — not for session-aware auth. Prefer
 * supabaseAdmin / requireAdmin for privileged work.
 */
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error("Missing Supabase environment variables");
}

export const supabaseAnon = createClient(supabaseUrl, supabaseAnonKey);
