import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { supabaseAdmin } from "@/lib/supabase-admin";
import { requireAdmin } from "@/lib/require-admin";

const updateSchema = z.object({
  customer_name: z.string().min(1).optional(),
  rating: z.number().int().min(1).max(5).optional(),
  quote: z.string().min(1).optional(),
  is_published: z.boolean().optional(),
  sort_order: z.number().int().optional(),
});

export async function PATCH(req: NextRequest, context: { params: Promise<{ id: string }> }) {
  const denied = await requireAdmin(req, "canManageSettings");
  if (denied) return denied;

  const { id } = await context.params;
  const parsed = updateSchema.safeParse(await req.json());
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues.map((i) => i.message).join(", ") }, { status: 400 });
  }

  const { data, error } = await supabaseAdmin
    .from("testimonials")
    .update(parsed.data)
    .eq("id", id)
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ testimonial: data });
}

export async function DELETE(req: NextRequest, context: { params: Promise<{ id: string }> }) {
  const denied = await requireAdmin(req, "canManageSettings");
  if (denied) return denied;

  const { id } = await context.params;
  const { error } = await supabaseAdmin.from("testimonials").delete().eq("id", id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
