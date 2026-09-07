import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-admin";
import { getAdminContext } from "@/lib/admin-request";

// Deactivate a browser's push subscription. Soft-deactivates (is_active =
// false) so the history of the device is kept; a later re-subscribe upserts
// it back to active.
export async function POST(request: NextRequest) {
  const auth = await getAdminContext(request);
  if ("response" in auth) return auth.response;

  let body: { endpoint?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }

  const endpoint = body.endpoint?.trim();
  if (!endpoint) {
    return NextResponse.json({ error: "endpoint is required." }, { status: 400 });
  }

  const { error } = await supabaseAdmin
    .from("push_subscriptions")
    .update({ is_active: false, last_failure_at: null })
    .eq("endpoint", endpoint)
    .eq("auth_user_id", auth.context.authUserId);

  if (error) {
    return NextResponse.json({ error: "Could not update subscription." }, { status: 500 });
  }
  return NextResponse.json({ success: true });
}
