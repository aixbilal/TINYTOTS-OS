import { createClient } from '@supabase/supabase-js';

// Shared anon client — safe for client components AND server code.
// Do NOT import undici / Node built-ins here; that breaks the browser bundle.
// Node IPv4 outbound fix lives in instrumentation.ts (and supabase-admin.ts).

// Ensure these are set in your .env.local file
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error("Missing Supabase environment variables");
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
