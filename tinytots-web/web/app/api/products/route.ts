import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import { supabaseAdmin } from "@/lib/supabase-admin";

// Without this, Next.js can cache this route's data fetch, so newly
// uploaded images, price changes, and stock updates from the admin panel
// won't show up on the storefront grid until a full rebuild. Same root
// cause and fix as the PDP (app/products/[id]/page.tsx).
export const dynamic = "force-dynamic";

export async function GET() {
  const { data: products, error } = await supabase
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
      variants ( id, color, size, price, web_price, stock ) 
    `
    )
    .eq("is_active", true)
    .order("created_at", { ascending: false });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ data: products }, { status: 200 });
}

// POST /api/products — creates a product + its variants together (admin only, called from /admin/products/new)
export async function POST(request: Request) {
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

    const { data: product, error: productError } = await supabaseAdmin
      .from("products")
      .insert([{ name, sku, description, brand, category, image_url, gender, age_bracket, cost_price, selling_price, is_active: true }])
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