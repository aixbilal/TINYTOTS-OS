import { apiErrorResponse } from "@/lib/api-error";
import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-admin";

export const dynamic = "force-dynamic";

// GET /api/categories - public list, used by storefront filters and by
// admin product forms (both just need name+slug, no auth required to read).
export async function GET() {
  const { data, error } = await supabaseAdmin
    .from("categories")
    .select("id, name, slug, display_order")
    .order("display_order", { ascending: true })
    .order("name", { ascending: true });

  if (error) return apiErrorResponse(error, 500, "categories");
  return NextResponse.json({ categories: data });
}
