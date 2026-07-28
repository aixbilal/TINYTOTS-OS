import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { supabaseAdmin } from "@/lib/supabase-admin";
import { requireAdmin } from "@/lib/require-admin";

const createSchema = z.object({
  customer_name: z.string().min(1),
  rating: z.number().int().min(1).max(5).default(5),
  quote: z.string().min(1),
  is_published: z.boolean().default(true),
  sort_order: z.number().int().default(0),
});

export async function GET(req: NextRequest) {
  const denied = await requireAdmin(req, "canManageSettings");
  if (denied) return denied;

  const { data, error } = await supabaseAdmin
    .from("testimonials")
    .select("*")
    .order("sort_order", { ascending: true })
    .order("created_at", { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ testimonials: data });
}

export async function POST(req: NextRequest) {
  const denied = await requireAdmin(req, "canManageSettings");
  if (denied) return denied;

  const parsed = createSchema.safeParse(await req.json());
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues.map((i) => i.message).join(", ") }, { status: 400 });
  }

  const { data, error } = await supabaseAdmin.from("testimonials").insert(parsed.data).select().single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ testimonial: data });
}
