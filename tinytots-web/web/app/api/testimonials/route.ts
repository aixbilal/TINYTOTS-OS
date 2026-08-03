import { apiErrorResponse } from "@/lib/api-error";
import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-admin";

export const dynamic = "force-dynamic";

// Public testimonials come from all active campaigns (multi-active rotation
// can leave more than one is_active=true — never use .single()/.maybeSingle()).
export async function GET() {
  const { data: campaigns, error: campaignError } = await supabaseAdmin
    .from("campaigns")
    .select("testimonial_ids")
    .eq("is_active", true);

  if (campaignError) return apiErrorResponse(campaignError, 500, "testimonials");

  const ids = [
    ...new Set(
      (campaigns || []).flatMap((c) =>
        Array.isArray(c.testimonial_ids) ? c.testimonial_ids : []
      )
    ),
  ];

  if (!ids.length) return NextResponse.json({ testimonials: [] });

  const { data, error } = await supabaseAdmin
    .from("testimonials")
    .select("id, customer_name, customer_image_url, rating, quote")
    .in("id", ids)
    .eq("is_published", true)
    .order("sort_order", { ascending: true })
    .order("created_at", { ascending: false });

  if (error) return apiErrorResponse(error, 500, "testimonials");
  return NextResponse.json({ testimonials: data ?? [] });
}
