import { apiErrorResponse } from "@/lib/api-error";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { supabaseAdmin } from "@/lib/supabase-admin";
import { requireAdmin } from "@/lib/require-admin";

const patchSchema = z.object({
  key: z.string().min(1),
  value: z.string().min(1),
});

// Keys the Settings screen is allowed to create if the row doesn't exist yet
// (e.g. before the Online-Pricing migration is applied). Every other key must
// already exist — no arbitrary key creation from the client.
const SEEDABLE_KEYS: Record<string, string> = {
  default_web_markup_percent: "25",
  web_round_to: "50",
};

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

  // Surface known seedable keys even if the row hasn't been created yet, so the
  // Online-Pricing section is editable immediately. Saving one upserts it.
  const present = new Set((data || []).map((s) => s.key));
  const merged = [...(data || [])];
  for (const [key, value] of Object.entries(SEEDABLE_KEYS)) {
    if (!present.has(key)) {
      merged.push({ key, value, description: null, updated_at: null });
    }
  }
  merged.sort((a, b) => a.key.localeCompare(b.key));

  return NextResponse.json({ settings: merged });
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

    if (key === "default_web_markup_percent") {
      const n = Number(value);
      if (!Number.isFinite(n) || n < 0 || n > 500) {
        return NextResponse.json(
          { error: "Default website markup must be between 0 and 500." },
          { status: 400 }
        );
      }
    }

    if (key === "web_round_to" && value !== "50" && value !== "100") {
      return NextResponse.json(
        { error: "Website price rounding must be 50 or 100." },
        { status: 400 }
      );
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

    const isSeedable = Object.prototype.hasOwnProperty.call(SEEDABLE_KEYS, key);

    let data: unknown;
    let error: unknown;
    if (isSeedable) {
      ({ data, error } = await supabaseAdmin
        .from("app_settings")
        .upsert({ key, value, updated_at: new Date().toISOString() }, { onConflict: "key" })
        .select()
        .single());
    } else {
      ({ data, error } = await supabaseAdmin
        .from("app_settings")
        .update({ value, updated_at: new Date().toISOString() })
        .eq("key", key)
        .select()
        .single());
    }

    if (error) {
      return apiErrorResponse(error, 500, "admin/settings");
    }

    return NextResponse.json({ setting: data });
  } catch (err: any) {
    return apiErrorResponse(err, 500, "admin/settings");
  }
}