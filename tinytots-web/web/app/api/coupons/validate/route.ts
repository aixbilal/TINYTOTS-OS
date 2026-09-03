import { apiErrorResponse } from "@/lib/api-error";
import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-admin";
import { clientIp, rateLimit, rateLimitResponse } from "@/lib/rate-limit";

/**
 * POST /api/coupons/validate — public storefront helper.
 * Returns only validity + the discount that would apply for the given subtotal.
 * Does not expose usage counts, max uses, or other internal coupon fields.
 */
export async function POST(req: NextRequest) {
  // Throttle automated coupon-code guessing / enumeration.
  const limited = await rateLimit(`coupon-validate:${clientIp(req)}`, {
    limit: 15,
    windowMs: 60_000,
  });
  if (!limited.ok) return rateLimitResponse(limited.retryAfterSec);

  try {
    const { code, subtotal } = await req.json();

    if (!code || typeof subtotal !== "number") {
      return NextResponse.json(
        { valid: false, error: "Coupon code and cart subtotal are required." },
        { status: 400 }
      );
    }

    const uppercaseCode = String(code).trim().toUpperCase();

    const { data: coupon, error } = await supabaseAdmin
      .from("coupons")
      .select("code, discount_type, value, is_active, expires_at, max_uses, uses_count, min_spend")
      .eq("code", uppercaseCode)
      .maybeSingle();

    if (error || !coupon) {
      return NextResponse.json(
        { valid: false, error: "Invalid promo code." },
        { status: 404 }
      );
    }

    if (!coupon.is_active) {
      return NextResponse.json(
        { valid: false, error: "This promo code is no longer active." },
        { status: 400 }
      );
    }

    if (coupon.expires_at) {
      const expirationDate = new Date(coupon.expires_at).getTime();
      if (Date.now() > expirationDate) {
        return NextResponse.json(
          { valid: false, error: "This promo code has expired." },
          { status: 400 }
        );
      }
    }

    if (coupon.max_uses !== null && coupon.uses_count >= coupon.max_uses) {
      return NextResponse.json(
        { valid: false, error: "This promo code has reached its maximum redemption limit." },
        { status: 400 }
      );
    }

    const minSpend = Number(coupon.min_spend ?? 0);
    if (minSpend > 0 && subtotal < minSpend) {
      return NextResponse.json(
        {
          valid: false,
          error: `Minimum order subtotal of Rs. ${minSpend.toFixed(0)} required for this code.`,
        },
        { status: 400 }
      );
    }

    let discountAmount = 0;
    if (coupon.discount_type === "percentage") {
      discountAmount = (subtotal * Number(coupon.value)) / 100;
    } else if (coupon.discount_type === "flat") {
      discountAmount = Number(coupon.value);
    }
    discountAmount = Math.min(discountAmount, subtotal);

    return NextResponse.json({
      valid: true,
      coupon: {
        code: coupon.code,
        discount_type: coupon.discount_type,
        value: Number(coupon.value),
        discount_amount: Number(discountAmount.toFixed(2)),
      },
    });
  } catch (err: unknown) {
    const res = apiErrorResponse(err, 500, "coupons/validate");
    const body = await res.json();
    return NextResponse.json({ valid: false, ...body }, { status: 500 });
  }
}
