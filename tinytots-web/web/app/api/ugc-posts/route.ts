import { NextResponse } from "next/server";
import { apiErrorResponse } from "@/lib/api-error";
import { supabaseAnon as supabase } from "@/lib/supabase-anon";

export const dynamic = "force-dynamic";

// GET /api/ugc-posts - public, published only.
export async function GET() {
  const { data, error } = await supabase
    .from("ugc_posts")
    .select("id, image_url, caption, instagram_handle, link")
    .eq("is_published", true)
    .order("sort_order", { ascending: true })
    .order("created_at", { ascending: false })
    .limit(12);

  if (error) return apiErrorResponse(error, 500, "ugc-posts");
  return NextResponse.json({ posts: data });
}
