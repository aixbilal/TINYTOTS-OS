import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-admin";
import { requireAdmin } from "@/lib/require-admin";

// Reuses the existing product-images bucket (already public, already
// policy-configured) under a testimonials/ prefix.
const BUCKET = "product-images";
const MAX_FILE_BYTES = 5 * 1024 * 1024;
const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp"];

function publicUrlFor(storagePath: string) {
  const { data } = supabaseAdmin.storage.from(BUCKET).getPublicUrl(storagePath);
  return data.publicUrl;
}

function storagePathFromPublicUrl(url: string | null) {
  if (!url) return null;
  const marker = `/storage/v1/object/public/${BUCKET}/`;
  const index = url.indexOf(marker);
  return index === -1 ? null : decodeURIComponent(url.slice(index + marker.length));
}

// POST /api/admin/testimonials/[id]/photo — multipart form-data: file.
// Uploads the customer photo and writes its public URL onto
// customer_image_url for this testimonial.
export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const denied = await requireAdmin(req, "canManageSettings");
  if (denied) return denied;

  const { id } = await params;

  try {
    const formData = await req.formData();
    const file = formData.get("file") as File | null;

    if (!file) return NextResponse.json({ error: "No file provided" }, { status: 400 });
    if (!ALLOWED_TYPES.includes(file.type)) {
      return NextResponse.json({ error: "Only JPEG, PNG, or WebP images are allowed" }, { status: 400 });
    }
    if (file.size > MAX_FILE_BYTES) {
      return NextResponse.json({ error: "Image must be under 5MB" }, { status: 400 });
    }

    const { data: testimonial, error: fetchError } = await supabaseAdmin
      .from("testimonials")
      .select("id, customer_image_url")
      .eq("id", id)
      .single();
    if (fetchError || !testimonial) return NextResponse.json({ error: "Testimonial not found" }, { status: 404 });

    const ext = file.type === "image/png" ? "png" : file.type === "image/webp" ? "webp" : "jpg";
    const storagePath = `testimonials/${id}-${Date.now()}.${ext}`;

    const arrayBuffer = await file.arrayBuffer();
    const { error: uploadError } = await supabaseAdmin.storage
      .from(BUCKET)
      .upload(storagePath, Buffer.from(arrayBuffer), { contentType: file.type, upsert: true });
    if (uploadError) return NextResponse.json({ error: uploadError.message }, { status: 500 });

    const url = publicUrlFor(storagePath);

    const { data: updated, error: updateError } = await supabaseAdmin
      .from("testimonials")
      .update({ customer_image_url: url })
      .eq("id", id)
      .select("*")
      .single();
    if (updateError) {
      await supabaseAdmin.storage.from(BUCKET).remove([storagePath]);
      return NextResponse.json({ error: updateError.message }, { status: 500 });
    }

    const oldPath = storagePathFromPublicUrl(testimonial.customer_image_url);
    if (oldPath && oldPath !== storagePath) await supabaseAdmin.storage.from(BUCKET).remove([oldPath]);

    return NextResponse.json({ url, testimonial: updated });
  } catch (err: unknown) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Upload failed" },
      { status: 500 }
    );
  }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const denied = await requireAdmin(req, "canManageSettings");
  if (denied) return denied;

  const { id } = await params;
  const { data: testimonial, error: fetchError } = await supabaseAdmin
    .from("testimonials")
    .select("customer_image_url")
    .eq("id", id)
    .maybeSingle();
  if (fetchError || !testimonial) return NextResponse.json({ error: "Testimonial not found" }, { status: 404 });

  const { data: updated, error: updateError } = await supabaseAdmin
    .from("testimonials")
    .update({ customer_image_url: null })
    .eq("id", id)
    .select("*")
    .single();
  if (updateError) return NextResponse.json({ error: updateError.message }, { status: 500 });

  const oldPath = storagePathFromPublicUrl(testimonial.customer_image_url);
  if (oldPath) await supabaseAdmin.storage.from(BUCKET).remove([oldPath]);
  return NextResponse.json({ testimonial: updated });
}