import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/require-admin";
import { getSettingNumber } from "@/lib/settings";

// Read-only: the global online-pricing defaults the DB trigger uses
// (app_settings.default_web_markup_percent / web_round_to). Admin screens
// call this so their price preview matches what the database will store.
export async function GET(request: NextRequest) {
  const denied = await requireAdmin(request, "canManageInventory");
  if (denied) return denied;

  const markupPercent = await getSettingNumber("default_web_markup_percent");
  const roundToRaw = await getSettingNumber("web_round_to");
  const roundTo = roundToRaw === 100 ? 100 : 50;

  return NextResponse.json({
    markupPercent: Number.isFinite(markupPercent) && markupPercent >= 0 ? markupPercent : 25,
    roundTo,
  });
}
