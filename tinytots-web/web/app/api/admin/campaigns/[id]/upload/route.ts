import { apiErrorResponse } from "@/lib/api-error";
import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-admin";
import { requireAdmin } from "@/lib/require-admin";
import { normalizeBannerCrop, normalizeBannerFocalPoint } from "@/lib/signage-campaign";
import { removeUnreferencedCampaignAssets } from "@/lib/campaign-storage";

// Reuses the existing product-images bucket (already public, already sized
// and policy-configured) under a campaigns/ prefix, rather than provisioning
// a brand new bucket + storage policies for what is still just "an image".
const BUCKET = "product-images";
const MAX_FILE_BYTES = 10 * 1024 * 1024;
const MAX_PREVIEW_BYTES = 5 * 1024 * 1024;
const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp"];

function publicUrlFor(storagePath: string) {
  const { data } = supabaseAdmin.storage.from(BUCKET).getPublicUrl(storagePath);
  return data.publicUrl;
}

function extensionFor(file: File) {
  return file.type === "image/png" ? "png" : file.type === "image/webp" ? "webp" : "jpg";
}

async function uploadFile(storagePath: string, file: File) {
  const arrayBuffer = await file.arrayBuffer();
  return supabaseAdmin.storage
    .from(BUCKET)
    .upload(storagePath, Buffer.from(arrayBuffer), { contentType: file.type, upsert: true });
}

// Uploads an original banner and/or generated 11:4 preview.
export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const denied = await requireAdmin(req, "canManageSettings");
  if (denied) return denied;

  const { id } = await params;

  try {
    const formData = await req.formData();
    const file = formData.get("file") as File | null;
    const preview = formData.get("preview") as File | null;

    if (!file && !preview) return NextResponse.json({ error: "No file provided" }, { status: 400 });
    if (file && !ALLOWED_TYPES.includes(file.type)) {
      return NextResponse.json({ error: "Only JPEG, PNG, or WebP images are allowed" }, { status: 400 });
    }
    if (preview && !ALLOWED_TYPES.includes(preview.type)) {
      return NextResponse.json({ error: "Preview must be JPEG, PNG, or WebP" }, { status: 400 });
    }
    if (file && file.size > MAX_FILE_BYTES) {
      return NextResponse.json({ error: "Original image must be under 10MB" }, { status: 400 });
    }
    if (preview && preview.size > MAX_PREVIEW_BYTES) {
      return NextResponse.json({ error: "Generated preview must be under 5MB" }, { status: 400 });
    }

    const { data: campaign, error: campaignError } = await supabaseAdmin
      .from("campaigns")
      .select("id, hero_banner_original_url, hero_banner_preview_url")
      .eq("id", id)
      .single();
    if (campaignError || !campaign) return NextResponse.json({ error: "Campaign not found" }, { status: 404 });

    const stamp = Date.now();
    const updates: Record<string, unknown> = { updated_at: new Date().toISOString() };
    const uploadedPaths: string[] = [];

    if (file) {
      const storagePath = `campaigns/${id}/banner/original-${stamp}.${extensionFor(file)}`;
      const { error: uploadError } = await uploadFile(storagePath, file);
      if (uploadError) return apiErrorResponse(uploadError, 500, "admin/campaigns/[id]/upload");
      uploadedPaths.push(storagePath);

      const originalUrl = publicUrlFor(storagePath);
      updates.hero_banner_original_url = originalUrl;
    }

    if (preview) {
      const previewPath = `campaigns/${id}/banner/preview-${stamp}.${extensionFor(preview)}`;
      const { error: previewError } = await uploadFile(previewPath, preview);
      if (previewError) {
        if (uploadedPaths.length) await supabaseAdmin.storage.from(BUCKET).remove(uploadedPaths);
        return apiErrorResponse(previewError, 500, "admin/campaigns/[id]/upload");
      }
      uploadedPaths.push(previewPath);
      const previewUrl = publicUrlFor(previewPath);
      updates.hero_banner_preview_url = previewUrl;
      updates.hero_banner_crop = normalizeBannerCrop(
        JSON.parse(String(formData.get("crop") || "{}"))
      );
      updates.hero_banner_focal_point = normalizeBannerFocalPoint(
        JSON.parse(String(formData.get("focal_point") || "{}"))
      );
    } else if (file) {
      updates.hero_banner_preview_url = updates.hero_banner_original_url;
    }

    const { data: updated, error: updateError } = await supabaseAdmin
      .from("campaigns")
      .update(updates)
      .eq("id", id)
      .select("*")
      .single();
    if (updateError) {
      if (uploadedPaths.length) await supabaseAdmin.storage.from(BUCKET).remove(uploadedPaths);
      return apiErrorResponse(updateError, 500, "admin/campaigns/[id]/upload");
    }

    await removeUnreferencedCampaignAssets([
      file ? campaign.hero_banner_original_url : null,
      campaign.hero_banner_preview_url,
    ]);

    return NextResponse.json({
      original_url: updated.hero_banner_original_url,
      preview_url: updated.hero_banner_preview_url,
      campaign: updated,
    });
  } catch (err: unknown) {
    return apiErrorResponse(err, 500, "admin/campaigns/[id]/upload");
  }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const denied = await requireAdmin(req, "canManageSettings");
  if (denied) return denied;

  const { id } = await params;
  const { data: campaign, error: campaignError } = await supabaseAdmin
    .from("campaigns")
    .select("hero_banner_original_url, hero_banner_preview_url")
    .eq("id", id)
    .maybeSingle();
  if (campaignError || !campaign) return NextResponse.json({ error: "Campaign not found" }, { status: 404 });

  const { data: updated, error: updateError } = await supabaseAdmin
    .from("campaigns")
    .update({
      hero_banner_original_url: null,
      hero_banner_preview_url: null,
      updated_at: new Date().toISOString(),
    })
    .eq("id", id)
    .select("*")
    .single();
  if (updateError) return apiErrorResponse(updateError, 500, "admin/campaigns/[id]/upload");

  await removeUnreferencedCampaignAssets([campaign.hero_banner_original_url, campaign.hero_banner_preview_url]);
  return NextResponse.json({ campaign: updated });
}