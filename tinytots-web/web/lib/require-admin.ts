import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { supabaseAdmin } from "@/lib/supabase-admin";
import { can, ROLE_PERMISSIONS } from "@/lib/admin-permissions";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

// Verifies the request carries a valid session AND that the session
// belongs to an active admin_users row with the required permission.
// Returns null if allowed, or a NextResponse to return immediately if not.
export async function requireAdmin(
  request: NextRequest,
  permission?: keyof typeof ROLE_PERMISSIONS["admin"]
) {
  const authHeader = request.headers.get("authorization");
  const token = authHeader?.replace("Bearer ", "");

  if (!token) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const supabaseAuth = createClient(supabaseUrl, supabaseAnonKey);
  const { data: userData, error: userError } = await supabaseAuth.auth.getUser(token);

  if (userError || !userData?.user) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const { data: adminRow, error: adminError } = await supabaseAdmin
    .from("admin_users")
    .select("role, is_active")
    .eq("auth_user_id", userData.user.id)
    .maybeSingle();

  if (adminError || !adminRow || !adminRow.is_active) {
    return NextResponse.json({ error: "Not authorized" }, { status: 403 });
  }

  if (permission && !can(adminRow.role, permission)) {
    return NextResponse.json({ error: "Not authorized" }, { status: 403 });
  }

  return null; // allowed
}