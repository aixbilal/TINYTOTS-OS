import { NextResponse } from "next/server";
import { apiErrorResponse } from "@/lib/api-error";
import { supabaseAnon as supabase } from "@/lib/supabase-anon";

// GET /api/all-product-images — public, read-only. Returns every active
// product's image public URLs so the service worker can warm the
// "product-images" cache for full offline browsability (Goal B), without
// duplicating the Supabase query logic that already exists in app/page.tsx
// and app/api/products/route.ts.
export const dynamic = "force-dynamic";

export async function GET() {
  const { data, error } = await supabase
    .from("product_images")
    .select("storage_path")
    .order("product_id", { ascending: true });

  if (error) return apiErrorResponse(error, 500, "all-product-images");

  const urls = (data || []).map(
    (row) => supabase.storage.from("product-images").getPublicUrl(row.storage_path).data.publicUrl
  );

  return NextResponse.json({ urls });
}