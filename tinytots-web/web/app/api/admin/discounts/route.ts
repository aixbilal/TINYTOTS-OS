import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-admin";
import { requireAdmin } from "@/lib/require-admin";

// GET — list all discount campaigns (active and ended)
export async function GET(request: NextRequest) {
  const denied = await requireAdmin(request, "canManageDiscounts");
  if (denied) return denied;

  const { data, error } = await supabaseAdmin
    .from("discounts")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ data }, { status: 200 });
}

// POST — create a campaign AND immediately apply the discount to matching variants
export async function POST(request: NextRequest) {
  const denied = await requireAdmin(request, "canManageDiscounts");
  if (denied) return denied;

  try {
    const body = await request.json();
    const { name, discount_type, value, applies_to, product_ids, category } = body;

    if (!name || !discount_type || value === undefined || !applies_to) {
      return NextResponse.json({ error: "name, discount_type, value, and applies_to are required" }, { status: 400 });
    }
    if (applies_to === "product_set" && (!product_ids || product_ids.length === 0)) {
      return NextResponse.json({ error: "product_ids required for product_set" }, { status: 400 });
    }
    if (applies_to === "category" && !category) {
      return NextResponse.json({ error: "category required for category discounts" }, { status: 400 });
    }
    if (discount_type !== "percentage") {
      return NextResponse.json({ error: "Only percentage discounts are supported on variants right now" }, { status: 400 });
    }

    // Figure out which product IDs this campaign actually covers
    let targetProductIds: number[] = [];

    if (applies_to === "single_product" || applies_to === "product_set") {
      targetProductIds = product_ids;
    } else if (applies_to === "category") {
      const { data: catProducts, error: catError } = await supabaseAdmin
        .from("products")
        .select("id")
        .eq("category", category);
      if (catError) return NextResponse.json({ error: catError.message }, { status: 500 });
      targetProductIds = (catProducts || []).map((p) => p.id);
    }

    if (targetProductIds.length === 0) {
      return NextResponse.json({ error: "No matching products found for this scope" }, { status: 400 });
    }

    // Create the campaign record (history log)
    const { data: discountRow, error: insertError } = await supabaseAdmin
      .from("discounts")
      .insert([{ name, discount_type, value, applies_to, product_ids: applies_to === "category" ? [] : targetProductIds, category: category || null, is_active: true }])
      .select()
      .single();

    if (insertError) return NextResponse.json({ error: insertError.message }, { status: 500 });

  // Fetch current base prices so we can compute discounted prices, same as the
    // existing single-product discount flow — base_price/web_base_price stay
    // untouched (that's the "original" price), price/web_price become the discounted number.
    const { data: targetVariants, error: variantsFetchError } = await supabaseAdmin
      .from("variants")
      .select("id, base_price, web_base_price")
      .in("product_id", targetProductIds);

    if (variantsFetchError) {
      await supabaseAdmin.from("discounts").delete().eq("id", discountRow.id);
      return NextResponse.json({ error: variantsFetchError.message }, { status: 500 });
    }

    const updates = (targetVariants || []).map((v) => {
      const newPrice = Math.round((v.base_price || 0) * (1 - value / 100) * 100) / 100;
      return supabaseAdmin
        .from("variants")
        .update({
          discount_percent: value,
          price: newPrice,
          web_discount_percent: value,
          // web_price is auto-recomputed by the DB trigger from web_base_price + web_discount_percent,
          // so we don't set it directly here.
        })
        .eq("id", v.id);
    });

    const results = await Promise.all(updates);
    const failed = results.find((r) => r.error);

    if (failed?.error) {
      await supabaseAdmin.from("discounts").delete().eq("id", discountRow.id);
      return NextResponse.json({ error: "Failed to apply discount to variants: " + failed.error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, data: discountRow, affected_products: targetProductIds.length }, { status: 201 });
  } catch (err) {
    console.error("POST /api/admin/discounts crashed:", err);
    return NextResponse.json({ error: "Unexpected server error" }, { status: 500 });
  }
}