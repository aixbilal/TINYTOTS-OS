import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-admin";
import { requireAdmin } from "@/lib/require-admin";

const VALID_STATUSES = ["open", "in_progress", "resolved", "approved", "rejected", "refunded", "exchanged"];

// GET /api/admin/complaints/[id] - full detail: the complaint, its selected
// order items (for returns), plus the customer's other orders and other
// complaints, for context.
export async function GET(
    req: NextRequest,
    context: { params: Promise<{ id: string }> } | { params: { id: string } }
  ) {
    const denied = await requireAdmin(req, "canHandleComplaints");
    if (denied) return denied;
  
    const params = await (context.params as any);
    const id = params.id;
  
    const { data: complaint, error } = await supabaseAdmin
      .from("complaints")
      .select(
      `
      id,
      order_id,
      customer_id,
      reporter_name,
      reporter_phone,
      type,
      message,
      status,
      admin_notes,
      photo_url,
      order_item_ids,
      resolved_at,
      created_at,
      customer:customers(id, full_name, phone, email, orders_count),
      order:orders(id, order_number, total, status, created_at)
    `
    )
    .eq("id", id)
    .single();

  if (error || !complaint) {
    return NextResponse.json({ error: "Complaint not found" }, { status: 404 });
  }

  let otherOrders: any[] = [];
  let otherComplaints: any[] = [];
  let selectedItems: any[] = [];

  if (complaint.order_item_ids && complaint.order_item_ids.length > 0) {
    const { data: items } = await supabaseAdmin
      .from("order_items")
      .select("id, quantity, unit_price, variant:variants(id, color, size, product:products(name))")
      .in("id", complaint.order_item_ids);
    selectedItems = items || [];
  }

  if (complaint.customer_id) {
    const { data: orders } = await supabaseAdmin
      .from("orders")
      .select("id, order_number, total, status, created_at")
      .eq("customer_id", complaint.customer_id)
      .order("created_at", { ascending: false })
      .limit(5);
    otherOrders = orders || [];

    const { data: complaints } = await supabaseAdmin
      .from("complaints")
      .select("id, type, status, message, created_at")
      .eq("customer_id", complaint.customer_id)
      .neq("id", complaint.id)
      .order("created_at", { ascending: false })
      .limit(5);
    otherComplaints = complaints || [];
  }

  return NextResponse.json({ complaint, otherOrders, otherComplaints, selectedItems });
}

// PATCH /api/admin/complaints/[id] - update status and/or admin notes
export async function PATCH(
    req: NextRequest,
    context: { params: Promise<{ id: string }> } | { params: { id: string } }
  ) {
    const denied = await requireAdmin(req, "canHandleComplaints");
    if (denied) return denied;
  
    try {
      const params = await (context.params as any);
      const body = await req.json();
    const { status, admin_notes } = body;

    const updates: Record<string, any> = {};
    if (status) {
      if (!VALID_STATUSES.includes(status)) {
        return NextResponse.json({ error: "Invalid status" }, { status: 400 });
      }
      updates.status = status;
      const isTerminal = ["resolved", "refunded", "exchanged", "rejected"].includes(status);
      updates.resolved_at = isTerminal ? new Date().toISOString() : null;
    }
    if (admin_notes !== undefined) {
      updates.admin_notes = admin_notes;
    }

    const { data: complaint, error } = await supabaseAdmin
      .from("complaints")
      .update(updates)
      .eq("id", params.id)
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