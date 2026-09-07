import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-admin";
import { getAdminContext } from "@/lib/admin-request";
import { isPushConfigured } from "@/lib/push";
import { clientIp, rateLimit, rateLimitResponse } from "@/lib/rate-limit";

// Store (or refresh) a browser PushSubscription for the acting admin.
// Idempotent: the row is keyed by endpoint (unique), so re-subscribing the
// same browser updates keys / re-activates instead of duplicating.
export async function POST(request: NextRequest) {
  const limited = await rateLimit(`push-subscribe:${clientIp(request)}`, {
    limit: 30,
    windowMs: 15 * 60 * 1000,
  });
  if (!limited.ok) return rateLimitResponse(limited.retryAfterSec);

  const auth = await getAdminContext(request);
  if ("response" in auth) return auth.response;

  if (!isPushConfigured()) {
    return NextResponse.json(
      { error: "Push notifications are not configured on this deployment." },
      { status: 503 }
    );
  }

  let body: {
    subscription?: { endpoint?: string; keys?: { p256dh?: string; auth?: string } };
  };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }

  const sub = body.subscription;
  const endpoint = sub?.endpoint?.trim();
  const p256dh = sub?.keys?.p256dh?.trim();
  const authKey = sub?.keys?.auth?.trim();

  if (!endpoint || !p256dh || !authKey) {
    return NextResponse.json(
      { error: "A complete push subscription (endpoint + keys) is required." },
      { status: 400 }
    );
  }

  const userAgent = request.headers.get("user-agent")?.slice(0, 300) || null;

  const { error } = await supabaseAdmin
    .from("push_subscriptions")
    .upsert(
      {
        auth_user_id: auth.context.authUserId,
        endpoint,
        p256dh,
        auth: authKey,
        user_agent: userAgent,
        is_active: true,
        last_failure_at: null,
      },
      { onConflict: "endpoint" }
    );

  if (error) {
    return NextResponse.json({ error: "Could not save subscription." }, { status: 500 });
  }
  return NextResponse.json({ success: true });
}
