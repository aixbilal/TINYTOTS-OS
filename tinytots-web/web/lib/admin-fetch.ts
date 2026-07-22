import { supabase } from "@/lib/supabase";

// Wrapper around fetch that automatically attaches the current admin's
// auth token, so every /api/admin/* call is authenticated.
export async function adminFetch(url: string, options: RequestInit = {}) {
  const { data: { session } } = await supabase.auth.getSession();
  const headers = new Headers(options.headers);
  if (session?.access_token) {
    headers.set("Authorization", `Bearer ${session.access_token}`);
  }
  return fetch(url, { ...options, headers });
}