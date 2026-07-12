import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

// GET /api/products/[id]
// Returns one product with all its variants.
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  const { data: product, error } = await supabase
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
      gender,
      age_bracket,
      variants (
        id,
        color,
        size,
        price,
        stock,
        reorder_level
      )
    `
    )
    .eq("id", id)
    .eq("is_active", true)
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 404 });
  }

  return NextResponse.json({ data: product }, { status: 200 });
}