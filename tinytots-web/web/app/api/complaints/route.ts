import { apiErrorResponse } from "@/lib/api-error";
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { supabaseAdmin } from "@/lib/supabase-admin";
import { clientIp, rateLimit, rateLimitResponse } from "@/lib/rate-limit";
import { isValidPakPhoneServer, normalizePakPhone, PAK_PHONE_ERROR } from "@/lib/validate-phone";
import { forceIpv4Outbound } from "@/lib/force-ipv4";

void forceIpv4Outbound();

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

const VALID_TYPES = ["return", "product_issue", "delivery_issue", "other"];
const VALID_PREFERRED_REFUND_METHODS = ["voucher", "original_payment"];
const MAX_MESSAGE_LEN = 1000;

export async function POST(req: NextRequest) {
  const limited = await rateLimit(`complaint:${clientIp(req)}`, {
    limit: 8,
    windowMs: 60_000,
  });
  if (!limited.ok) return rateLimitResponse(limited.retryAfterSec);

  try {
    const body = await req.json();
    const {
      order_id,
      reporter_name,
      reporter_phone,
      type,
      message,
      order_item_ids,
      photo_url,
      preferred_refund_method,
    } = body;
    // Ignore body.customer_id — derive from Bearer token when present.

    if (!message || typeof message !== "string" || !message.trim()) {
      return NextResponse.json({ error: "Please describe your issue." }, { status: 400 });
    }
    if (message.trim().length > MAX_MESSAGE_LEN) {
      return NextResponse.json(
        { error: `Message must be under ${MAX_MESSAGE_LEN} characters.` },
        { status: 400 }
      );
    }
    if (type && !VALID_TYPES.includes(type)) {
      return NextResponse.json({ error: "Invalid complaint type." }, { status: 400 });
    }
    if (preferred_refund_method && !VALID_PREFERRED_REFUND_METHODS.includes(preferred_refund_method)) {
      return NextResponse.json({ error: "Invalid preferred_refund_method." }, { status: 400 });
    }

    const authHeader = req.headers.get("authorization");
    const token = authHeader?.replace(/^Bearer\s+/i, "")?.trim() || "";

    let customerId: number | null = null;

    if (token) {
      const supabaseAuth = createClient(supabaseUrl, supabaseAnonKey);
      const { data: userData, error: userError } = await supabaseAuth.auth.getUser(token);
      if (userError || !userData?.user) {
        return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
      }

      const { data: customer, error: customerError } = await supabaseAdmin
        .from("customers")
        .select("id")
        .eq("auth_user_id", userData.user.id)
        .maybeSingle();

      if (customerError || !customer) {
        return NextResponse.json(
          { error: "Customer record not found for this account." },
          { status: 404 }
        );
      }
      customerId = customer.id;
    } else {
      if (!reporter_name || typeof reporter_name !== "string" || !reporter_name.trim()) {
        return NextResponse.json(
          { error: "Name is required for guest submissions." },
          { status: 400 }
        );
      }
      if (!reporter_phone || typeof reporter_phone !== "string" || !reporter_phone.trim()) {
        return NextResponse.json(
          { error: "Phone number is required for guest complaints." },
          { status: 400 }
        );
      }
      if (!isValidPakPhoneServer(reporter_phone.trim())) {
        return NextResponse.json({ error: PAK_PHONE_ERROR }, { status: 400 });
      }
    }

    // order_item_ids are only meaningful in the context of a referenced order.
    const rawItemIds = Array.isArray(order_item_ids)
      ? order_item_ids.map((v: unknown) => Number(v)).filter((v: number) => Number.isInteger(v) && v > 0)
      : [];
    let safeOrderItemIds: number[] = [];

    if (order_id) {
      // Confirm the order exists AND that the reporter is entitled to it —
      // an authenticated caller must own it; a guest must present the phone
      // the order was placed with. Never let a caller attach a complaint to
      // an arbitrary order id.
      const { data: order } = await supabaseAdmin
        .from("orders")
        .select("id, customer_id, guest_phone")
        .eq("id", order_id)
        .maybeSingle();
      if (!order) {
        return NextResponse.json({ error: "Order not found." }, { status: 400 });
      }

      if (customerId) {
        if (order.customer_id !== customerId) {
          return NextResponse.json(
            { error: "This order is not associated with your account." },
            { status: 403 }
          );
        }
      } else {
        const reporterPhone = normalizePakPhone(reporter_phone);
        const orderPhone = normalizePakPhone(order.guest_phone);
        if (!reporterPhone || !orderPhone || reporterPhone !== orderPhone) {
          return NextResponse.json(
            { error: "The phone number provided does not match this order." },
            { status: 403 }
          );
        }
      }

      // Every submitted order_item_id must belong to this order.
      if (rawItemIds.length > 0) {
        const { data: itemRows } = await supabaseAdmin
          .from("order_items")
          .select("id")
          .eq("order_id", order_id);
        const allowed = new Set((itemRows ?? []).map((r) => r.id));
        if (rawItemIds.some((id) => !allowed.has(id))) {
          return NextResponse.json(
            { error: "One or more selected items do not belong to this order." },
            { status: 400 }
          );
        }
        safeOrderItemIds = rawItemIds;
      }
    }

    const { data: complaint, error } = await supabaseAdmin
      .from("complaints")
      .insert({
        customer_id: customerId,
        order_id: order_id ?? null,
        reporter_name: customerId ? null : reporter_name?.trim() || null,
        reporter_phone: customerId ? null : reporter_phone?.trim() || null,
        type: type || "other",
        message: message.trim(),
        order_item_ids: safeOrderItemIds,
        photo_url: photo_url || null,
        preferred_refund_method: type === "return" ? preferred_refund_method || null : null,
      })
      .select()
      .single();

    if (error) {
      return apiErrorResponse(error, 500, "complaints");
    }

    return NextResponse.json({ complaint }, { status: 201 });
  } catch (err: unknown) {
    return apiErrorResponse(err, 400, "complaints");
  }
}
