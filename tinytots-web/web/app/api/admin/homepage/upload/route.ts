import { NextRequest, NextResponse } from "next/server";
import { apiErrorResponse } from "@/lib/api-error";
import { requireAdmin } from "@/lib/require-admin";
import { supabaseAdmin } from "@/lib/supabase-admin";

// Same public bucket as campaigns / product images — homepage assets live under homepage/.
const BUCKET = "product-images";
const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp"];
const MAX_BYTES = 5 * 1024 * 1024;

function publicUrlFor(storagePath: string) {
  const { data } = supabaseAdmin.storage.from(BUCKET).getPublicUrl(storagePath);
  return data.publicUrl;
}

function extensionFor(mime: string) {
  return mime === "image/png" ? "png" : mime === "image/webp" ? "webp" : "jpg";
}

/** Detect jpeg/png/webp from magic bytes — ignore client Content-Type claims. */
function sniffImageMime(bytes: Uint8Array): "image/jpeg" | "image/png" | "image/webp" | null {
  if (bytes.length >= 3 && bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff) {
    return "image/jpeg";
  }
  if (
    bytes.length >= 8 &&
    bytes[0] === 0x89 &&
    bytes[1] === 0x50 &&
    bytes[2] === 0x4e &&
    bytes[3] === 0x47 &&
    bytes[4] === 0x0d &&
    bytes[5] === 0x0a &&
    bytes[6] === 0x1a &&
    bytes[7] === 0x0a
  ) {
    return "image/png";
  }
  if (
    bytes.length >= 12 &&
    bytes[0] === 0x52 &&
    bytes[1] === 0x49 &&
    bytes[2] === 0x46 &&
    bytes[3] === 0x46 &&
    bytes[8] === 0x57 &&
    bytes[9] === 0x45 &&
    bytes[10] === 0x42 &&
    bytes[11] === 0x50
  ) {
    return "image/webp";
  }
  return null;
}

export async function POST(req: NextRequest) {
  const denied = await requireAdmin(req, "canManageSettings");
  if (denied) return denied;

  try {
    const formData = await req.formData();
    const file = formData.get("file") as File | null;
    if (!file) return NextResponse.json({ error: "No file provided" }, { status: 400 });
    if (file.size > MAX_BYTES) {
      return NextResponse.json({ error: "Image must be under 5MB" }, { status: 400 });
    }

    const arrayBuffer = await file.arrayBuffer();
    const bytes = new Uint8Array(arrayBuffer);
    const sniffed = sniffImageMime(bytes);
    if (!sniffed || !ALLOWED_TYPES.includes(sniffed)) {
      return NextResponse.json(
        { error: "Only JPEG, PNG, or WebP images are allowed" },
        { status: 400 }
      );
    }

    const variant = String(formData.get("variant") || "desktop").trim();
    const safeVariant = variant === "mobile" ? "mobile" : "desktop";
    const stamp = Date.now();
    const storagePath = `homepage/hero/${safeVariant}-${stamp}.${extensionFor(sniffed)}`;

    const { error: uploadError } = await supabaseAdmin.storage
      .from(BUCKET)
      .upload(storagePath, Buffer.from(arrayBuffer), { contentType: sniffed, upsert: false });

    if (uploadError) {
      return apiErrorResponse(uploadError, 500, "admin/homepage/upload");
    }

    return NextResponse.json({ url: publicUrlFor(storagePath) });
  } catch (err: unknown) {
    return apiErrorResponse(err, 500, "admin/homepage/upload");
  }
}
