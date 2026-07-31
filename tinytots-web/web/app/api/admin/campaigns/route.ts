import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-admin";
import { requireAdmin } from "@/lib/require-admin";
import { DEFAULT_CAMPAIGN_THEME } from "@/lib/signage-campaign";

// GET /api/admin/campaigns — every campaign (active or not), plus products
// and categories so the editor can build the featured-collection picker
// without a second round trip.
export async function GET(req: NextRequest) {
  const denied = await requireAdmin(req, "canManageSettings");
  if (denied) return denied;

  const [
    { data: campaigns, error },
    { data: products },
    { data: categories },
    { data: trustItems },
    { data: testimonials },
  ] = await Promise.all([
    supabaseAdmin.from("campaigns").select("*").order("created_at", { ascending: false }),
    supabaseAdmin
      .from("products")
      .select("id, name, image_url, category")
      .eq("is_active", true)
      .order("name", { ascending: true }),
    supabaseAdmin.from("categories").select("name, slug").order("display_order", { ascending: true }).order("name", { ascending: true }),
    supabaseAdmin.from("trust_items").select("id, icon, heading, description, is_active").order("sort_order", { ascending: true }),
    supabaseAdmin
      .from("testimonials")
      .select("id, customer_name, customer_image_url, rating, quote, is_published")
      .order("sort_order", { ascending: true })
      .order("created_at", { ascending: false }),
  ]);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({
    campaigns: campaigns || [],
    products: products || [],
    categories: categories || [],
    trust_items: trustItems || [],
    testimonials: testimonials || [],
  });
}

// POST /api/admin/campaigns — creates a new blank campaign (never active by
// default, so creating one never disrupts what's currently live).
export async function POST(req: NextRequest) {
  const denied = await requireAdmin(req, "canManageSettings");
  if (denied) return denied;

  try {
    const body = await req.json();
    const name = String(body.name || "Untitled Campaign").trim();

    const [{ data: trustItems }, { data: testimonials }] = await Promise.all([
        supabaseAdmin.from("trust_items").select("id").eq("is_active", true).order("sort_order", { ascending: true }),
        supabaseAdmin
          .from("testimonials")
          .select("id")
          .eq("is_published", true)
          .order("sort_order", { ascending: true })
          .order("created_at", { ascending: false }),
      ]);

    const { data, error } = await supabaseAdmin
      .from("campaigns")
      .insert({
        name,
        is_active: false,
        trust_item_ids: (trustItems || []).map((item) => item.id),
        testimonial_ids: (testimonials || []).map((item) => item.id),
        social_links: [],
        footer_settings: {
          website_url: "",
          qr_code_image_url: null,
          qr_visible: true,
          scan_label: "Scan to Shop",
        },
        theme: DEFAULT_CAMPAIGN_THEME,
      })
      .select("*")
      .single();

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ campaign: data });
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }
}