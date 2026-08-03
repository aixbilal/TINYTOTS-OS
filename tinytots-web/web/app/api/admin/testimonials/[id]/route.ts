import { apiErrorResponse } from "@/lib/api-error";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { supabaseAdmin } from "@/lib/supabase-admin";
import { requireAdmin } from "@/lib/require-admin";

const updateSchema = z.object({
  customer_name: z.string().min(1).optional(),
  customer_image_url: z.string().nullable().optional(),
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

  if (error) return apiErrorResponse(error, 500, "admin/testimonials/[id]");
  return NextResponse.json({ testimonial: data });
}

export async function DELETE(req: NextRequest, context: { params: Promise<{ id: string }> }) {
  const denied = await requireAdmin(req, "canManageSettings");
  if (denied) return denied;

  const { id } = await context.params;
  const { error } = await supabaseAdmin.from("testimonials").delete().eq("id", id);
  if (error) return apiErrorResponse(error, 500, "admin/testimonials/[id]");

  const testimonialId = Number(id);
  const { data: campaigns } = await supabaseAdmin
    .from("campaigns")
    .select("id, testimonial_ids")
    .contains("testimonial_ids", [testimonialId]);
  await Promise.all(
    (campaigns || []).map((campaign) =>
      supabaseAdmin
        .from("campaigns")
        .update({
          testimonial_ids: campaign.testimonial_ids.filter((itemId: number) => itemId !== testimonialId),
          updated_at: new Date().toISOString(),
        })
        .eq("id", campaign.id)
    )
  );

  return NextResponse.json({ ok: true });
}