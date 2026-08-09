import { NextRequest, NextResponse } from "next/server";
import { verifyMetaAgentAuth } from "@/lib/meta-agent/auth";
import { getMetaAgentSupabaseClient } from "@/lib/meta-agent/supabase";

// Stable brand facts - confirmed from tinytotsofficial.com site content
// (privacy-policy / terms pages). Update here if these ever change.
const STORE_NAME = "Tiny Tots";
const STORE_EMAIL = "support@tinytotsofficial.com";
const STORE_LOCATION = "Toba Tek Singh, Punjab, Pakistan";
const STORE_WEBSITE = "https://tinytotsofficial.com";

export async function GET(request: NextRequest) {
  const authError = verifyMetaAgentAuth(request);
  if (authError) return authError;

  try {
    const supabase = getMetaAgentSupabaseClient();

    const { data, error } = await supabase
      .from("app_settings")
      .select("key, value")
      .like("key", "store_%");

    if (error) {
      console.error("Store Info API Supabase error:", error.message);
      return NextResponse.json(
        { success: false, error: "Unable to fetch store information" },
        { status: 500 }
      );
    }

    // Turn the key-value rows into a simple lookup object
    const settings: Record<string, string> = {};
    for (const row of data ?? []) {
      settings[row.key] = row.value;
    }

    return NextResponse.json({
      success: true,
      store: {
        name: STORE_NAME,
        email: STORE_EMAIL,
        location: STORE_LOCATION,
        website: STORE_WEBSITE,
        phone: settings.store_phone || null,
        whatsapp: settings.store_whatsapp || null,
        hours: settings.store_hours || null,
        instagram: settings.store_instagram || null,
        facebook: settings.store_facebook || null,
        tiktok: settings.store_tiktok || null,
      },
    });
  } catch (err) {
    console.error("Store Info API unexpected error:", err);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}