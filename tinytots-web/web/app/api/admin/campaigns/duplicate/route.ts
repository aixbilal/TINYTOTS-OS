import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-admin";
import { requireAdmin } from "@/lib/require-admin";
import {
  DEFAULT_BANNER_CROP,
  DEFAULT_BANNER_FOCAL_POINT,
  normalizeBannerCrop,
  normalizeBannerFocalPoint,
  normalizeCampaignTheme,
} from "@/lib/signage-campaign";

/**
 * POST { id } — clone a campaign into a new inactive row.
 * Copies fields explicitly so unknown/generated columns cannot break the insert.
 */
export async function POST(req: NextRequest) {
  const denied = await requireAdmin(req, "canManageSettings");
  if (denied) return denied;

  let body: { id?: unknown };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const campaignId = Number(body.id);
  if (!Number.isSafeInteger(campaignId) || campaignId <= 0) {
    return NextResponse.json({ error: "Valid campaign id is required" }, { status: 400 });
  }

  const { data: original, error: fetchError } = await supabaseAdmin
    .from("campaigns")
    .select("*")
    .eq("id", campaignId)
    .maybeSingle();

  if (fetchError) return NextResponse.json({ error: fetchError.message }, { status: 500 });
  if (!original) return NextResponse.json({ error: "Campaign not found" }, { status: 404 });

  const insertPayload: Record<string, unknown> = {
    name: `${String(original.name || "Campaign").trim()} (Copy)`,
    is_active: false,
    collection_label: original.collection_label ?? "",
    heading: original.heading ?? "",
    subtitle: original.subtitle ?? "",
    description: original.description ?? "",
    cta_text: original.cta_text ?? "",
    cta_url: original.cta_url ?? "",
    cta_visible: original.cta_visible !== false,
    hero_badge: original.hero_badge ?? null,
    hero_banner_original_url: original.hero_banner_original_url ?? null,
    hero_banner_preview_url: original.hero_banner_preview_url ?? null,
    hero_banner_crop: normalizeBannerCrop(original.hero_banner_crop ?? DEFAULT_BANNER_CROP),
    hero_banner_focal_point: normalizeBannerFocalPoint(
      original.hero_banner_focal_point ?? DEFAULT_BANNER_FOCAL_POINT
    ),
    featured_heading: original.featured_heading ?? "",
    featured_description: original.featured_description ?? "",
    featured_button_text: original.featured_button_text ?? "",
    featured_selection_type: original.featured_selection_type ?? "products",
    featured_category: original.featured_category ?? null,
    featured_product_ids: Array.isArray(original.featured_product_ids)
      ? original.featured_product_ids
      : [],
    marquee_speed_seconds: original.marquee_speed_seconds ?? 45,
    marquee_direction: original.marquee_direction ?? "left",
    trust_item_ids: Array.isArray(original.trust_item_ids) ? original.trust_item_ids : [],
    testimonial_ids: Array.isArray(original.testimonial_ids) ? original.testimonial_ids : [],
    social_links: Array.isArray(original.social_links) ? original.social_links : [],
    footer_settings: original.footer_settings ?? {
      website_url: "",
      qr_code_image_url: null,
      qr_visible: true,
      scan_label: "Scan to Shop",
    },
    theme: normalizeCampaignTheme(original.theme),
  };

  // Optional pool columns — only copy if present on the source row.
  if ("feature_item_ids" in original) {
    insertPayload.feature_item_ids = Array.isArray(original.feature_item_ids)
      ? original.feature_item_ids
      : [];
  }
  if ("stat_item_ids" in original) {
    insertPayload.stat_item_ids = Array.isArray(original.stat_item_ids) ? original.stat_item_ids : [];
  }
  if ("feature_list" in original) insertPayload.feature_list = original.feature_list ?? [];
  if ("statistics" in original) insertPayload.statistics = original.statistics ?? [];
  if ("display_seconds" in original) insertPayload.display_seconds = original.display_seconds ?? 18;
  if ("heading_line1_color" in original) {
    insertPayload.heading_line1_color = original.heading_line1_color ?? null;
  }
  if ("heading_line2_color" in original) {
    insertPayload.heading_line2_color = original.heading_line2_color ?? null;
  }
  if ("schedule_enabled" in original) {
    insertPayload.schedule_enabled = original.schedule_enabled === true;
    insertPayload.schedule_start_at = original.schedule_start_at ?? null;
    insertPayload.schedule_end_at = original.schedule_end_at ?? null;
    insertPayload.schedule_days = Array.isArray(original.schedule_days) ? original.schedule_days : [];
    insertPayload.schedule_daily_start = original.schedule_daily_start ?? null;
    insertPayload.schedule_daily_end = original.schedule_daily_end ?? null;
    insertPayload.schedule_timezone = original.schedule_timezone || "Asia/Karachi";
  }
  if ("hero_badge_position" in original) {
    insertPayload.hero_badge_position = original.hero_badge_position ?? { x: 58, y: 14 };
  }
  if ("feature_list_position" in original) {
    insertPayload.feature_list_position = original.feature_list_position ?? { x: 56, y: 55 };
  }

  const { data, error } = await supabaseAdmin
    .from("campaigns")
    .insert(insertPayload)
    .select("*")
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ campaign: data });
}
