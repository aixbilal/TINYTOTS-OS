import { apiErrorResponse } from "@/lib/api-error";
import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-admin";
import { requireAdmin } from "@/lib/require-admin";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const denied = await requireAdmin(request, "canManageOrders");
  if (denied) return denied;

  const { id } = await params;

  const { data: order, error: orderError } = await supabaseAdmin
    .from("orders")
    .select("*, customers(full_name, phone, email)")
    .eq("id", id)
    .single();

  if (orderError) return apiErrorResponse(orderError, 404, "admin/orders/[id]");

  const { data: items, error: itemsError } = await supabaseAdmin
    .from("order_items")
    .select("id, quantity, unit_price, line_total, variants(id, color, size, products(name, sku))")
    .eq("order_id", id);

  if (itemsError) return apiErrorResponse(itemsError, 500, "admin/orders/[id]");

  return NextResponse.json({ data: { ...order, items } }, { status: 200 });
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const denied = await requireAdmin(request, "canManageOrders");
  if (denied) return denied;

  const { id } = await params;
  try {
    const body = await request.json();
    const { status, cod_token_paid } = body;

    const updates: Record<string, unknown> = {};
    if (status !== undefined) updates.status = status;
    if (cod_token_paid !== undefined) updates.cod_token_paid = cod_token_paid;
    updates.updated_at = new Date().toISOString();

    const { data, error } = await supabaseAdmin
      .from("orders")
      .update(updates)
      .eq("id", id)
      .select()
      .single();

    if (error) return apiErrorResponse(error, 500, "admin/orders/[id]");
    return NextResponse.json({ success: true, data }, { status: 200 });
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }
}