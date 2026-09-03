import { apiErrorResponse } from "@/lib/api-error";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { supabaseAdmin } from "@/lib/supabase-admin";
import { requireAdmin } from "@/lib/require-admin";

const patchSchema = z.object({
  key: z.string().min(1),
  value: z.string().min(1),
});

export async function GET(req: NextRequest) {
  const authError = await requireAdmin(req, "canManageSettings");
  if (authError) return authError;

  const { data, error } = await supabaseAdmin
    .from("app_settings")
    .select("*")
    .order("key", { ascending: true });

  if (error) {
    return apiErrorResponse(error, 500, "admin/settings");
  }

  return NextResponse.json({ settings: data });
}

export async function PATCH(req: NextRequest) {
  const authError = await requireAdmin(req, "canManageSettings");
  if (authError) return authError;

  try {
    const rawBody = await req.json();
    const parsed = patchSchema.safeParse(rawBody);

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues.map((i) => i.message).join(", ") },
        { status: 400 }
      );
    }

    const { key, value } = parsed.data;

    if (key.includes("amount") || key.includes("days") || key.includes("percent")) {
      if (!Number.isFinite(Number(value)) || Number(value) < 0) {
        return NextResponse.json(
          { error: `${key} must be a non-negative number` },
          { status: 400 }
        );
      }
    }

    // Social profile URLs feed Organization.sameAs — only accept absolute
    // http/https URLs so a bare handle can never end up in structured data.
    if (key === "store_facebook" || key === "store_instagram" || key === "store_tiktok") {
      const trimmed = value.trim();
      if (trimmed !== "" && !/^https?:\/\/[^\s]+$/i.test(trimmed)) {
        return NextResponse.json(
          { error: `${key} must be a full URL starting with https://` },
          { status: 400 }
        );
      }
    }

    const { data, error } = await supabaseAdmin
      .from("app_settings")
      .update({ value, updated_at: new Date().toISOString() })
      .eq("key", key)
      .select()
      .single();

    if (error) {
      return apiErrorResponse(error, 500, "admin/settings");
    }

    return NextResponse.json({ setting: data });
  } catch (err: any) {
    return apiErrorResponse(err, 500, "admin/settings");
  }
}