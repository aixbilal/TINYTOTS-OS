import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-admin";
import { requireAdmin } from "@/lib/require-admin";

// GET /api/admin/complaints - list all complaints, newest first
export async function GET(req: NextRequest) {
  const denied = await requireAdmin(req, "canHandleComplaints");
  if (denied) return denied;

  const { data, error } = await supabaseAdmin
    .from("complaints")
    .select(
      `
      id,
      order_id,
      reporter_name,
      reporter_phone,
      type,
      message,
      status,
      resolved_at,
      created_at,
      customer:customers(id, full_name, phone),
      order:orders(id, order_number)
    `
    )
    .order("created_at", { ascending: false });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ complaints: data });
}

// PATCH /api/admin/complaints - update status (open / in_progress / resolved)
export async function PATCH(req: NextRequest) {
  const denied = await requireAdmin(req, "canHandleComplaints");
  if (denied) return denied;

  try {
    const body = await req.json();
    const { id, status } = body;

    if (!id || !status) {
      return NextResponse.json({ error: "id and status are required" }, { status: 400 });
    }
    if (!["open", "in_progress", "resolved"].includes(status)) {
      return NextResponse.json({ error: "Invalid status" }, { status: 400 });
    }

    const { data: complaint, error } = await supabaseAdmin
      .from("complaints")
      .update({
        status,
        resolved_at: status === "resolved" ? new Date().toISOString() : null,
      })
      .eq("id", id)
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ complaint });
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message || "Failed to update complaint" },
      { status: 500 }
    );
  }
}