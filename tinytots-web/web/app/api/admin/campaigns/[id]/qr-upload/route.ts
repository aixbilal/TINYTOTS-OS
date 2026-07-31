import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/require-admin";
import { supabaseAdmin } from "@/lib/supabase-admin";
import { removeUnreferencedCampaignAssets } from "@/lib/campaign-storage";

const BUCKET = "product-images";
const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp"];
const MAX_BYTES = 3 * 1024 * 1024;

async function loadCampaign(id: string) {
  return supabaseAdmin.from("campaigns").select("footer_settings").eq("id", id).maybeSingle();
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const denied = await requireAdmin(req, "canManageSettings");
  if (denied) return denied;

  const { id } = await params;
  const formData = await req.formData();
  const file = formData.get("file") as File | null;
  if (!file) return NextResponse.json({ error: "No QR image provided" }, { status: 400 });
  if (!ALLOWED_TYPES.includes(file.type)) {
    return NextResponse.json({ error: "Only JPEG, PNG, or WebP images are allowed" }, { status: 400 });
  }
  if (file.size > MAX_BYTES) {
    return NextResponse.json({ error: "QR image must be under 3MB" }, { status: 400 });
  }

  const { data: campaign, error: campaignError } = await loadCampaign(id);
  if (campaignError || !campaign) return NextResponse.json({ error: "Campaign not found" }, { status: 404 });

  const footer = (campaign.footer_settings || {}) as Record<string, unknown>;
  const oldUrl = footer.qr_code_image_url ? String(footer.qr_code_image_url) : null;
  const extension = file.type === "image/png" ? "png" : file.type === "image/webp" ? "webp" : "jpg";
  const storagePath = `campaigns/${id}/footer/qr-${Date.now()}.${extension}`;
  const { error: uploadError } = await supabaseAdmin.storage.from(BUCKET).upload(
    storagePath,
    Buffer.from(await file.arrayBuffer()),
    { contentType: file.type, upsert: false }
  );
  if (uploadError) return NextResponse.json({ error: uploadError.message }, { status: 500 });

  const { data: publicData } = supabaseAdmin.storage.from(BUCKET).getPublicUrl(storagePath);
  const footerSettings = {
    website_url: String(footer.website_url || ""),
    qr_code_image_url: publicData.publicUrl,
    qr_visible: footer.qr_visible !== false,
    scan_label: String(footer.scan_label || "Scan to Shop"),
  };
  const { data: updated, error: updateError } = await supabaseAdmin
    .from("campaigns")
    .update({ footer_settings: footerSettings, updated_at: new Date().toISOString() })
    .eq("id", id)
    .select("*")
    .single();
  if (updateError) {
    await supabaseAdmin.storage.from(BUCKET).remove([storagePath]);
    return NextResponse.json({ error: updateError.message }, { status: 500 });
  }

  await removeUnreferencedCampaignAssets([oldUrl]);
  return NextResponse.json({ campaign: updated });
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const denied = await requireAdmin(req, "canManageSettings");
  if (denied) return denied;

  const { id } = await params;
  const { data: campaign, error: campaignError } = await loadCampaign(id);
  if (campaignError || !campaign) return NextResponse.json({ error: "Campaign not found" }, { status: 404 });

  const footer = (campaign.footer_settings || {}) as Record<string, unknown>;
  const oldUrl = footer.qr_code_image_url ? String(footer.qr_code_image_url) : null;
  const { data: updated, error: updateError } = await supabaseAdmin
    .from("campaigns")
    .update({
      footer_settings: { ...footer, qr_code_image_url: null },
      updated_at: new Date().toISOString(),
    })
    .eq("id", id)
    .select("*")
    .single();
  if (updateError) return NextResponse.json({ error: updateError.message }, { status: 500 });

  await removeUnreferencedCampaignAssets([oldUrl]);
  return NextResponse.json({ campaign: updated });
}
