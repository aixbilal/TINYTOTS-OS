import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-admin";

const MAX_SIZE_BYTES = 5 * 1024 * 1024; // 5MB
const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp"];

// POST /api/complaints/upload-photo — server-side upload so guests (no
// session) can attach a photo too. Bypasses RLS via supabaseAdmin, but the
// bucket only ever gets return/complaint photos, never anything sensitive.
export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }
    if (!ALLOWED_TYPES.includes(file.type)) {
      return NextResponse.json({ error: "Only JPEG, PNG, or WebP images are allowed" }, { status: 400 });
    }
    if (file.size > MAX_SIZE_BYTES) {
      return NextResponse.json({ error: "Image must be under 5MB" }, { status: 400 });
    }

    const ext = file.name.split(".").pop() || "jpg";
    const path = `${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
    const bytes = new Uint8Array(await file.arrayBuffer());

    const { error: uploadError } = await supabaseAdmin.storage
      .from("complaint-photos")
      .upload(path, bytes, { contentType: file.type });

    if (uploadError) {
      return NextResponse.json({ error: uploadError.message }, { status: 500 });
    }

    const { data: publicUrl } = supabaseAdmin.storage.from("complaint-photos").getPublicUrl(path);

    return NextResponse.json({ url: publicUrl.publicUrl });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Upload failed" }, { status: 500 });
  }
}