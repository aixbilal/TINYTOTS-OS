import { apiErrorResponse } from "@/lib/api-error";
import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-admin";

export const dynamic = "force-dynamic";

// Public testimonials are the exact set selected by the active campaign.
export async function GET() {
  const { data: campaign, error: campaignError } = await supabaseAdmin
    .from("campaigns")
    .select("testimonial_ids")
    .eq("is_active", true)
    .maybeSingle();
  if (campaignError) return apiErrorResponse(campaignError, 500, "testimonials");
  if (!campaign?.testimonial_ids?.length) return NextResponse.json({ testimonials: [] });

  const { data, error } = await supabaseAdmin
    .from("testimonials")
    .select("id, customer_name, customer_image_url, rating, quote")
    .in("id", campaign.testimonial_ids)
    .eq("is_published", true)
    .order("sort_order", { ascending: true })
    .order("created_at", { ascending: false });

  if (error) return apiErrorResponse(error, 500, "testimonials");
  return NextResponse.json({ testimonials: data });
}