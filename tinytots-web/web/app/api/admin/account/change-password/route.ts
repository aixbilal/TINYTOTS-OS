import { NextRequest, NextResponse } from "next/server";
import { apiErrorResponse } from "@/lib/api-error";
import { createClient } from "@supabase/supabase-js";
import { supabaseAdmin } from "@/lib/supabase-admin";
import { validatePassword } from "@/lib/validate-password";
import { Agent, setGlobalDispatcher } from "undici";

setGlobalDispatcher(new Agent({ connect: { family: 4 } }));

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

/**
 * Change the signed-in admin's password.
 * Verifies the current password server-side via signInWithPassword before
 * applying the new password with the service role — never trusts the client alone.
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

  let body: { currentPassword?: string; newPassword?: string; confirmPassword?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  const currentPassword = String(body.currentPassword || "");
  const newPassword = String(body.newPassword || "");
  const confirmPassword = String(body.confirmPassword || "");

  if (!currentPassword) {
    return NextResponse.json({ error: "Current password is required." }, { status: 400 });
  }

  const policyError = validatePassword(newPassword);
  if (policyError) {
    return NextResponse.json({ error: policyError }, { status: 400 });
  }
  if (newPassword !== confirmPassword) {
    return NextResponse.json({ error: "Passwords do not match." }, { status: 400 });
  }
  if (newPassword === currentPassword) {
    return NextResponse.json(
      { error: "New password must be different from the current password." },
      { status: 400 }
    );
  }

  // Verify current password against Supabase Auth (server-side).
  const verifier = createClient(supabaseUrl, supabaseAnonKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
  const { error: verifyError } = await verifier.auth.signInWithPassword({
    email: userData.user.email,
    password: currentPassword,
  });
  // Discard the verifier session immediately — we only needed the credential check.
  await verifier.auth.signOut().catch(() => {});

  if (verifyError) {
    return NextResponse.json({ error: "Current password is incorrect." }, { status: 403 });
  }

  const { error: updateError } = await supabaseAdmin.auth.admin.updateUserById(userData.user.id, {
    password: newPassword,
  });

  if (updateError) {
    return apiErrorResponse(updateError, 500, "admin/account/change-password");
  }

  return NextResponse.json({ ok: true });
}
