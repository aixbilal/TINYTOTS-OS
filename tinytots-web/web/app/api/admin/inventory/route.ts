import { apiErrorResponse } from "@/lib/api-error";
import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-admin";
import { requireAdmin } from "@/lib/require-admin";
import { extractDominantColorHex } from "@/lib/extract-color";

export async function GET(request: NextRequest) {
  const denied = await requireAdmin(request, "canManageInventory");
  if (denied) return denied;

  const { data, error } = await supabaseAdmin
    .from("variants")
    .select("*, products(name, sku, cost_price, selling_price, is_active)");

  if (error) return apiErrorResponse(error, 500, "admin/inventory");
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

    // Auto-suggest a swatch hex from the product's primary photo when the
    // caller didn't supply one. Best-effort only - a failed/slow extraction
    // must never block variant creation, so this never throws.
    let colorHex: string | null = body.color_hex || null;
    if (!colorHex) {
      const { data: product } = await supabaseAdmin
        .from("products")
        .select("image_url")
        .eq("id", productId)
        .single();
      if (product?.image_url) {
        colorHex = await extractDominantColorHex(product.image_url);
      }
    }

    const { data, error } = await supabaseAdmin
      .from("variants")
      .insert([
        {
          product_id: productId,
          color: body.color || null,
          color_hex: colorHex,
          size: body.size || null,
          price,
          stock,
          reorder_level: 5,
        },
      ])
      .select();

    if (error) return apiErrorResponse(error, 500, "admin/inventory");
    return NextResponse.json({ data }, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }
}
