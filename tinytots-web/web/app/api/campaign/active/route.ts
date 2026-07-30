import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-admin";

// The TV in the shop leaves this tab open indefinitely, so this must never
// serve a stale cached response.
export const dynamic = "force-dynamic";

async function resolveFeaturedProducts(campaign: any) {
  if (campaign.featured_selection_type === "category" && campaign.featured_category) {
    const { data } = await supabaseAdmin
      .from("products")
      .select("id, name, image_url, category")
      .eq("category", campaign.featured_category)
      .eq("is_active", true)
      .not("image_url", "is", null)
      .order("created_at", { ascending: false })
      .limit(12);
    if (data?.length) return data;
  }

  if (campaign.featured_selection_type === "products" && campaign.featured_product_ids?.length) {
    const { data } = await supabaseAdmin
      .from("products")
      .select("id, name, image_url, category")
      .in("id", campaign.featured_product_ids)
      .eq("is_active", true);
    if (data?.length) {
      // Preserve the admin's chosen order — .in() doesn't guarantee it.
      const byId = new Map(data.map((p: any) => [p.id, p]));
      return campaign.featured_product_ids.map((id: number) => byId.get(id)).filter(Boolean);
    }
  }

  // Fallback: newest active products, so the marquee is never empty before
  // an admin configures this campaign's selection.
  const { data } = await supabaseAdmin
    .from("products")
    .select("id, name, image_url, category")
    .eq("is_active", true)
    .not("image_url", "is", null)
    .order("created_at", { ascending: false })
    .limit(8);
  return data || [];
}

export async function GET() {
  const { data: campaign } = await supabaseAdmin
    .from("campaigns")
    .select("*")
    .eq("is_active", true)
    .order("updated_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (!campaign) {
    return NextResponse.json({ campaign: null, featured_products: [], trust_items: [], testimonials: [], social_links: [] });
  }

  const [featuredProducts, { data: trustItems }, { data: testimonials }, { data: socialLinks }] = await Promise.all([
    resolveFeaturedProducts(campaign),
    campaign.trust_item_ids?.length
      ? supabaseAdmin.from("trust_items").select("*").in("id", campaign.trust_item_ids).eq("is_active", true)
      : supabaseAdmin.from("trust_items").select("*").eq("is_active", true).order("sort_order", { ascending: true }),
    campaign.testimonial_ids?.length
      ? supabaseAdmin
          .from("testimonials")
          .select("id, customer_name, customer_image_url, rating, quote")
          .in("id", campaign.testimonial_ids)
          .eq("is_published", true)
      : supabaseAdmin
          .from("testimonials")
          .select("id, customer_name, customer_image_url, rating, quote")
          .eq("is_published", true)
          .order("sort_order", { ascending: true })
          .order("created_at", { ascending: false })
          .limit(6),
    supabaseAdmin.from("social_links").select("*").eq("is_active", true).order("sort_order", { ascending: true }),
  ]);

  return NextResponse.json({
    campaign: {
      collection_label: campaign.collection_label,
      heading: campaign.heading,
      subtitle: campaign.subtitle,
      description: campaign.description,
      cta_text: campaign.cta_text,
      cta_url: campaign.cta_url,
      cta_visible: campaign.cta_visible,
      hero_mode: campaign.hero_mode || "separate_assets",
      hero_banner_image: campaign.hero_banner_image,
      hero_product_image: campaign.hero_product_image,
      hero_badge: campaign.hero_badge,
      lifestyle_image: campaign.lifestyle_image,
      feature_list: campaign.feature_list || [],
      statistics: campaign.statistics || [],
      featured_heading: campaign.featured_heading,
      featured_description: campaign.featured_description,
      featured_button_text: campaign.featured_button_text,
      marquee_speed_seconds: campaign.marquee_speed_seconds,
      marquee_direction: campaign.marquee_direction,
    },
    featured_products: featuredProducts,
    trust_items: trustItems || [],
    testimonials: (testimonials || []).map((t: any) => ({
      name: t.customer_name,
      image_url: t.customer_image_url,
      rating: t.rating,
      quote: t.quote,
    })),
    social_links: socialLinks || [],
  });
}