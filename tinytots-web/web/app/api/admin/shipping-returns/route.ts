import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-admin";
import { requireAdmin } from "@/lib/require-admin";

const TEXT_FIELDS = [
  "hero_title",
  "hero_subtitle",
  "timelines_heading",
  "cod_heading",
  "cod_intro",
  "steps_heading",
  "contact_heading",
  "contact_body",
  "contact_button_text",
  "contact_button_link",
] as const;

function asString(value: unknown, fallback = ""): string {
  return String(value ?? fallback).trim();
}

export async function GET(req: NextRequest) {
  const denied = await requireAdmin(req, "canManagePages");
  if (denied) return denied;

  const { data, error } = await supabaseAdmin
    .from("shipping_returns_content")
    .select("*")
    .eq("id", 1)
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ content: data });
}

export async function PATCH(req: NextRequest) {
  const denied = await requireAdmin(req, "canManagePages");
  if (denied) return denied;

  try {
    const body = await req.json();
    const updates: Record<string, unknown> = { updated_at: new Date().toISOString() };

    for (const field of TEXT_FIELDS) {
      if (body[field] !== undefined) updates[field] = asString(body[field]);
    }

    if (Array.isArray(body.toc)) {
      updates.toc = body.toc
        .filter((item: unknown) => item && typeof item === "object")
        .map((item: any) => ({
          id: asString(item.id) || "section",
          title: asString(item.title),
        }));
    }

    if (Array.isArray(body.timelines)) {
      updates.timelines = body.timelines
        .filter((item: unknown) => item && typeof item === "object")
        .map((item: any) => ({
          icon: asString(item.icon, "package_2"),
          label: asString(item.label),
          value: asString(item.value),
        }));
    }

    if (Array.isArray(body.cod_tiers)) {
      updates.cod_tiers = body.cod_tiers
        .filter((item: unknown) => item && typeof item === "object")
        .map((item: any) => ({
          range: asString(item.range),
          detail: asString(item.detail),
        }));
    }

    if (Array.isArray(body.steps)) {
      updates.steps = body.steps
        .filter((item: unknown) => item && typeof item === "object")
        .map((item: any) => ({
          icon: asString(item.icon, "assignment_return"),
          title: asString(item.title),
          body: asString(item.body),
        }));
    }

    const { data, error } = await supabaseAdmin
      .from("shipping_returns_content")
      .update(updates)
      .eq("id", 1)
      .select()
      .single();

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ content: data });
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message || "Failed to update shipping & returns content" },
      { status: 500 }
    );
  }
}
