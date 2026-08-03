import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-admin";
import { requireAdmin } from "@/lib/require-admin";

export async function GET(request: NextRequest) {
  const denied = await requireAdmin(request, "canManageInventory");
  if (denied) return denied;

  const { data, error } = await supabaseAdmin
    .from("variants")
    .select("*, products(name, sku, cost_price, selling_price, is_active)");

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ data }, { status: 200 });
}

// POST /api/admin/inventory — add a variant to an existing product
export async function POST(request: NextRequest) {
  const denied = await requireAdmin(request, "canManageInventory");
  if (denied) return denied;

  try {
    const body = await request.json();
    const productId = Number(body.product_id);
    const price = Number(body.price);
    const stock = body.stock === undefined || body.stock === "" ? 0 : Number(body.stock);

    if (!Number.isFinite(productId) || productId <= 0) {
      return NextResponse.json({ error: "Valid product_id is required." }, { status: 400 });
    }
    if (!Number.isFinite(price) || price < 0) {
      return NextResponse.json({ error: "Price must be a non-negative number." }, { status: 400 });
    }
    if (!Number.isFinite(stock) || stock < 0 || !Number.isInteger(stock)) {
      return NextResponse.json({ error: "Stock must be a non-negative whole number." }, { status: 400 });
    }

    const { data, error } = await supabaseAdmin
      .from("variants")
      .insert([
        {
          product_id: productId,
          color: body.color || null,
          size: body.size || null,
          price,
          stock,
          reorder_level: 5,
        },
      ])
      .select();

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ data }, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }
}
