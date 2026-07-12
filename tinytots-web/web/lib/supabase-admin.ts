import { createClient } from "@supabase/supabase-js";

// SERVER-ONLY. Never import this in a "use client" component or expose
// this key to the browser — it bypasses Row Level Security entirely.
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

if (!supabaseUrl || !serviceRoleKey) {
  throw new Error("Missing Supabase service role environment variables");
}

export const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey);