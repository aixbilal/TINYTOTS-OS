import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import { supabaseAdmin } from "@/lib/supabase-admin";

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
      variants (
        id,
        color,
        size,
        price,
        stock
      )
    `
    )
    .eq("is_active", true)
    .order("created_at", { ascending: false });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ data: products }, { status: 200 });
}

// PUT /api/products/[id] — update product core fields (admin only)
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  try {
    const body = await request.json();
    const { name, sku, description, brand, category, image_url, gender, age_bracket } = body;

    const { data, error } = await supabaseAdmin
      .from("products")
      .update({ name, sku, description, brand, category, image_url, gender, age_bracket })
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

// DELETE /api/products/[id] — soft delete (sets is_active = false, keeps order history intact)
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  const { error } = await supabaseAdmin
    .from("products")
    .update({ is_active: false })
    .eq("id", id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json({ success: true }, { status: 200 });
}

// POST /api/products — creates a product + its variants together (admin only, called from /admin/products/new)
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { name, sku, description, brand, category, image_url, gender, age_bracket, variants } = body;

    if (!name || !sku) {
      return NextResponse.json({ error: "name and sku are required" }, { status: 400 });
    }
    if (!Array.isArray(variants) || variants.length === 0) {
      return NextResponse.json({ error: "At least one variant is required" }, { status: 400 });
    }

    const { data: product, error: productError } = await supabaseAdmin
      .from("products")
      .insert([{ name, sku, description, brand, category, image_url, gender, age_bracket, is_active: true }])
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
      stock: v.stock ?? 0,
      reorder_level: v.reorder_level ?? 5,
    }));

    const { error: variantError } = await supabaseAdmin.from("variants").insert(variantRows);

    if (variantError) {
      // Roll back the product so we don't leave an orphan with no variants
      await supabaseAdmin.from("products").delete().eq("id", product.id);
      return NextResponse.json({ error: variantError.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, data: product }, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }
}