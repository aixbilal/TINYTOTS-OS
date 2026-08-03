import { apiErrorResponse } from "@/lib/api-error";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { supabaseAdmin } from "@/lib/supabase-admin";
import { requireAdmin } from "@/lib/require-admin";

const createSchema = z.object({
  image_url: z.string().min(1),
  caption: z.string().optional().default(""),
  instagram_handle: z.string().optional().default(""),
  link: z.string().optional().default(""),
  is_published: z.boolean().default(true),
  sort_order: z.number().int().default(0),
});

export async function GET(req: NextRequest) {
  const denied = await requireAdmin(req, "canManageSettings");
  if (denied) return denied;

  const { data, error } = await supabaseAdmin
    .from("ugc_posts")
    .select("*")
    .order("sort_order", { ascending: true })
    .order("created_at", { ascending: false });

  if (error) return apiErrorResponse(error, 500, "admin/ugc-posts");
  return NextResponse.json({ posts: data });
}

export async function POST(req: NextRequest) {
  const denied = await requireAdmin(req, "canManageSettings");
  if (denied) return denied;

  const parsed = createSchema.safeParse(await req.json());
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues.map((i) => i.message).join(", ") }, { status: 400 });
  }

  const { data, error } = await supabaseAdmin.from("ugc_posts").insert(parsed.data).select().single();
  if (error) return apiErrorResponse(error, 500, "admin/ugc-posts");
  return NextResponse.json({ post: data });
}
