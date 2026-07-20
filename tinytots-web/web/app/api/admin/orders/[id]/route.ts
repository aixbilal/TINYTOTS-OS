import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-admin";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  const { data: order, error: orderError } = await supabaseAdmin
    .from("orders")
    .select("*, customers(full_name, phone, email)")
    .eq("id", id)
    .single();

  if (orderError) return NextResponse.json({ error: orderError.message }, { status: 404 });

  const { data: items, error: itemsError } = await supabaseAdmin
    .from("order_items")
    .select("id, quantity, unit_price, line_total, variants(id, color, size, products(name, sku))")
    .eq("order_id", id);

  if (itemsError) return NextResponse.json({ error: itemsError.message }, { status: 500 });

  return NextResponse.json({ data: { ...order, items } }, { status: 200 });
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
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

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ success: true, data }, { status: 200 });
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }
}