import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-admin";
import { requireAdmin } from "@/lib/require-admin";

/**
 * POST { id, active } — include/exclude a campaign from the live rotation.
 * Multiple campaigns may be active at once (after multi-active migration).
 */
export async function POST(req: NextRequest) {
  const denied = await requireAdmin(req, "canManageSettings");
  if (denied) return denied;

  let body: { id?: unknown; active?: unknown };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const campaignId = Number(body.id);
  if (!Number.isSafeInteger(campaignId) || campaignId <= 0) {
    return NextResponse.json({ error: "Valid campaign id is required" }, { status: 400 });
  }

  const makeActive = body.active !== false && body.active !== "false" && body.active !== 0;

  // Prefer RPC when migration applied; always fall back to direct update.
  const { data: rpcData, error: rpcError } = await supabaseAdmin.rpc("set_campaign_active", {
    target_campaign_id: campaignId,
    make_active: makeActive,
  });

  if (!rpcError) {
    const campaign = Array.isArray(rpcData) ? rpcData[0] : rpcData;
    if (campaign) return NextResponse.json({ campaign });
  }

  // Older DBs still have exclusive activate_campaign — try that only when activating.
  if (makeActive && rpcError) {
    const { data: exclusiveData, error: exclusiveError } = await supabaseAdmin.rpc("activate_campaign", {
      target_campaign_id: campaignId,
    });
    if (!exclusiveError) {
      const campaign = Array.isArray(exclusiveData) ? exclusiveData[0] : exclusiveData;
      if (campaign) {
        return NextResponse.json({
          campaign,
          warning:
            "Single-active mode is still enabled in the database. Apply migration 20260801110000_multi_active_campaign_rotation.sql to allow multiple campaigns in rotation.",
        });
      }
    }
  }

  const now = new Date().toISOString();
  const { data: campaign, error } = await supabaseAdmin
    .from("campaigns")
    .update({ is_active: makeActive, updated_at: now })
    .eq("id", campaignId)
    .select("*")
    .maybeSingle();

  if (error) {
    const message = error.message || rpcError?.message || "Failed to update campaign";
    const needsMigration =
      message.toLowerCase().includes("unique") ||
      message.toLowerCase().includes("campaigns_single_active");
    return NextResponse.json(
      {
        error: needsMigration
          ? "Database still enforces a single active campaign. Run migration 20260801110000_multi_active_campaign_rotation.sql in Supabase, then try again."
          : message,
      },
      { status: 500 }
    );
  }

  if (!campaign) {
    return NextResponse.json({ error: "Campaign not found" }, { status: 404 });
  }

  return NextResponse.json({ campaign });
}
