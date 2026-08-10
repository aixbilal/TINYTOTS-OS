// app/api/v1/whatsapp-webhook/route.ts
// Receives incoming WhatsApp events from Meta (specifically: customer
// button taps on the order_received Confirm/Cancel buttons).
// Verifies Meta's signature on every request before trusting the payload.

import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { getMetaAgentSupabaseClient } from "@/lib/meta-agent/supabase";
import { restoreStockForOrder } from "@/lib/whatsapp-notify/restoreStock";

const supabase = getMetaAgentSupabaseClient();

// --- GET: Meta's one-time webhook verification challenge ---
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const mode = searchParams.get("hub.mode");
  const token = searchParams.get("hub.verify_token");
  const challenge = searchParams.get("hub.challenge");

  const expectedToken = process.env.WHATSAPP_WEBHOOK_VERIFY_TOKEN;

  if (mode === "subscribe" && token === expectedToken) {
    return new NextResponse(challenge, { status: 200 });
  }

  return NextResponse.json({ success: false, error: "verification_failed" }, { status: 403 });
}

// --- POST: actual incoming events (button taps, message status, etc.) ---
export async function POST(req: NextRequest) {
  // 1. Read the raw body as text FIRST — signature verification requires
  // the exact raw bytes, not a re-serialized JSON object.
  const rawBody = await req.text();

  // 2. Verify Meta's signature
  const signatureHeader = req.headers.get("x-hub-signature-256");
  const appSecret = process.env.META_APP_SECRET;

  if (!signatureHeader || !appSecret) {
    return NextResponse.json({ success: false, error: "unauthorized" }, { status: 401 });
  }

  const expectedSignature =
    "sha256=" + crypto.createHmac("sha256", appSecret).update(rawBody).digest("hex");

  const signatureValid = crypto.timingSafeEqual(
    Buffer.from(signatureHeader),
    Buffer.from(expectedSignature)
  );

  if (!signatureValid) {
    console.error("WhatsApp webhook: signature mismatch, rejecting request");
    return NextResponse.json({ success: false, error: "invalid_signature" }, { status: 401 });
  }

  // 3. Now safe to parse the verified body
  let payload: any;
  try {
    payload = JSON.parse(rawBody);
  } catch {
    return NextResponse.json({ success: false, error: "invalid_json" }, { status: 400 });
  }

  // 4. Extract the button reply, if this event contains one.
  // Meta's payload shape: entry[0].changes[0].value.messages[0].button.payload
  try {
    const entry = payload?.entry?.[0];
    const change = entry?.changes?.[0];
    const message = change?.value?.messages?.[0];
    const buttonPayload: string | undefined = message?.button?.payload;

    if (!buttonPayload) {
      // Not a button-tap event (could be a delivery receipt, read receipt,
      // regular text message, etc.) — acknowledge and ignore.
      return NextResponse.json({ success: true, skipped: true });
    }

    // 5. Parse our own payload format: "CONFIRM_ORDER_<order_number>" or "CANCEL_ORDER_<order_number>"
    const confirmMatch = buttonPayload.match(/^CONFIRM_ORDER_(.+)$/);
    const cancelMatch = buttonPayload.match(/^CANCEL_ORDER_(.+)$/);

    if (confirmMatch) {
      const orderNumber = confirmMatch[1];
      const { error } = await supabase
        .from("orders")
        .update({ status: "processing" })
        .eq("order_number", orderNumber)
        .eq("status", "new"); // only transition if still 'new' — avoid overwriting later states

      if (error) {
        console.error("Failed to confirm order", orderNumber, error);
        return NextResponse.json({ success: false, error: "update_failed" }, { status: 500 });
      }

      return NextResponse.json({ success: true, action: "confirmed", order_number: orderNumber });
    }

    if (cancelMatch) {
        const orderNumber = cancelMatch[1];
  
        // Fetch the order id first (needed for the stock restore lookup)
        const { data: orderRow, error: fetchError } = await supabase
          .from("orders")
          .select("id, status")
          .eq("order_number", orderNumber)
          .single();
  
        if (fetchError || !orderRow) {
          console.error("Cancel: order not found", orderNumber, fetchError);
          return NextResponse.json({ success: false, error: "order_not_found" }, { status: 404 });
        }
  
        if (orderRow.status !== "new") {
          // Already progressed past 'new' — don't cancel or restore stock
          return NextResponse.json({ success: true, skipped: true, reason: "order_not_in_new_status" });
        }
  
        const { error: updateError } = await supabase
          .from("orders")
          .update({ status: "cancelled" })
          .eq("id", orderRow.id)
          .eq("status", "new");
  
        if (updateError) {
          console.error("Failed to cancel order", orderNumber, updateError);
          return NextResponse.json({ success: false, error: "update_failed" }, { status: 500 });
        }
  
        const restoreResult = await restoreStockForOrder(supabase, orderRow.id, orderNumber);
        if (!restoreResult.success) {
          // Status is already cancelled at this point — log loudly so a human
          // can restore stock manually, but don't fail the whole webhook response.
          console.error(
            "Order cancelled but stock restore FAILED — manual fix needed:",
            orderNumber,
            restoreResult.error
          );
        }
  
        return NextResponse.json({
          success: true,
          action: "cancelled",
          order_number: orderNumber,
          stock_restored: restoreResult.success,
        });
      }

    // Button payload didn't match our expected format
    return NextResponse.json({ success: true, skipped: true, reason: "unrecognized_payload" });
  } catch (err) {
    console.error("Error processing WhatsApp webhook event:", err);
    return NextResponse.json({ success: false, error: "processing_error" }, { status: 500 });
  }
}