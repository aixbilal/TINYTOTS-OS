import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-admin";
import {
  DEFAULT_ROTATION_SECONDS,
  normalizeBannerCrop,
  normalizeBannerFocalPoint,
  normalizeCampaignTheme,
} from "@/lib/signage-campaign";

export const dynamic = "force-dynamic";

type CampaignRow = {
  id: number;
  updated_at: string;
  featured_selection_type: string | null;
  featured_category: string | null;
  featured_product_ids: number[] | null;
  trust_item_ids: number[] | null;
  feature_item_ids: number[] | null;
  stat_item_ids: number[] | null;
  testimonial_ids: number[] | null;
  social_links: unknown;
  footer_settings: unknown;
  theme: unknown;
  hero_banner_crop: unknown;
  hero_banner_focal_point: unknown;
  feature_list: unknown;
  statistics: unknown;
  [key: string]: unknown;
};

type CampaignPayload = {
  campaign: Record<string, unknown> | null;
  featured_products: unknown[];
  trust_items: unknown[];
  testimonials: unknown[];
  social_links: unknown[];
  footer_settings: unknown;
};

function orderByIds<T extends { id: number }>(rows: T[] | null | undefined, ids: number[]): T[] {
  if (!rows?.length || !ids?.length) return [];
  const byId = new Map(rows.map((row) => [row.id, row]));
  return ids.map((id) => byId.get(id)).filter((row): row is T => !!row);
}

type TestimonialRow = {
  id: number;
  customer_name: string;
  customer_image_url: string | null;
  rating: number;
  quote: string;
};

async function resolveFeaturedProducts(campaign: CampaignRow) {
  if (campaign.featured_selection_type === "category" && campaign.featured_category) {
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
      const byId = new Map(data.map((product) => [product.id, product]));
      return campaign.featured_product_ids.map((id: number) => byId.get(id)).filter(Boolean);
    }
  }

  return [];
}

async function buildPayload(campaign: CampaignRow): Promise<CampaignPayload> {
  const featureIds = (campaign.feature_item_ids || []).slice(0, 3);
  const statIds = (campaign.stat_item_ids || []).slice(0, 3);

  const [featuredProducts, { data: trustItems }, { data: featureRows }, { data: statRows }, { data: testimonials }] =
    await Promise.all([
      resolveFeaturedProducts(campaign),
      campaign.trust_item_ids?.length
        ? supabaseAdmin
            .from("trust_items")
            .select("*")
            .in("id", campaign.trust_item_ids)
            .eq("is_active", true)
            .order("sort_order", { ascending: true })
        : Promise.resolve({ data: [] }),
      featureIds.length
        ? supabaseAdmin
            .from("feature_items")
            .select("id, icon, label")
            .in("id", featureIds)
            .eq("is_active", true)
        : Promise.resolve({ data: [] }),
      statIds.length
        ? supabaseAdmin
            .from("stat_items")
            .select("id, icon, value, label")
            .in("id", statIds)
            .eq("is_active", true)
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

  const resolvedFeatures = orderByIds(
    (featureRows || []) as { id: number; icon: string; label: string }[],
    featureIds
  ).map((item) => ({
    icon: item.icon,
    title: item.label,
    description: "",
  }));

  const resolvedStats = orderByIds(
    (statRows || []) as { id: number; icon: string; value: string; label: string }[],
    statIds
  ).map((item) => ({
    icon: item.icon,
    number: item.value,
    description: item.label,
  }));

  const feature_list =
    resolvedFeatures.length > 0
      ? resolvedFeatures
      : Array.isArray(campaign.feature_list)
        ? campaign.feature_list
        : [];
  const statistics =
    resolvedStats.length > 0
      ? resolvedStats
      : Array.isArray(campaign.statistics)
        ? campaign.statistics
        : [];

  return {
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
      feature_list,
      statistics,
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
  };
}

const emptyPayload = (): CampaignPayload => ({
  campaign: null,
  featured_products: [],
  trust_items: [],
  testimonials: [],
  social_links: [],
  footer_settings: null,
});

async function getRotationSeconds(): Promise<number> {
  const { data, error } = await supabaseAdmin
    .from("signage_revision")
    .select("*")
    .eq("id", 1)
    .maybeSingle();
  if (error || !data) return DEFAULT_ROTATION_SECONDS;
  const value = Number((data as { rotation_seconds?: unknown }).rotation_seconds);
  if (!Number.isFinite(value)) return DEFAULT_ROTATION_SECONDS;
  return Math.min(60, Math.max(10, Math.round(value)));
}

export async function GET(req: NextRequest) {
  const previewId = req.nextUrl.searchParams.get("preview");
  const rotation_seconds = await getRotationSeconds();

  if (previewId) {
    const { data } = await supabaseAdmin.from("campaigns").select("*").eq("id", previewId).maybeSingle();
    if (!data) {
      return NextResponse.json({ ...emptyPayload(), slides: [], rotation_seconds });
    }
    const payload = await buildPayload(data as CampaignRow);
    return NextResponse.json({ ...payload, slides: [payload], rotation_seconds });
  }

  const { data: activeRows } = await supabaseAdmin
    .from("campaigns")
    .select("*")
    .eq("is_active", true)
    .order("updated_at", { ascending: false });

  const rows = (activeRows || []) as CampaignRow[];
  if (!rows.length) {
    return NextResponse.json({ ...emptyPayload(), slides: [], rotation_seconds });
  }

  const slides = await Promise.all(rows.map((row) => buildPayload(row)));
  // Backward-compatible: `campaign` is the first slide; client rotates `slides`.
  return NextResponse.json({
    ...slides[0],
    slides,
    rotation_seconds,
  });
}
