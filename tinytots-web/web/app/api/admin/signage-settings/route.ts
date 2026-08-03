import { apiErrorResponse } from "@/lib/api-error";
import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-admin";
import { requireAdmin } from "@/lib/require-admin";
import { DEFAULT_ROTATION_SECONDS } from "@/lib/signage-campaign";
import { DEFAULT_STORE_TIMEZONE, normalizeTimezone } from "@/lib/campaign-schedule";

export async function GET(req: NextRequest) {
  const denied = await requireAdmin(req, "canManageSettings");
  if (denied) return denied;

  const { data, error } = await supabaseAdmin.from("signage_revision").select("*").eq("id", 1).maybeSingle();
  if (error) return apiErrorResponse(error, 500, "admin/signage-settings");

  return NextResponse.json({
    settings: {
      header_logo_text: String(data?.header_logo_text || "TinyTots"),
      header_tagline: String(data?.header_tagline || "Premium Kids Wear"),
      rotation_seconds: Number(data?.rotation_seconds) || DEFAULT_ROTATION_SECONDS,
      store_timezone: normalizeTimezone(data?.store_timezone, DEFAULT_STORE_TIMEZONE),
    },
  });
}

export async function PATCH(req: NextRequest) {
  const denied = await requireAdmin(req, "canManageSettings");
  if (denied) return denied;

  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const updates: Record<string, unknown> = { updated_at: new Date().toISOString() };

  if ("header_logo_text" in body) {
    const value = String(body.header_logo_text || "").trim();
    updates.header_logo_text = value || "TinyTots";
  }
  if ("header_tagline" in body) {
    const value = String(body.header_tagline || "").trim();
    updates.header_tagline = value || "Premium Kids Wear";
  }
  if ("rotation_seconds" in body) {
    const value = Math.round(Number(body.rotation_seconds));
    if (!Number.isFinite(value) || value < 10 || value > 60) {
      return NextResponse.json({ error: "rotation_seconds must be between 10 and 60" }, { status: 400 });
    }
    updates.rotation_seconds = value;
  }
  if ("store_timezone" in body) {
    updates.store_timezone = normalizeTimezone(body.store_timezone, DEFAULT_STORE_TIMEZONE);
  }

  if (Object.keys(updates).length <= 1) {
    return NextResponse.json({ error: "No valid fields to update" }, { status: 400 });
  }

  const { data, error } = await supabaseAdmin
    .from("signage_revision")
    .upsert({ id: 1, ...updates }, { onConflict: "id" })
    .select("*")
    .single();

  if (error) return apiErrorResponse(error, 500, "admin/signage-settings");

  return NextResponse.json({
    settings: {
      header_logo_text: String(data.header_logo_text || "TinyTots"),
      header_tagline: String(data.header_tagline || "Premium Kids Wear"),
      rotation_seconds: Number(data.rotation_seconds) || DEFAULT_ROTATION_SECONDS,
      store_timezone: normalizeTimezone(data.store_timezone, DEFAULT_STORE_TIMEZONE),
    },
  });
}
