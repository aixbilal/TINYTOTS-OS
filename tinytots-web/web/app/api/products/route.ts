import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

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