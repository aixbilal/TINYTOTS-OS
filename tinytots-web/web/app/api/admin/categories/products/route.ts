import { apiErrorResponse } from "@/lib/api-error";
import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-admin";
import { requireAdmin } from "@/lib/require-admin";

// GET /api/admin/categories/products
// Returns every active product with its id/name/sku/category, for the
// category → product assignment UI. Kept separate from
// /api/admin/products (which requires canManageDiscounts) since this is
// gated on canManageInventory like the rest of the categories admin.
export async function GET(request: NextRequest) {
  const denied = await requireAdmin(request, "canManageInventory");
  if (denied) return denied;

  const { data, error } = await supabaseAdmin
    .from("products")
    .select("id, name, sku, category, image_url")
    .eq("is_active", true)
    .order("name", { ascending: true });

  if (error) return apiErrorResponse(error, 500, "admin/categories/products");
  return NextResponse.json({ products: data });
}

// PATCH /api/admin/categories/products
// Body: { productIds: number[], category: string | null }
// Bulk-sets products.category for the given product ids in one call.
// category: null / "" unassigns (clears the product's category).
export async function PATCH(request: NextRequest) {
  const denied = await requireAdmin(request, "canManageInventory");
  if (denied) return denied;

  try {
    const body = await request.json();
    const productIds = Array.isArray(body.productIds) ? body.productIds : [];
    const category = body.category === undefined ? undefined : (body.category || null);

    if (productIds.length === 0) {
      return NextResponse.json({ error: "productIds is required" }, { status: 400 });
    }
    if (category === undefined) {
      return NextResponse.json({ error: "category is required (use null to unassign)" }, { status: 400 });
    }

    const { data, error } = await supabaseAdmin
      .from("products")
      .update({ category })
      .in("id", productIds)
      .select("id, name, category");

    if (error) return apiErrorResponse(error, 500, "admin/categories/products");
    return NextResponse.json({ products: data });
  } catch (err: any) {
    return apiErrorResponse(err, 500, "admin/categories/products");
  }
}