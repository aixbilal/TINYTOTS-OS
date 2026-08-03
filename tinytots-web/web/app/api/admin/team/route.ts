import { apiErrorResponse } from "@/lib/api-error";
import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-admin";
import { requireAdmin } from "@/lib/require-admin";
import { isValidEmail, EMAIL_ERROR } from "@/lib/validate-email";

const VALID_ROLES = ["admin", "order_manager", "support", "inventory_only"] as const;

export async function GET(request: NextRequest) {
  const denied = await requireAdmin(request, "canManageTeam");
  if (denied) return denied;

  const { data, error } = await supabaseAdmin
    .from("admin_users")
    .select("id, name, email, role, is_active, created_at")
    .order("created_at", { ascending: true });

  if (error) return apiErrorResponse(error, 500, "admin/team");
  return NextResponse.json({ data }, { status: 200 });
}

// POST — creates a real Supabase Auth account for the new team member (temp password)
// AND their admin_users role row, in one step.
export async function POST(request: NextRequest) {
    const denied = await requireAdmin(request, "canManageTeam");
    if (denied) return denied;

    try {
      const body = await request.json();
      const { name, email, role } = body;
  
      if (!name || !email || !role) {
        return NextResponse.json({ error: "name, email, and role are required" }, { status: 400 });
      }
      if (!isValidEmail(String(email))) {
        return NextResponse.json({ error: EMAIL_ERROR }, { status: 400 });
      }
      if (!VALID_ROLES.includes(role)) {
        return NextResponse.json({ error: "Invalid role." }, { status: 400 });
      }

      const tempPassword = Math.random().toString(36).slice(-10) + "A1!";
  
      const { data: authUser, error: authError } = await supabaseAdmin.auth.admin.createUser({
        email: String(email).trim(),
        password: tempPassword,
        email_confirm: true,
        user_metadata: {
          is_admin_created: true,
        },
      });
  
      if (authError || !authUser?.user) {
        console.error("createUser failed — message:", authError?.message);
        console.error("createUser failed — status:", authError?.status);
      
        console.error("createUser failed — CAUSE:", authError?.cause);
        // @ts-expect-error
        console.error("createUser failed — CAUSE STACK:", authError?.cause?.stack);
        console.error("createUser failed — full object:", authError);
        return apiErrorResponse(authError ?? new Error("Failed to create login"), 500, "admin/team");
      }
  
      const { data: adminRow, error: adminError } = await supabaseAdmin
        .from("admin_users")
        .insert([{ auth_user_id: authUser.user.id, name, email, role, is_active: true }])
        .select()
        .single();
  
      if (adminError) {
        console.error("admin_users insert failed:", JSON.stringify(adminError, null, 2));
        await supabaseAdmin.auth.admin.deleteUser(authUser.user.id);
        return apiErrorResponse(adminError, 500, "admin/team");
      }
  
      return NextResponse.json({ success: true, data: adminRow, temp_password: tempPassword }, { status: 201 });
    } catch (err: any) {
      console.error("POST /api/admin/team crashed:", err);
      return apiErrorResponse(err, 500, "admin/team");
    }
  }