import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-admin";

// PUT /api/inventory/[id] — update a single variant's price/stock/reorder_level (admin only)
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  try {
    const body = await request.json();
    const { price, stock, reorder_level, color, size } = body;

    const updates: Record<string, unknown> = {};
    if (price !== undefined) updates.price = price;
    if (stock !== undefined) {
        updates.stock = stock;
      }
    if (reorder_level !== undefined) updates.reorder_level = reorder_level;
    if (color !== undefined) updates.color = color;
    if (size !== undefined) updates.size = size;

    const { data, error } = await supabaseAdmin
      .from("variants")
      .update(updates)
      .eq("id", id)
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    return NextResponse.json({ success: true, data }, { status: 200 });
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }
}

// DELETE /api/inventory/[id] — remove a variant entirely
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const { error } = await supabaseAdmin.from("variants").delete().eq("id", id);
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json({ success: true }, { status: 200 });
}