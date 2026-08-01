import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-admin";
import {
  normalizeBannerCrop,
  normalizeBannerFocalPoint,
  normalizeCampaignTheme,
} from "@/lib/signage-campaign";

// The TV in the shop leaves this tab open indefinitely, so this must never
// serve a stale cached response.
export const dynamic = "force-dynamic";

type CampaignRow = {
  id: number;
  updated_at: string;
  featured_selection_type: string | null;
  featured_category: string | null;
  featured_product_ids: number[] | null;
  trust_item_ids: number[] | null;
  testimonial_ids: number[] | null;
  social_links: unknown;
  footer_settings: unknown;
  theme: unknown;
  hero_banner_crop: unknown;
  hero_banner_focal_point: unknown;
  [key: string]: unknown;
};

type TestimonialRow = {
  id: number;
  customer_name: string;
  customer_image_url: string | null;
  rating: number;
  quote: string;
};

async function resolveFeaturedProducts(campaign: CampaignRow) {
  if (campaign.featured_selection_type === "category" && campaign.featured_category) {
    // Admin stores categories.slug (e.g. "pants"); products.category usually
    // stores the display name (e.g. "Pants"). Resolve slug → name first.
    const slugOrName = campaign.featured_category;
    const { data: categoryRow } = await supabaseAdmin
      .from("categories")
      .select("name, slug")
      .or(`slug.eq.${slugOrName},name.eq.${slugOrName}`)
      .maybeSingle();
    const categoryLabel = categoryRow?.name || slugOrName;

    const { data } = await supabaseAdmin
      .from("products")
      .select("id, name, image_url, category, signage_badge")
      .ilike("category", categoryLabel.trim())
      .eq("is_active", true)
      .not("image_url", "is", null)
      .order("created_at", { ascending: false })
      .limit(12);
    if (data?.length) return data;
  }

  if (campaign.featured_selection_type === "products" && campaign.featured_product_ids?.length) {
    const { data } = await supabaseAdmin
      .from("products")
      .select("id, name, image_url, category, signage_badge")
      .in("id", campaign.featured_product_ids)
      .eq("is_active", true);
    if (data?.length) {
      // Preserve the admin's chosen order — .in() doesn't guarantee it.
      const byId = new Map(data.map((product) => [product.id, product]));
      return campaign.featured_product_ids.map((id: number) => byId.get(id)).filter(Boolean);
    }
  }

  return [];
}

export async function GET(req: NextRequest) {
  // Preview mode shows a campaign without changing what is live.
  const previewId = req.nextUrl.searchParams.get("preview");

  let campaign: CampaignRow | null = null;
  if (previewId) {
    const { data } = await supabaseAdmin.from("campaigns").select("*").eq("id", previewId).maybeSingle();
    campaign = data as CampaignRow | null;
  } else {
    const { data } = await supabaseAdmin
      .from("campaigns")
      .select("*")
      .eq("is_active", true)
      .maybeSingle();
    campaign = data as CampaignRow | null;
  }

  if (!campaign) {
    return NextResponse.json({
      campaign: null,
      featured_products: [],
      trust_items: [],
      testimonials: [],
      social_links: [],
      footer_settings: null,
    });
  }

  const [featuredProducts, { data: trustItems }, { data: testimonials }] = await Promise.all([
    resolveFeaturedProducts(campaign),
    campaign.trust_item_ids?.length
      ? supabaseAdmin
          .from("trust_items")
          .select("*")
          .in("id", campaign.trust_item_ids)
          .eq("is_active", true)
          .order("sort_order", { ascending: true })
      : Promise.resolve({ data: [] }),
    campaign.testimonial_ids?.length
      ? supabaseAdmin
          .from("testimonials")
          .select("id, customer_name, customer_image_url, rating, quote")
          .in("id", campaign.testimonial_ids)
          .eq("is_published", true)
          .order("sort_order", { ascending: true })
      : Promise.resolve({ data: [] }),
  ]);

  return NextResponse.json({
    campaign: {
      _id: campaign.id,
      _updated_at: campaign.updated_at,
      collection_label: campaign.collection_label,
      heading: campaign.heading,
      subtitle: campaign.subtitle,
      description: campaign.description,
      cta_text: campaign.cta_text,
      cta_url: campaign.cta_url,
      cta_visible: campaign.cta_visible,
      hero_banner_original_url: campaign.hero_banner_original_url,
      hero_banner_preview_url: campaign.hero_banner_preview_url,
      hero_banner_crop: normalizeBannerCrop(campaign.hero_banner_crop),
      hero_banner_focal_point: normalizeBannerFocalPoint(campaign.hero_banner_focal_point),
      hero_badge: campaign.hero_badge,
      feature_list: campaign.feature_list || [],
      statistics: campaign.statistics || [],
      featured_heading: campaign.featured_heading,
      featured_description: campaign.featured_description,
      featured_button_text: campaign.featured_button_text,
      marquee_speed_seconds: campaign.marquee_speed_seconds,
      marquee_direction: campaign.marquee_direction,
      theme: normalizeCampaignTheme(campaign.theme),
    },
    featured_products: featuredProducts,
    trust_items: trustItems || [],
    testimonials: ((testimonials || []) as TestimonialRow[]).map((testimonial) => ({
      name: testimonial.customer_name,
      image_url: testimonial.customer_image_url,
      rating: testimonial.rating,
      quote: testimonial.quote,
    })),
    social_links: Array.isArray(campaign.social_links)
      ? campaign.social_links.filter(
          (link): link is Record<string, unknown> =>
            !!link && typeof link === "object" && (link as Record<string, unknown>).is_active !== false
        )
      : [],
    footer_settings: campaign.footer_settings || null,
  });
}