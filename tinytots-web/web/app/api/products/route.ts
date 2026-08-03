import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import { supabaseAdmin } from "@/lib/supabase-admin";
import { requireAdmin } from "@/lib/require-admin";
import { normalizeQuillHtml } from "@/lib/html-text";

// Without this, Next.js can cache this route's data fetch, so newly
// uploaded images, price changes, and stock updates from the admin panel
// won't show up on the storefront grid until a full rebuild. Same root
// cause and fix as the PDP (app/products/[id]/page.tsx).
export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const idsParam = searchParams.get("ids");
  const genderParam = (searchParams.get("gender") || "").trim().toLowerCase();
  const genderFilter =
    genderParam === "boy" || genderParam === "girl" || genderParam === "unisex"
      ? genderParam
      : null;

  let query = supabase
    .from("products")
    .select(
      `
      id,
      name,
      sku,
      description,
      brand,
      category,
      image_url,
      product_images ( storage_path, is_primary, sort_order ),
      variants ( id, color, size, price, web_price, stock ) 
    `
    )
    .eq("is_active", true);

  if (idsParam) {
    const ids = idsParam.split(",").map((id) => Number(id)).filter((id) => Number.isFinite(id));
    if (ids.length === 0) return NextResponse.json({ data: [] }, { status: 200 });
    query = query.in("id", ids);
  } else {
    query = query.order("created_at", { ascending: false });
  }

  if (genderFilter) {
    query = query.eq("gender", genderFilter);
  }

  const { data: rawProducts, error } = await query;

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // Pick a non-primary gallery image (lowest sort_order) to power the
  // hover-flip effect on product cards, and drop the raw join from the
  // response shape callers already rely on.
  const products = (rawProducts || []).map((p: any) => {
    const gallery = (p.product_images || [])
      .filter((img: any) => !img.is_primary)
      .sort((a: any, b: any) => a.sort_order - b.sort_order);
    const secondary = gallery[0]
      ? supabase.storage.from("product-images").getPublicUrl(gallery[0].storage_path).data.publicUrl
      : null;
    const { product_images, ...rest } = p;
    return { ...rest, secondary_image_url: secondary };
  });

  // Preserve the admin-chosen order when filtering by explicit ids.
  if (idsParam && products) {
    const ids = idsParam.split(",").map((id) => Number(id));
    const byId = new Map(products.map((p: any) => [p.id, p]));
    return NextResponse.json({ data: ids.map((id) => byId.get(id)).filter(Boolean) }, { status: 200 });
  }

  return NextResponse.json({ data: products }, { status: 200 });
}

// POST /api/products — creates a product + its variants together (admin only, called from /admin/products/new)
export async function POST(request: NextRequest) {
  const denied = await requireAdmin(request, "canManageInventory");
  if (denied) return denied;

  try {
    const body = await request.json();
    const {
      name, sku, description, brand, category, image_url, gender, age_bracket,
      variants, cost_price, selling_price,
    } = body;

    if (!name || !sku) {
      return NextResponse.json({ error: "name and sku are required" }, { status: 400 });
    }
    if (!Array.isArray(variants) || variants.length === 0) {
      return NextResponse.json({ error: "At least one variant is required" }, { status: 400 });
    }

    const cleanDescription =
      description == null || description === ""
        ? description
        : normalizeQuillHtml(String(description));

    const { data: product, error: productError } = await supabaseAdmin
      .from("products")
      .insert([{ name, sku, description: cleanDescription, brand, category, image_url, gender, age_bracket, cost_price, selling_price, is_active: true }])
      .select()
      .single();

    if (productError) {
      return NextResponse.json({ error: productError.message }, { status: 500 });
    }

    const variantRows = variants.map((v: any) => ({
      product_id: product.id,
      color: v.color || null,
      size: v.size || null,
      price: v.price,
      base_price: v.base_price ?? null,
      discount_percent: v.discount_percent ?? 0,
      cost_price: v.cost_price ?? 0,
      web_base_price: v.web_base_price ?? null,
      web_discount_percent: v.web_discount_percent ?? 0,
      web_price: v.web_price,
      stock: v.stock ?? 0,
      reorder_level: v.reorder_level ?? 5,
    }));

    const { error: variantError } = await supabaseAdmin.from("variants").insert(variantRows);

    if (variantError) {
      await supabaseAdmin.from("products").delete().eq("id", product.id);
      return NextResponse.json({ error: variantError.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, data: product }, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }
}