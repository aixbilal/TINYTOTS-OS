import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-admin";

export async function POST(req: NextRequest) {
  try {
    const { code, subtotal } = await req.json();

    if (!code || typeof subtotal !== "number") {
      return NextResponse.json(
        { valid: false, error: "Coupon code and cart subtotal are required." },
        { status: 400 }
      );
    }

    const uppercaseCode = code.trim().toUpperCase();

    // 1. Fetch coupon from database
    const { data: coupon, error } = await supabaseAdmin
      .from("coupons")
      .select("*")
      .eq("code", uppercaseCode)
      .single();

    if (error || !coupon) {
      return NextResponse.json(
        { valid: false, error: "Invalid promo code." },
        { status: 404 }
      );
    }

    // 2. Check if coupon is active
    if (!coupon.is_active) {
      return NextResponse.json(
        { valid: false, error: "This promo code is no longer active." },
        { status: 400 }
      );
    }

    // 3. Check expiration date & time
    if (coupon.expires_at) {
      const expirationDate = new Date(coupon.expires_at).getTime();
      const now = new Date().getTime();

      if (now > expirationDate) {
        return NextResponse.json(
          { valid: false, error: "This promo code has expired." },
          { status: 400 }
        );
      }
    }

    // 4. Check usage limits
    if (coupon.max_uses !== null && coupon.uses_count >= coupon.max_uses) {
      return NextResponse.json(
        { valid: false, error: "This promo code has reached its maximum redemption limit." },
        { status: 400 }
      );
    }

    // 5. Check minimum spend requirement
    if (coupon.min_spend > 0 && subtotal < coupon.min_spend) {
      return NextResponse.json(
        {
          valid: false,
          error: `Minimum order subtotal of $${coupon.min_spend.toFixed(2)} required for this code.`,
        },
        { status: 400 }
      );
    }

    // 6. Calculate discount amount
    let discountAmount = 0;
    if (coupon.discount_type === "percentage") {
      discountAmount = (subtotal * coupon.value) / 100;
    } else if (coupon.discount_type === "flat") {
      discountAmount = coupon.value;
    }

    // Ensure discount doesn't exceed total order value
    discountAmount = Math.min(discountAmount, subtotal);

    return NextResponse.json({
      valid: true,
      coupon: {
        id: coupon.id,
        code: coupon.code,
        discount_type: coupon.discount_type,
        value: coupon.value,
        discount_amount: Number(discountAmount.toFixed(2)),
      },
    });
  } catch (err: any) {
    return NextResponse.json(
      { valid: false, error: err.message || "Failed to validate coupon." },
      { status: 500 }
    );
  }
}