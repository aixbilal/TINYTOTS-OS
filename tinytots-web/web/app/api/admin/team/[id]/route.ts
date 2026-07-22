import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-admin";

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  try {
    const body = await request.json();
    const { role, is_active } = body;

    const updates: Record<string, unknown> = {};
    if (role !== undefined) updates.role = role;
    if (is_active !== undefined) updates.is_active = is_active;

    const { data, error } = await supabaseAdmin
      .from("admin_users")
      .update(updates)
      .eq("id", id)
      .select()
      .single();

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ success: true, data }, { status: 200 });
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }
}

// DELETE — permanently remove a team member: their admin_users row AND their auth login
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  try {
    const { data: adminRow, error: fetchError } = await supabaseAdmin
      .from("admin_users")
      .select("auth_user_id")
      .eq("id", id)
      .single();

    if (fetchError || !adminRow) {
      return NextResponse.json({ error: "Team member not found" }, { status: 404 });
    }

    const { error: deleteRowError } = await supabaseAdmin
      .from("admin_users")
      .delete()
      .eq("id", id);

    if (deleteRowError) {
      return NextResponse.json({ error: "Failed to remove team member" }, { status: 500 });
    }

    // Also remove their Supabase Auth login so they can't sign in at all
    if (adminRow.auth_user_id) {
      const { error: deleteAuthError } = await supabaseAdmin.auth.admin.deleteUser(
        adminRow.auth_user_id
      );
      if (deleteAuthError) {
        console.error("Auth user delete failed (admin_users row already removed):", deleteAuthError);
      }
    }

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (err) {
    console.error("DELETE /api/admin/team/[id] crashed:", err);
    return NextResponse.json({ error: "Unexpected server error" }, { status: 500 });
  }
}