import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

export const dynamic = "force-dynamic";

// GET /api/announcement - public, no auth. Small dedicated endpoint since
// the header/announcement bar lives in the client-component root layout,
// which can't do the server-side homepage_content fetch the homepage itself
// uses.
export async function GET() {
  const { data } = await supabase
    .from("homepage_content")
    .select("announcement_enabled, announcement_text, announcement_link, announcement_style")
    .eq("id", 1)
    .single();

  return NextResponse.json({
    enabled: data?.announcement_enabled ?? false,
    text: data?.announcement_text ?? "",
    link: data?.announcement_link ?? "",
    style: data?.announcement_style ?? "static",
  });
}
