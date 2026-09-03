// app/api/v1/whatsapp-notify/route.ts
// Receives order status change events (from a Supabase Database Webhook)
// and sends the matching WhatsApp template notification.

import { NextRequest, NextResponse } from "next/server";
import { timingSafeEqual } from "node:crypto";
import { sendWhatsAppTemplate } from "@/lib/whatsapp-notify/send";
import { getMetaAgentSupabaseClient } from "@/lib/meta-agent/supabase";
import { clientIp, rateLimit, rateLimitResponse } from "@/lib/rate-limit";

const supabase = getMetaAgentSupabaseClient();

// Maps DB order status -> WhatsApp template name
const STATUS_TEMPLATE_MAP: Record<string, string> = {
  new: "order_received",
  processing: "order_confirmed",
  shipped: "order_shipped",
  delivered: "order_delivered",
  cancelled: "order_cancelled",
};

/** Constant-time bearer check — never leaks length via early return timing. */
function bearerMatches(provided: string | null, expected: string): boolean {
  if (!provided) return false;
  const a = Buffer.from(provided);
  const b = Buffer.from(`Bearer ${expected}`);
  if (a.length !== b.length) {
    // Still burn a compare against a fixed-size buffer so a wrong length is
    // not distinguishable by timing from a wrong value.
    timingSafeEqual(b, b);
    return false;
  }
  return timingSafeEqual(a, b);
}

// Formats a Pakistani local number (e.g. "03001234567") into
// WhatsApp's expected international format ("923001234567")
function formatPhoneForWhatsApp(rawPhone: string): string | null {
  if (!rawPhone) return null;
  const digits = rawPhone.replace(/\D/g, "");
  if (digits.startsWith("92") && digits.length === 12) return digits;
  if (digits.startsWith("0") && digits.length === 11) return "92" + digits.slice(1);
  if (digits.length === 10) return "92" + digits;
  return null; // unrecognized format
}

export async function POST(req: NextRequest) {
  // 0. Durable rate limit (shared across serverless instances).
  const limited = await rateLimit(`whatsapp-notify:${clientIp(req)}`, {
    limit: 30,
    windowMs: 60_000,
  });
  if (!limited.ok) return rateLimitResponse(limited.retryAfterSec);

  // 1. Authenticate the caller (constant-time).
  const expectedSecret = process.env.WHATSAPP_NOTIFY_SECRET;
  if (!expectedSecret) {
    console.error("WHATSAPP_NOTIFY_SECRET is not set");
    return NextResponse.json(
      { success: false, error: "server_misconfigured" },
      { status: 500 }
    );
  }
  if (!bearerMatches(req.headers.get("authorization"), expectedSecret)) {
    return NextResponse.json({ success: false, error: "unauthorized" }, { status: 401 });
  }

  // 2. Parse the Supabase webhook payload
  let payload: { record?: Record<string, unknown> };
  try {
    payload = await req.json();
  } catch {
    return NextResponse.json({ success: false, error: "invalid_json" }, { status: 400 });
  }

  const record = payload?.record;
  if (!record || typeof record !== "object" || typeof record.order_number !== "string") {
    return NextResponse.json({ success: false, error: "missing_record" }, { status: 400 });
  }

  // 3. Re-fetch the order server-side. The request payload is treated as a
  //    *hint* only — never as a source of truth. This prevents the endpoint
  //    from being used as an arbitrary WhatsApp-send proxy even if the shared
  //    secret leaks: it can only ever message the phone on a real order, with
  //    that order's real status/total.
  const { data: order, error: orderError } = await supabase
    .from("orders")
    .select(
      `order_number, status, total, guest_name, guest_phone, customer_id,
       customer:customers ( full_name, phone )`
    )
    .eq("order_number", record.order_number)
    .maybeSingle();

  if (orderError) {
    console.error("whatsapp-notify order lookup failed", record.order_number, orderError.message);
    return NextResponse.json({ success: false, error: "order_lookup_failed" }, { status: 500 });
  }
  if (!order) {
    return NextResponse.json({ success: false, error: "order_not_found" }, { status: 404 });
  }

  // Ignore stale / spoofed events: the webhook must reflect the current DB state.
  if (typeof record.status === "string" && record.status !== order.status) {
    return NextResponse.json({ success: true, skipped: true, reason: "stale_status" });
  }

  const templateName = STATUS_TEMPLATE_MAP[order.status];
  if (!templateName) {
    return NextResponse.json({ success: true, skipped: true, reason: "no_template_for_status" });
  }

  // 4. Resolve name + phone from the DB order (not from the request).
  const linkedCustomer = order.customer as unknown as { full_name: string | null; phone: string | null } | null;
  const name = order.guest_name ?? linkedCustomer?.full_name ?? "there";
  const phone = order.guest_phone ?? linkedCustomer?.phone ?? null;
  if (!phone) {
    return NextResponse.json({ success: false, error: "no_phone_number" }, { status: 400 });
  }

  const formattedPhone = formatPhoneForWhatsApp(String(phone));
  if (!formattedPhone) {
    return NextResponse.json({ success: false, error: "invalid_phone_format" }, { status: 400 });
  }

  const total = Number(order.total) || 0;
  const bodyParams = [name, order.order_number, total.toLocaleString("en-PK")];

  const buttons =
    templateName === "order_received"
      ? [
          { type: "quick_reply" as const, payload: `CONFIRM_ORDER_${order.order_number}` },
          { type: "quick_reply" as const, payload: `CANCEL_ORDER_${order.order_number}` },
        ]
      : undefined;

  const result = await sendWhatsAppTemplate({
    to: formattedPhone,
    templateName,
    bodyParams,
    buttons,
  });

  if (!result.success) {
    return NextResponse.json({ success: false, error: result.error }, { status: 500 });
  }

  return NextResponse.json({ success: true, template: templateName, sent_to: formattedPhone });
}
