import { apiErrorResponse } from "@/lib/api-error";
import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-admin";
import { requireAdmin } from "@/lib/require-admin";
import { sanitizeHeroSlides } from "@/lib/hero-slides";

const SELECTION_TYPE_FIELDS = [
  "trending_selection_type",
  "newarrivals_selection_type",
  "bestsellers_selection_type",
  "stack_selection_type",
  "meadow_selection_type",
  "boys_selection_type",
  "girls_selection_type",
  "new_arrivals_selection_type",
];
const CATEGORY_FIELDS = [
  "trending_category",
  "newarrivals_category",
  "bestsellers_category",
  "stack_category",
  "meadow_category",
  "boys_category",
  "girls_category",
  "new_arrivals_category",
];
const PRODUCT_ID_FIELDS = [
  "trending_product_ids",
  "newarrivals_product_ids",
  "bestsellers_product_ids",
  "stack_product_ids",
  "meadow_product_ids",
  "boys_product_ids",
  "girls_product_ids",
  "new_arrivals_product_ids",
];

export async function GET(req: NextRequest) {
  const denied = await requireAdmin(req, "canManageSettings");
  if (denied) return denied;

  const [{ data: content, error }, { data: products }, { data: categories }] = await Promise.all([
    supabaseAdmin.from("homepage_content").select("*").eq("id", 1).single(),
    supabaseAdmin
      .from("products")
      .select("id, name, image_url, category")
      .eq("is_active", true)
      .order("name", { ascending: true }),
    supabaseAdmin.from("categories").select("name, slug").order("display_order", { ascending: true }).order("name", { ascending: true }),
  ]);

  if (error) return apiErrorResponse(error, 500, "admin/homepage");
  return NextResponse.json({ content, products: products || [], categories: categories || [] });
}

export async function PATCH(req: NextRequest) {
  const denied = await requireAdmin(req, "canManageSettings");
  if (denied) return denied;

  try {
    const body = await req.json();
    const textFields = [
      "hero_image_url",
      "hero_image_url_mobile",
      "hero_video_url",
      "hero_headline",
      "hero_subtext",
      "hero_button_text",
      "hero_button_link",
      "trending_heading",
      "newarrivals_heading",
      "bestsellers_heading",
      "stack_heading",
      "usp_heading",
      "meadow_image_url",
      "meadow_badge_text",
      "meadow_heading",
      "meadow_button_text",
      "meadow_link",
      "boys_image_url",
      "boys_heading",
      "boys_button_text",
      "boys_link",
      "girls_image_url",
      "girls_heading",
      "girls_button_text",
      "girls_link",
      "new_arrivals_image_url",
      "new_arrivals_heading",
      "new_arrivals_button_text",
      "new_arrivals_link",
      "editorial_eyebrow",
      "editorial_headline",
      "editorial_body",
      "editorial_image_url",
      "editorial_cta_text",
      "editorial_cta_link",
      "lifestyle_1_eyebrow",
      "lifestyle_1_headline",
      "lifestyle_1_body",
      "lifestyle_1_image_url",
      "lifestyle_1_cta_text",
      "lifestyle_1_cta_link",
      "lifestyle_2_eyebrow",
      "lifestyle_2_headline",
      "lifestyle_2_body",
      "lifestyle_2_image_url",
      "lifestyle_2_cta_text",
      "lifestyle_2_cta_link",
      "closing_cta_image_url",
      "closing_cta_headline",
      "closing_cta_subtext",
      "closing_cta_button_text",
      "closing_cta_button_link",
    ];

    const updates: Record<string, any> = { updated_at: new Date().toISOString() };
    for (const field of textFields) {
      if (body[field] !== undefined) updates[field] = String(body[field]).trim();
    }
    for (const field of SELECTION_TYPE_FIELDS) {
      if (body[field] === "products" || body[field] === "category") updates[field] = body[field];
    }
    for (const field of CATEGORY_FIELDS) {
      if (body[field] !== undefined) updates[field] = body[field] ? String(body[field]).trim() : null;
    }
    for (const field of PRODUCT_ID_FIELDS) {
      if (Array.isArray(body[field])) updates[field] = body[field].map((id: any) => Number(id));
    }
    if (body.announcement_enabled !== undefined) {
      updates.announcement_enabled = Boolean(body.announcement_enabled);
    }
    if (body.announcement_text !== undefined) {
      updates.announcement_text = String(body.announcement_text).trim();
    }
    if (body.announcement_link !== undefined) {
      updates.announcement_link = String(body.announcement_link).trim();
    }
    if (body.announcement_style === "static" || body.announcement_style === "marquee") {
      updates.announcement_style = body.announcement_style;
    }
    if (Array.isArray(body.usp_items)) {
      updates.usp_items = body.usp_items
        .filter((item: any) => item && typeof item === "object")
        .map((item: any) => ({
          icon: String(item.icon || "star").trim(),
          title: String(item.title || "").trim(),
          description: String(item.description || "").trim(),
        }));
    }
    if (Array.isArray(body.trust_items)) {
      updates.trust_items = body.trust_items
        .filter((item: any) => item && typeof item === "object")
        .map((item: any) => ({
          icon: String(item.icon || "verified").trim(),
          label: String(item.label || "").trim(),
        }))
        .filter((item: { label: string }) => item.label.length > 0);
    }
    if (Array.isArray(body.hero_slides)) {
      updates.hero_slides = sanitizeHeroSlides(body.hero_slides);
      // Keep legacy single-hero columns in sync with slide 1 for older readers.
      const first = updates.hero_slides[0];
      if (first) {
        updates.hero_image_url = first.image_url;
        updates.hero_image_url_mobile = first.image_url_mobile;
        updates.hero_headline = first.headline;
        updates.hero_subtext = first.subtitle;
        updates.hero_button_text = first.button_text;
        updates.hero_button_link = first.button_link;
      }
    }

    const { data, error } = await supabaseAdmin
      .from("homepage_content")
      .update(updates)
      .eq("id", 1)
      .select()
      .single();

    if (error) return apiErrorResponse(error, 500, "admin/homepage");
    return NextResponse.json({ content: data });
  } catch (err: any) {
    return apiErrorResponse(err, 500, "admin/homepage");
  }
}
