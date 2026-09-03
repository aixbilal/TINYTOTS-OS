import { NextRequest, NextResponse } from "next/server";
import { apiErrorResponse } from "@/lib/api-error";
import { createClient } from "@supabase/supabase-js";
import { supabaseAdmin } from "@/lib/supabase-admin";
import { forceIpv4Outbound } from "@/lib/force-ipv4";

void forceIpv4Outbound();

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

/**
 * Disable (unenroll) an MFA factor for the signed-in admin.
 * Requires current password (server-verified). Uses the service role to
 * delete the factor so recovery is still possible if the session is only aal1
 * (e.g. lost authenticator but still knows the password).
 */
export async function POST(request: NextRequest) {
  const authHeader = request.headers.get("authorization");
  const token = authHeader?.replace("Bearer ", "");
  if (!token) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const supabaseAuth = createClient(supabaseUrl, supabaseAnonKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
  const { data: userData, error: userError } = await supabaseAuth.auth.getUser(token);
  if (userError || !userData?.user?.email) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const { data: adminRow } = await supabaseAdmin
    .from("admin_users")
    .select("id, is_active")
    .eq("auth_user_id", userData.user.id)
    .maybeSingle();

  if (!adminRow?.is_active) {
    return NextResponse.json({ error: "Not authorized" }, { status: 403 });
  }

  let body: { currentPassword?: string; factorId?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  const currentPassword = String(body.currentPassword || "");
  const factorId = String(body.factorId || "");
  if (!currentPassword) {
    return NextResponse.json({ error: "Current password is required." }, { status: 400 });
  }
  if (!factorId) {
    return NextResponse.json({ error: "Factor id is required." }, { status: 400 });
  }

  const verifier = createClient(supabaseUrl, supabaseAnonKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
  const { error: verifyError } = await verifier.auth.signInWithPassword({
    email: userData.user.email,
    password: currentPassword,
  });
  await verifier.auth.signOut().catch(() => {});

  if (verifyError) {
    return NextResponse.json({ error: "Current password is incorrect." }, { status: 403 });
  }

  const { error: deleteError } = await supabaseAdmin.auth.admin.mfa.deleteFactor({
    id: factorId,
    userId: userData.user.id,
  });

  if (deleteError) {
    return apiErrorResponse(deleteError, 500, "admin/account/mfa-disable");
  }

  return NextResponse.json({ ok: true });
}
