import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-admin";
import { requireAdmin } from "@/lib/require-admin";
import { normalizeCampaignTheme } from "@/lib/signage-campaign";
import { removeUnreferencedCampaignAssets } from "@/lib/campaign-storage";

const EDITABLE_FIELDS = [
  "name",
  "collection_label",
  "heading",
  "subtitle",
  "description",
  "cta_text",
  "cta_url",
  "cta_visible",
  "hero_badge",
  "feature_list",
  "statistics",
  "featured_heading",
  "featured_description",
  "featured_button_text",
  "featured_selection_type",
  "featured_category",
  "featured_product_ids",
  "marquee_speed_seconds",
  "marquee_direction",
  "trust_item_ids",
  "feature_item_ids",
  "stat_item_ids",
  "testimonial_ids",
  "social_links",
  "footer_settings",
  "theme",
] as const;

function normalizeIdArray(value: unknown, max?: number): number[] {
  if (!Array.isArray(value)) return [];
  const ids = value.map(Number).filter(Number.isFinite);
  return typeof max === "number" ? ids.slice(0, max) : ids;
}

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const denied = await requireAdmin(req, "canManageSettings");
  if (denied) return denied;

  const { id } = await params;
  const { data, error } = await supabaseAdmin.from("campaigns").select("*").eq("id", id).maybeSingle();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  if (!data) return NextResponse.json({ error: "Campaign not found" }, { status: 404 });
  return NextResponse.json({ campaign: data });
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const denied = await requireAdmin(req, "canManageSettings");
  if (denied) return denied;

  const { id } = await params;
  try {
    const body = (await req.json()) as Record<string, unknown>;
    const updates: Record<string, unknown> = { updated_at: new Date().toISOString() };
    for (const field of EDITABLE_FIELDS) {
      if (field in body) updates[field] = body[field];
    }
    if ("theme" in body) updates.theme = normalizeCampaignTheme(body.theme);
    if ("trust_item_ids" in body) {
      updates.trust_item_ids = normalizeIdArray(body.trust_item_ids);
    }
    if ("feature_item_ids" in body) {
      updates.feature_item_ids = normalizeIdArray(body.feature_item_ids, 3);
    }
    if ("stat_item_ids" in body) {
      updates.stat_item_ids = normalizeIdArray(body.stat_item_ids, 3);
    }
    if ("testimonial_ids" in body) {
      updates.testimonial_ids = normalizeIdArray(body.testimonial_ids);
    }
    if ("social_links" in body) {
      updates.social_links = Array.isArray(body.social_links)
        ? body.social_links
            .filter(
              (link): link is Record<string, unknown> =>
                !!link &&
                typeof link === "object" &&
                ["instagram", "facebook", "pinterest", "tiktok"].includes(
                  String((link as Record<string, unknown>).platform)
                )
            )
            .map((link) => ({
              platform: String(link.platform),
              account_name: String(link.account_name || "").trim(),
              url: String(link.url || "").trim(),
              is_active: link.is_active !== false,
            }))
        : [];
    }
    if ("footer_settings" in body) {
      const footer = body.footer_settings as Record<string, unknown> | null;
      updates.footer_settings =
        footer && typeof footer === "object"
          ? {
              website_url: String(footer.website_url || "").trim(),
              qr_code_image_url: footer.qr_code_image_url ? String(footer.qr_code_image_url) : null,
              qr_visible: footer.qr_visible !== false,
              scan_label: String(footer.scan_label || "Scan to Shop").trim(),
            }
          : null;
    }

    const { data, error } = await supabaseAdmin
      .from("campaigns")
      .update(updates)
      .eq("id", id)
      .select("*")
      .single();

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ campaign: data });
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const denied = await requireAdmin(req, "canManageSettings");
  if (denied) return denied;

  const { id } = await params;

  // Guard against deleting the only live campaign and leaving the TV blank.
  const { data: target } = await supabaseAdmin
    .from("campaigns")
    .select("is_active, hero_banner_original_url, hero_banner_preview_url, footer_settings")
    .eq("id", id)
    .maybeSingle();
  if (target?.is_active) {
    return NextResponse.json(
      { error: "Can't delete the active campaign — activate a different one first." },
      { status: 400 }
    );
  }

  const { error } = await supabaseAdmin.from("campaigns").delete().eq("id", id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  const footer = target?.footer_settings as Record<string, unknown> | null;
  await removeUnreferencedCampaignAssets([
    target?.hero_banner_original_url || null,
    target?.hero_banner_preview_url || null,
    footer?.qr_code_image_url ? String(footer.qr_code_image_url) : null,
  ]);
  return NextResponse.json({ success: true });
}