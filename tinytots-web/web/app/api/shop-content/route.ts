import { NextResponse } from "next/server";
import { apiErrorResponse } from "@/lib/api-error";
import { supabaseAnon as supabase } from "@/lib/supabase-anon";

export const dynamic = "force-dynamic";

export async function GET() {
  const { data, error } = await supabase
    .from("shop_page_content")
    .select("*")
    .eq("id", 1)
    .single();

  if (error) {
    return apiErrorResponse(error, 500, "shop-content");
  }

  return NextResponse.json({ data }, { status: 200 });
}
