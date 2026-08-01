import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/require-admin";
import { supabaseAdmin } from "@/lib/supabase-admin";

// Same bucket + service-role write pattern as campaign QR / banner uploaders.
const BUCKET = "product-images";
const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp"];
const MAX_BYTES = 3 * 1024 * 1024;

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

function extensionFor(file: File) {
  return file.type === "image/png" ? "png" : file.type === "image/webp" ? "webp" : "jpg";
}

async function loadTestimonial(id: string) {
  const numericId = Number(id);
  if (!Number.isFinite(numericId)) {
    return { data: null, error: { message: "Invalid testimonial id" } };
  }
  return supabaseAdmin
    .from("testimonials")
    .select("id, customer_image_url")
    .eq("id", numericId)
    .maybeSingle();
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const denied = await requireAdmin(req, "canManageSettings");
  if (denied) return denied;

  const { id } = await params;
  const formData = await req.formData();
  const file = formData.get("file") as File | null;
  if (!file) return NextResponse.json({ error: "No photo provided" }, { status: 400 });
  if (!ALLOWED_TYPES.includes(file.type)) {
    return NextResponse.json({ error: "Only JPEG, PNG, or WebP images are allowed" }, { status: 400 });
  }
  if (file.size > MAX_BYTES) {
    return NextResponse.json({ error: "Photo must be under 3MB" }, { status: 400 });
  }

  const { data: testimonial, error: fetchError } = await loadTestimonial(id);
  if (fetchError) {
    return NextResponse.json({ error: fetchError.message }, { status: 500 });
  }
  if (!testimonial) {
    return NextResponse.json({ error: "Testimonial not found" }, { status: 404 });
  }

  const oldUrl = testimonial.customer_image_url ? String(testimonial.customer_image_url) : null;
  const storagePath = `testimonials/${id}/photo-${Date.now()}.${extensionFor(file)}`;
  const { error: uploadError } = await supabaseAdmin.storage.from(BUCKET).upload(
    storagePath,
    Buffer.from(await file.arrayBuffer()),
    { contentType: file.type, upsert: false }
  );
  if (uploadError) return NextResponse.json({ error: uploadError.message }, { status: 500 });

  const url = publicUrlFor(storagePath);
  const { data: updated, error: updateError } = await supabaseAdmin
    .from("testimonials")
    .update({ customer_image_url: url })
    .eq("id", testimonial.id)
    .select("*")
    .single();
  if (updateError) {
    await supabaseAdmin.storage.from(BUCKET).remove([storagePath]);
    return NextResponse.json({ error: updateError.message }, { status: 500 });
  }

  const oldPath = storagePathFromPublicUrl(oldUrl);
  if (oldPath && oldPath !== storagePath) {
    await supabaseAdmin.storage.from(BUCKET).remove([oldPath]);
  }

  return NextResponse.json({ url, testimonial: updated });
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const denied = await requireAdmin(req, "canManageSettings");
  if (denied) return denied;

  const { id } = await params;
  const { data: testimonial, error: fetchError } = await loadTestimonial(id);
  if (fetchError) {
    return NextResponse.json({ error: fetchError.message }, { status: 500 });
  }
  if (!testimonial) {
    return NextResponse.json({ error: "Testimonial not found" }, { status: 404 });
  }

  const oldUrl = testimonial.customer_image_url ? String(testimonial.customer_image_url) : null;
  const { data: updated, error: updateError } = await supabaseAdmin
    .from("testimonials")
    .update({ customer_image_url: null })
    .eq("id", testimonial.id)
    .select("*")
    .single();
  if (updateError) return NextResponse.json({ error: updateError.message }, { status: 500 });

  const oldPath = storagePathFromPublicUrl(oldUrl);
  if (oldPath) await supabaseAdmin.storage.from(BUCKET).remove([oldPath]);

  return NextResponse.json({ testimonial: updated });
}
