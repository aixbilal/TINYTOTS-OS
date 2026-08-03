import { apiErrorResponse } from "@/lib/api-error";
import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-admin";
import { requireAdmin } from "@/lib/require-admin";
import {
  DEFAULT_BANNER_CROP,
  DEFAULT_BANNER_FOCAL_POINT,
  DEFAULT_CAMPAIGN_THEME,
  normalizeCampaignTheme,
} from "@/lib/signage-campaign";

// GET /api/admin/campaigns — every campaign (active or not), plus picker data.
export async function GET(req: NextRequest) {
  const denied = await requireAdmin(req, "canManageSettings");
  if (denied) return denied;

  const [
    { data: campaigns, error },
    { data: products },
    { data: categories },
    { data: trustItems },
    { data: featureItems },
    { data: statItems },
    { data: badgeItems },
    { data: testimonials },
  ] = await Promise.all([
    supabaseAdmin.from("campaigns").select("*").order("updated_at", { ascending: false }),
    supabaseAdmin
      .from("products")
      .select("id, name, image_url, category, signage_badge")
      .eq("is_active", true)
      .order("name", { ascending: true }),
    supabaseAdmin
      .from("categories")
      .select("name, slug")
      .order("display_order", { ascending: true })
      .order("name", { ascending: true }),
    supabaseAdmin
      .from("trust_items")
      .select("id, icon, heading, description, is_active")
      .order("sort_order", { ascending: true }),
    supabaseAdmin
      .from("feature_items")
      .select("id, icon, label, is_active")
      .order("sort_order", { ascending: true }),
    supabaseAdmin
      .from("stat_items")
      .select("id, icon, value, label, is_active")
      .order("sort_order", { ascending: true }),
    supabaseAdmin.from("badge_items").select("id, label, is_active").order("sort_order", { ascending: true }),
    supabaseAdmin
      .from("testimonials")
      .select("id, customer_name, customer_image_url, rating, quote, is_published")
      .order("sort_order", { ascending: true })
      .order("created_at", { ascending: false }),
  ]);

  if (error) return apiErrorResponse(error, 500, "admin/campaigns");
  return NextResponse.json({
    campaigns: campaigns || [],
    products: products || [],
    categories: categories || [],
    trust_items: trustItems || [],
    feature_items: featureItems || [],
    stat_items: statItems || [],
    badge_items: badgeItems || [],
    testimonials: testimonials || [],
  });
}

function parseCreateName(body: unknown): string | null {
  if (!body || typeof body !== "object") return null;
  const name = typeof (body as { name?: unknown }).name === "string" ? (body as { name: string }).name : "";
  const trimmed = name.trim();
  if (!trimmed || trimmed.length > 120) return null;
  return trimmed;
}

// POST /api/admin/campaigns — blank inactive campaign; palette always resets to defaults.
export async function POST(req: NextRequest) {
  const denied = await requireAdmin(req, "canManageSettings");
  if (denied) return denied;

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const name = parseCreateName(body);
  if (!name) {
    return NextResponse.json(
      { error: "Campaign name is required (1–120 characters)." },
      { status: 400 }
    );
  }

  // Explicit default palette on formation — never inherit another campaign's theme.
  const theme = normalizeCampaignTheme(DEFAULT_CAMPAIGN_THEME);

  const { data, error } = await supabaseAdmin
    .from("campaigns")
    .insert({
      name,
      is_active: false,
      collection_label: "",
      heading: "",
      subtitle: "",
      description: "",
      cta_text: "",
      cta_url: "",
      cta_visible: true,
      hero_badge: null,
      hero_banner_original_url: null,
      hero_banner_preview_url: null,
      hero_banner_crop: DEFAULT_BANNER_CROP,
      hero_banner_focal_point: DEFAULT_BANNER_FOCAL_POINT,
      feature_item_ids: [],
      stat_item_ids: [],
      trust_item_ids: [],
      testimonial_ids: [],
      featured_selection_type: "products",
      featured_category: null,
      featured_product_ids: [],
      featured_heading: "",
      featured_description: "",
      featured_button_text: "",
      social_links: [],
      footer_settings: {
        website_url: "",
        qr_code_image_url: null,
        qr_visible: true,
        scan_label: "Scan to Shop",
      },
      theme,
    })
    .select("*")
    .single();

  if (error) return apiErrorResponse(error, 500, "admin/campaigns");
  return NextResponse.json({ campaign: data });
}
