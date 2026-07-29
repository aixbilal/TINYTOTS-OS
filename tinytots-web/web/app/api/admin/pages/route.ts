import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-admin";
import { requireAdmin } from "@/lib/require-admin";

// GET /api/admin/pages — list all editable site pages
export async function GET(req: NextRequest) {
  const denied = await requireAdmin(req, "canManagePages");
  if (denied) return denied;

  const { data, error } = await supabaseAdmin
    .from("site_pages")
    .select("slug, title, updated_at")
    .neq("slug", "our-story")
    .order("slug", { ascending: true });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ pages: data });
}
