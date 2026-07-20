import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-admin";

export async function GET() {
  const { data, error } = await supabaseAdmin
    .from("admin_users")
    .select("id, name, email, role, is_active, created_at")
    .order("created_at", { ascending: true });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ data }, { status: 200 });
}

// POST — creates a real Supabase Auth account for the new team member (temp password)
// AND their admin_users role row, in one step.
export async function POST(request: NextRequest) {
    try {
      const body = await request.json();
      const { name, email, role } = body;
  
      if (!name || !email || !role) {
        return NextResponse.json({ error: "name, email, and role are required" }, { status: 400 });
      }
  
      const tempPassword = Math.random().toString(36).slice(-10) + "A1!";
  
      const { data: authUser, error: authError } = await supabaseAdmin.auth.admin.createUser({
        email,
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
        return NextResponse.json(
          { error: authError?.message || "Failed to create login (see server terminal)" },
          { status: 500 }
        );
      }
  
      const { data: adminRow, error: adminError } = await supabaseAdmin
        .from("admin_users")
        .insert([{ auth_user_id: authUser.user.id, name, email, role, is_active: true }])
        .select()
        .single();
  
      if (adminError) {
        console.error("admin_users insert failed:", JSON.stringify(adminError, null, 2));
        await supabaseAdmin.auth.admin.deleteUser(authUser.user.id);
        return NextResponse.json({ error: adminError.message || "Failed to create admin role" }, { status: 500 });
      }
  
      return NextResponse.json({ success: true, data: adminRow, temp_password: tempPassword }, { status: 201 });
    } catch (err: any) {
      console.error("POST /api/admin/team crashed:", err);
      return NextResponse.json({ error: err?.message || "Unexpected server error" }, { status: 500 });
    }
  }