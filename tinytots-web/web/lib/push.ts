import webpush from "web-push";
import { supabaseAdmin } from "@/lib/supabase-admin";

/**
 * Web Push dispatch — SERVER ONLY.
 *
 * Sends notifications to admin/owner devices that subscribed via
 * Admin > My account. The one V1.1 event is a new web order.
 *
 * Design guarantees:
 *   - Never throws to the caller. sendOrderPush() catches everything; a push
 *     failure (misconfig, expired subscription, network) must never affect an
 *     order.
 *   - Cloudflare Workers friendly: we build the encrypted request with
 *     web-push's generateRequestDetails() and POST it with the global fetch()
 *     instead of web-push's Node https path.
 *   - Dead endpoints (404/410) are soft-deactivated in push_subscriptions.
 *
 * Required env (names only — values are deployment secrets):
 *   VAPID_PUBLIC_KEY   - VAPID application server public key (base64url)
 *   VAPID_PRIVATE_KEY  - VAPID private key. SERVER ONLY. Never NEXT_PUBLIC_*.
 *   VAPID_SUBJECT      - "mailto:you@example.com" or an https:// contact URL
 *
 * Generate a keypair once with:  npx web-push generate-vapid-keys
 * The public key is also served to the browser via GET /api/push/public-key.
 */

export type PushConfig = {
  publicKey: string;
  privateKey: string;
  subject: string;
};

export function getPushConfig(): PushConfig | null {
  const publicKey = process.env.VAPID_PUBLIC_KEY?.trim();
  const privateKey = process.env.VAPID_PRIVATE_KEY?.trim();
  const subject = process.env.VAPID_SUBJECT?.trim() || "mailto:admin@tinytotsofficial.com";
  if (!publicKey || !privateKey) return null;
  return { publicKey, privateKey, subject };
}

export function isPushConfigured(): boolean {
  return getPushConfig() !== null;
}

type StoredSubscription = {
  id: number;
  endpoint: string;
  p256dh: string;
  auth: string;
};

export type OrderPushInput = {
  orderId: number | string;
  orderNumber: string;
  total: number;
  /** e.g. "cod" — shown as an uppercase source tag, no customer data. */
  paymentMethod?: string | null;
};

/**
 * Best-effort push for a newly persisted web order. Returns a small summary;
 * callers should not await-block on it in a way that delays the response
 * (fire-and-forget with .catch), and must never surface its errors.
 */
export async function sendOrderPush(order: OrderPushInput): Promise<{
  configured: boolean;
  attempted: number;
  sent: number;
  failed: number;
  deactivated: number;
}> {
  const base = { configured: false, attempted: 0, sent: 0, failed: 0, deactivated: 0 };

  try {
    const config = getPushConfig();
    if (!config) return base;

    const { data: subs, error } = await supabaseAdmin
      .from("push_subscriptions")
      .select("id, endpoint, p256dh, auth")
      .eq("is_active", true);

    if (error) {
      console.error("[push] failed to load subscriptions:", error.message);
      return { ...base, configured: true };
    }
    const list = (subs || []) as StoredSubscription[];
    if (list.length === 0) return { ...base, configured: true };

    const amount = `Rs. ${Math.round(Number(order.total) || 0).toLocaleString("en-PK")}`;
    const source = (order.paymentMethod || "").toUpperCase();
    const payload = JSON.stringify({
      title: "TinyTots — New Order",
      body: source ? `${order.orderNumber} · ${amount} · ${source}` : `${order.orderNumber} · ${amount}`,
      // Clicking opens the specific order in the protected admin area.
      url: `/admin/orders/${order.orderId}`,
      tag: `order-${order.orderId}`,
    });

    let sent = 0;
    let failed = 0;
    let deactivated = 0;

    await Promise.all(
      list.map(async (sub) => {
        try {
          const details = webpush.generateRequestDetails(
            { endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } },
            payload,
            {
              vapidDetails: {
                subject: config.subject,
                publicKey: config.publicKey,
                privateKey: config.privateKey,
              },
              TTL: 600,
              contentEncoding: "aes128gcm",
            }
          );

          const res = await fetch(details.endpoint, {
            method: details.method,
            headers: details.headers as Record<string, string>,
            body: details.body as unknown as BodyInit,
          });

          if (res.ok) {
            sent += 1;
            await supabaseAdmin
              .from("push_subscriptions")
              .update({ last_success_at: new Date().toISOString() })
              .eq("id", sub.id);
          } else if (res.status === 404 || res.status === 410) {
            deactivated += 1;
            await supabaseAdmin
              .from("push_subscriptions")
              .update({ is_active: false, last_failure_at: new Date().toISOString() })
              .eq("id", sub.id);
          } else {
            failed += 1;
            await supabaseAdmin
              .from("push_subscriptions")
              .update({ last_failure_at: new Date().toISOString() })
              .eq("id", sub.id);
            console.error(`[push] endpoint responded ${res.status} for subscription ${sub.id}`);
          }
        } catch (err) {
          failed += 1;
          console.error(`[push] send failed for subscription ${sub.id}:`, err);
        }
      })
    );

    return { configured: true, attempted: list.length, sent, failed, deactivated };
  } catch (err) {
    // Absolute backstop — sendOrderPush must never throw.
    console.error("[push] sendOrderPush unexpected error:", err);
    return base;
  }
}
