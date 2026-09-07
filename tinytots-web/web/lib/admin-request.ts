import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { supabaseAdmin } from "@/lib/supabase-admin";
import { forceIpv4Outbound } from "@/lib/force-ipv4";

void forceIpv4Outbound();

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export type AdminContext = {
  authUserId: string;
  role: string;
};

/**
 * Like requireAdmin(), but returns the resolved admin identity on success so
 * routes that need to attribute a row to the acting admin (e.g. push
 * subscriptions) don't have to re-do the token dance.
 *
 * Returns either { context } (allowed) or { response } (send it back as-is).
 */
export async function getAdminContext(
  request: NextRequest
): Promise<{ context: AdminContext } | { response: NextResponse }> {
  const token = request.headers.get("authorization")?.replace(/^Bearer\s+/i, "").trim();
  if (!token) {
    return { response: NextResponse.json({ error: "Not authenticated" }, { status: 401 }) };
  }

  const supabaseAuth = createClient(supabaseUrl, supabaseAnonKey);
  const { data: userData, error: userError } = await supabaseAuth.auth.getUser(token);
  if (userError || !userData?.user) {
    return { response: NextResponse.json({ error: "Not authenticated" }, { status: 401 }) };
  }

  const { data: adminRow, error: adminError } = await supabaseAdmin
    .from("admin_users")
    .select("role, is_active")
    .eq("auth_user_id", userData.user.id)
    .maybeSingle();

  if (adminError || !adminRow || !adminRow.is_active) {
    return { response: NextResponse.json({ error: "Not authorized" }, { status: 403 }) };
  }

  return { context: { authUserId: userData.user.id, role: adminRow.role as string } };
}
