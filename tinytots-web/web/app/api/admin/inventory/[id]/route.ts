import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-admin";
import { requireAdmin } from "@/lib/require-admin";

// PUT /api/inventory/[id] — update a single variant's price/stock/reorder_level/web pricing lock (admin only)
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const denied = await requireAdmin(request, "canManageInventory");
  if (denied) return denied;

  const { id } = await params;
  try {
    const body = await request.json();
    const { price, stock, reorder_level, color, size, web_price_locked, web_round_to } = body;

    const updates: Record<string, unknown> = {};
    if (price !== undefined) {
      const n = Number(price);
      if (!Number.isFinite(n) || n < 0) {
        return NextResponse.json({ error: "Price must be a non-negative number." }, { status: 400 });
      }
      updates.price = n;
    }
    if (stock !== undefined) {
      const n = Number(stock);
      if (!Number.isFinite(n) || n < 0 || !Number.isInteger(n)) {
        return NextResponse.json(
          { error: "Stock must be a non-negative whole number." },
          { status: 400 }
        );
      }
      updates.stock = n;
    }
    if (reorder_level !== undefined) {
      const n = Number(reorder_level);
      if (!Number.isFinite(n) || n < 0 || !Number.isInteger(n)) {
        return NextResponse.json(
          { error: "Reorder level must be a non-negative whole number." },
          { status: 400 }
        );
      }
      updates.reorder_level = n;
    }
    if (color !== undefined) updates.color = color;
    if (size !== undefined) updates.size = size;

    // Coerce safely to Boolean and Number to ensure no bad types hit the database
    if (web_price_locked !== undefined) {
      updates.web_price_locked = Boolean(web_price_locked);
    }
    if (web_round_to !== undefined) {
      const n = Number(web_round_to);
      if (!Number.isFinite(n) || n < 0) {
        return NextResponse.json({ error: "Invalid web_round_to value." }, { status: 400 });
      }
      updates.web_round_to = n;
    }

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
  const denied = await requireAdmin(request, "canManageInventory");
  if (denied) return denied;

  const { id } = await params;
  const { error } = await supabaseAdmin.from("variants").delete().eq("id", id);
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json({ success: true }, { status: 200 });
}