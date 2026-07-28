import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

export const dynamic = "force-dynamic";

// GET /api/testimonials - public, published only (enforced by RLS anyway,
// filtered again here for clarity).
export async function GET() {
  const { data, error } = await supabase
    .from("testimonials")
    .select("id, customer_name, rating, quote")
    .eq("is_published", true)
    .order("sort_order", { ascending: true })
    .order("created_at", { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ testimonials: data });
}
