import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-admin";
import { requireAdmin } from "@/lib/require-admin";

// PUT — end a campaign: resets discount_percent/web_discount_percent to 0 on affected variants
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const denied = await requireAdmin(request, "canManageDiscounts");
  if (denied) return denied;

  const { id } = await params;

  try {
    const { data: discountRow, error: fetchError } = await supabaseAdmin
      .from("discounts")
      .select("*")
      .eq("id", id)
      .single();

    if (fetchError || !discountRow) {
      return NextResponse.json({ error: "Discount not found" }, { status: 404 });
    }

    let targetProductIds: number[] = discountRow.product_ids || [];

    if (discountRow.applies_to === "category" && discountRow.category) {
      const { data: catProducts } = await supabaseAdmin
        .from("products")
        .select("id")
        .eq("category", discountRow.category);
      targetProductIds = (catProducts || []).map((p) => p.id);
    }

    if (targetProductIds.length > 0) {
        const { data: variantsToReset, error: fetchVariantsError } = await supabaseAdmin
          .from("variants")
          .select("id, base_price")
          .in("product_id", targetProductIds);
  
        if (fetchVariantsError) return NextResponse.json({ error: fetchVariantsError.message }, { status: 500 });
  
        const resets = (variantsToReset || []).map((v) =>
          supabaseAdmin
            .from("variants")
            .update({ discount_percent: 0, price: v.base_price || 0, web_discount_percent: 0 })
            .eq("id", v.id)
        );
  
        const results = await Promise.all(resets);
        const failed = results.find((r) => r.error);
        if (failed?.error) return NextResponse.json({ error: failed.error.message }, { status: 500 });
      }

    const { error: updateError } = await supabaseAdmin
      .from("discounts")
      .update({ is_active: false, ends_at: new Date().toISOString() })
      .eq("id", id);

    if (updateError) return NextResponse.json({ error: updateError.message }, { status: 500 });

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (err) {
    console.error("PUT /api/admin/discounts/[id] crashed:", err);
    return NextResponse.json({ error: "Unexpected server error" }, { status: 500 });
  }
}