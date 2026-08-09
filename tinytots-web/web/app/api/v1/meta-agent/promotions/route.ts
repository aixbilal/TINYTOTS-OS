import { NextRequest, NextResponse } from "next/server";
import { verifyMetaAgentAuth } from "@/lib/meta-agent/auth";
import { getMetaAgentSupabaseClient } from "@/lib/meta-agent/supabase";

export async function GET(request: NextRequest) {
  const authError = verifyMetaAgentAuth(request);
  if (authError) return authError;

  try {
    const { searchParams } = new URL(request.url);
    const category = searchParams.get("category");

    const supabase = getMetaAgentSupabaseClient();
    const nowIso = new Date().toISOString();

    // Active discounts (product/category discounts)
    let discountsQuery = supabase
      .from("discounts")
      .select("name, discount_type, value, applies_to, category, ends_at")
      .eq("is_active", true)
      .lte("starts_at", nowIso)
      .limit(20);

    if (category) {
      discountsQuery = discountsQuery.eq("category", category);
    }

    const { data: discounts, error: discountsError } = await discountsQuery;

    if (discountsError) {
      console.error("Promotions API discounts error:", discountsError.message);
      return NextResponse.json(
        { success: false, error: "Unable to fetch promotions" },
        { status: 500 }
      );
    }

    // Filter out expired discounts (ends_at is nullable = never expires)
    const activeDiscounts = (discounts ?? []).filter(
      (d: any) => !d.ends_at || d.ends_at > nowIso
    );

    // Active campaigns (site-wide promotional banners/collections)
    const { data: campaigns, error: campaignsError } = await supabase
      .from("campaigns")
      .select("name, heading, subtitle, description, cta_text, cta_url")
      .eq("is_active", true)
      .limit(10);

    if (campaignsError) {
      console.error("Promotions API campaigns error:", campaignsError.message);
      return NextResponse.json(
        { success: false, error: "Unable to fetch promotions" },
        { status: 500 }
      );
    }

    const formattedDiscounts = activeDiscounts.map((d: any) => ({
      title: d.name,
      discount:
        d.discount_type === "percentage" ? `${d.value}%` : `Rs. ${d.value}`,
      applies_to: d.applies_to,
      category: d.category,
      expires: d.ends_at,
    }));

    const formattedCampaigns = (campaigns ?? []).map((c: any) => ({
      title: c.heading || c.name,
      description: c.description || c.subtitle,
      cta_text: c.cta_text,
      cta_url: c.cta_url,
    }));

    return NextResponse.json({
      success: true,
      promotions: formattedDiscounts,
      campaigns: formattedCampaigns,
    });
  } catch (err) {
    console.error("Promotions API unexpected error:", err);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}