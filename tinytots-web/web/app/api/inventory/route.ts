import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

// ADD THIS GET FUNCTION
export async function GET() {
  const { data, error } = await supabase
    .from("variants")
    .select("*, products(name, sku)"); // Fetching data to display

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ data }, { status: 200 });
}

export async function POST(request: NextRequest) {
  // ... keep your existing POST code exactly as it is ...
  try {
    const body = await request.json();
    const { product_id, color, size, price, stock } = body;

    if (!product_id || price === undefined || stock === undefined) {
      return NextResponse.json(
        { error: "product_id, price, stock are required" },
        { status: 400 }
      );
    }

    const { data, error } = await supabase
      .from("variants")
      .insert([{ product_id, color, size, price, stock }])
      .select();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, data }, { status: 201 });
  } catch (err) {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }
}