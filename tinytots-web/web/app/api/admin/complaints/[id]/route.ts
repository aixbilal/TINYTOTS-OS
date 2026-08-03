import { apiErrorResponse } from "@/lib/api-error";
import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-admin";
import { requireAdmin } from "@/lib/require-admin";
import { getSettingNumber } from "@/lib/settings";

const VALID_STATUSES = ["open", "in_progress", "resolved", "approved", "rejected", "refunded", "exchanged"];
const VALID_REFUND_METHODS = ["voucher", "original_payment", "bank_transfer"];

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
      refund_method,
      preferred_refund_method,
      voucher_id,
      resolved_at,
      created_at,
      customer:customers(id, full_name, phone, email, orders_count),
      order:orders(id, order_number, total, status, created_at),
      voucher:vouchers(id, amount, is_used, expires_at)
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
    const { status, admin_notes, refund_method } = body;

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
    if (refund_method !== undefined) {
      if (refund_method !== null && !VALID_REFUND_METHODS.includes(refund_method)) {
        return NextResponse.json({ error: "Invalid refund_method" }, { status: 400 });
      }
      updates.refund_method = refund_method;
    }

    // Issuing a voucher only makes sense when we're actually setting the
    // complaint to refunded via voucher right now.
    const shouldIssueVoucher = status === "refunded" && refund_method === "voucher";

    if (shouldIssueVoucher) {
      const { data: existing } = await supabaseAdmin
        .from("complaints")
        .select("id, customer_id, order_id, voucher_id, order_item_ids")
        .eq("id", params.id)
        .single();

      if (!existing) {
        return NextResponse.json({ error: "Complaint not found" }, { status: 404 });
      }
      if (existing.voucher_id) {
        return NextResponse.json(
          { error: "A voucher has already been issued for this complaint." },
          { status: 400 }
        );
      }
      if (!existing.customer_id) {
        return NextResponse.json(
          { error: "This report has no linked customer account — cannot issue a voucher." },
          { status: 400 }
        );
      }

      // Refund amount: sum of the returned line items if selected, else the
      // full order total.
      let amount = 0;
      if (existing.order_item_ids?.length) {
        const { data: items } = await supabaseAdmin
          .from("order_items")
          .select("quantity, unit_price")
          .in("id", existing.order_item_ids);
        amount = (items || []).reduce((sum, it: any) => sum + it.quantity * Number(it.unit_price), 0);
      } else if (existing.order_id) {
        const { data: order } = await supabaseAdmin
          .from("orders")
          .select("total")
          .eq("id", existing.order_id)
          .single();
        amount = Number(order?.total || 0);
      }

      if (amount <= 0) {
        return NextResponse.json(
          { error: "Could not determine a refund amount for this return." },
          { status: 400 }
        );
      }

      const validDays = await getSettingNumber("return_refund_voucher_valid_days");
      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + validDays);

      const { data: voucher, error: voucherError } = await supabaseAdmin
        .from("vouchers")
        .insert({
          customer_id: existing.customer_id,
          amount,
          is_used: false,
          source: "return_refund",
          expires_at: expiresAt.toISOString(),
        })
        .select()
        .single();

      if (voucherError) {
        return apiErrorResponse(voucherError, 500, "admin/complaints/[id]");
      }

      updates.voucher_id = voucher.id;
    }

    const { data: complaint, error } = await supabaseAdmin
      .from("complaints")
      .update(updates)
      .eq("id", params.id)
      .select()
      .single();

    if (error) {
      return apiErrorResponse(error, 500, "admin/complaints/[id]");
    }

    return NextResponse.json({ complaint });
  } catch (err: any) {
    return apiErrorResponse(err, 500, "admin/complaints/[id]");
  }
}