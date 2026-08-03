import { apiErrorResponse } from "@/lib/api-error";
import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-admin";
import { requireAdmin } from "@/lib/require-admin";

// GET /api/admin/pages — list all editable site pages
export async function GET(req: NextRequest) {
  const denied = await requireAdmin(req, "canManagePages");
  if (denied) return denied;

  // our-story and shipping-returns use dedicated structured editors;
  // keep them out of the Quill site_pages list so they aren't mistaken
  // for the live storefront sources.
  const { data, error } = await supabaseAdmin
    .from("site_pages")
    .select("slug, title, updated_at")
    .not("slug", "in", "(our-story,shipping-returns)")
    .order("slug", { ascending: true });

  if (error) return apiErrorResponse(error, 500, "admin/pages");
  return NextResponse.json({ pages: data });
}
