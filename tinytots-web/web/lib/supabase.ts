import { createBrowserClient } from "@supabase/ssr";

// Shared browser/client component client — cookie-backed sessions so
// middleware.ts can enforce the phone gate for email + Google logins.
// Do NOT import undici / Node built-ins here; that breaks the browser bundle.
// Node IPv4 outbound fix lives in instrumentation.ts (and supabase-admin.ts).

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error("Missing Supabase environment variables");
}

export const supabase = createBrowserClient(supabaseUrl, supabaseAnonKey);
