// app/api/v1/whatsapp-notify/route.ts
// Receives order status change events (from a Supabase Database Webhook)
// and sends the matching WhatsApp template notification.

import { NextRequest, NextResponse } from "next/server";
import { sendWhatsAppTemplate } from "@/lib/whatsapp-notify/send";

// Simple in-memory rate limiter — resets on cold start, per-instance only.
// Not bulletproof under serverless scale-out, but blocks casual abuse cheaply.
const requestLog: number[] = [];
const RATE_LIMIT_WINDOW_MS = 60_000; // 1 minute
const RATE_LIMIT_MAX_REQUESTS = 30; // generous — real order volume won't hit this

function isRateLimited(): boolean {
  const now = Date.now();
  while (requestLog.length > 0 && requestLog[0] < now - RATE_LIMIT_WINDOW_MS) {
    requestLog.shift();
  }
  if (requestLog.length >= RATE_LIMIT_MAX_REQUESTS) {
    return true;
  }
  requestLog.push(now);
  return false;
}
import { getMetaAgentSupabaseClient } from "@/lib/meta-agent/supabase";

const supabase = getMetaAgentSupabaseClient();
// Maps DB order status -> WhatsApp template name
const STATUS_TEMPLATE_MAP: Record<string, string> = {
  new: "order_received",
  processing: "order_confirmed",
  shipped: "order_shipped",
  delivered: "order_delivered",
  cancelled: "order_cancelled",
};

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
    // 0. Rate limit check
    if (isRateLimited()) {
      return NextResponse.json({ success: false, error: "rate_limited" }, { status: 429 });
    }
  
    // 1. Authenticate the caller
    const authHeader = req.headers.get("authorization");
  const expectedSecret = process.env.WHATSAPP_NOTIFY_SECRET;

  if (!expectedSecret || authHeader !== `Bearer ${expectedSecret}`) {
    return NextResponse.json({ success: false, error: "unauthorized" }, { status: 401 });
  }

  // 2. Parse the Supabase webhook payload
  let payload: any;
  try {
    payload = await req.json();
  } catch {
    return NextResponse.json({ success: false, error: "invalid_json" }, { status: 400 });
  }

  const record = payload?.record;
  if (!record || typeof record !== "object") {
    return NextResponse.json({ success: false, error: "missing_record" }, { status: 400 });
  }

  const status: string = record.status;
  const orderNumber: string = record.order_number;
  const total: number = record.total;
  const customerId: number | null = record.customer_id;
  const guestName: string | null = record.guest_name;
  const guestPhone: string | null = record.guest_phone;

  if (!status || !orderNumber || total === undefined) {
    return NextResponse.json({ success: false, error: "incomplete_order_data" }, { status: 400 });
  }

  // 3. Map status to template
  const templateName = STATUS_TEMPLATE_MAP[status];
  if (!templateName) {
    // Not a status we send a notification for — not an error, just skip
    return NextResponse.json({ success: true, skipped: true, reason: "no_template_for_status" });
  }

  // 4. Resolve customer name + phone (guest vs registered customer)
  let name = guestName;
  let phone = guestPhone;

  if (!phone && customerId) {
    const { data: customer, error } = await supabase
      .from("customers")
      .select("full_name, phone")
      .eq("id", customerId)
      .single();

    if (error || !customer) {
      console.error("Failed to look up customer for order", orderNumber, error);
      return NextResponse.json({ success: false, error: "customer_lookup_failed" }, { status: 500 });
    }

    name = customer.full_name;
    phone = customer.phone;
  }

  if (!phone) {
    console.error("No phone number available for order", orderNumber);
    return NextResponse.json({ success: false, error: "no_phone_number" }, { status: 400 });
  }

  const formattedPhone = formatPhoneForWhatsApp(phone);
  if (!formattedPhone) {
    console.error("Unrecognized phone format for order", orderNumber, phone);
    return NextResponse.json({ success: false, error: "invalid_phone_format" }, { status: 400 });
  }

  // 5. Build template parameters: {{1}}=name, {{2}}=order number, {{3}}=total
  const bodyParams = [name || "there", orderNumber, total.toLocaleString("en-PK")];

  // order_received includes Confirm/Cancel quick reply buttons
  const buttons =
    templateName === "order_received"
      ? [
          { type: "quick_reply" as const, payload: `CONFIRM_ORDER_${orderNumber}` },
          { type: "quick_reply" as const, payload: `CANCEL_ORDER_${orderNumber}` },
        ]
      : undefined;

  // 6. Send it
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