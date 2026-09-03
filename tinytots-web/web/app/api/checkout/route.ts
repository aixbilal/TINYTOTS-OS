import { apiErrorResponse } from "@/lib/api-error";
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { supabaseAdmin as supabase } from "@/lib/supabase-admin";
import { getSettingNumber, getSetting } from "@/lib/settings";
import { clientIp, rateLimit, rateLimitResponse } from "@/lib/rate-limit";
import { forceIpv4Outbound } from "@/lib/force-ipv4";

void forceIpv4Outbound();

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

const CHECKOUT_WINDOW_MS = 15 * 60 * 1000;
const CHECKOUT_LIMIT = 20;

function calculateCodTier(orderTotal: number) {
  if (orderTotal < 5000) {
    return { cod_tier: "full_cod", cod_token_amount: 0 };
  }
  if (orderTotal <= 10000) {
    return {
      cod_tier: "token_percent",
      cod_token_amount: Math.round(orderTotal * 0.1),
    };
  }
  // above 10,000: flat Rs. 2,000 token (or full online payment, handled by payment_method choice)
  return { cod_tier: "token_flat", cod_token_amount: 2000 };
}

export async function POST(request: NextRequest) {
  const limited = await rateLimit(`checkout:${clientIp(request)}`, {
    limit: CHECKOUT_LIMIT,
    windowMs: CHECKOUT_WINDOW_MS,
  });
  if (!limited.ok) return rateLimitResponse(limited.retryAfterSec);

  try {
    const body = await request.json();
    const {
      items, // [{ variant_id, quantity }]
      shipping_address,
      shipping_city,
      payment_method, // 'jazzcash' | 'easypaisa' | 'card' | 'cod'
      guest_name,
      guest_phone,
      coupon_code,
      voucher_id,
      referral_code,
    } = body;
    // Ignore body.customer_id entirely — spoofable. Logged-in identity comes
    // only from the Bearer token; guests leave customer_id null.

    if (!items || !Array.isArray(items) || items.length === 0) {
      return NextResponse.json({ error: "Cart is empty" }, { status: 400 });
    }
    if (!shipping_address || !shipping_city || !payment_method) {
      return NextResponse.json(
        { error: "shipping_address, shipping_city, and payment_method are required" },
        { status: 400 }
      );
    }
    if (shipping_address.trim().length < 10) {
      return NextResponse.json(
        { error: "Please provide a complete shipping address (house/street/area)." },
        { status: 400 }
      );
    }
    if (payment_method !== "cod") {
      return NextResponse.json(
        { error: "Online payment methods are coming soon — please use Cash on Delivery for now." },
        { status: 400 }
      );
    }

    const authHeader = request.headers.get("authorization");
    const token = authHeader?.replace(/^Bearer\s+/i, "")?.trim() || "";

    let customer_id: number | null = null;

    if (token) {
      const supabaseAuth = createClient(supabaseUrl, supabaseAnonKey);
      const { data: userData, error: userError } = await supabaseAuth.auth.getUser(token);
      if (userError || !userData?.user) {
        return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
      }

      const { data: customer, error: customerError } = await supabase
        .from("customers")
        .select("id, phone")
        .eq("auth_user_id", userData.user.id)
        .maybeSingle();

      if (customerError || !customer) {
        return NextResponse.json(
          { error: "Customer record not found for this account." },
          { status: 404 }
        );
      }
      if (!customer.phone?.trim()) {
        return NextResponse.json(
          {
            error:
              "Please add a phone number to your account before checking out",
          },
          { status: 400 }
        );
      }
      customer_id = customer.id;
    } else {
      if (!guest_name || !guest_phone) {
        return NextResponse.json(
          { error: "guest_name and guest_phone are required for guest checkout" },
          { status: 400 }
        );
      }
    }

    if (!customer_id && guest_phone) {
      const phoneDigits = guest_phone.replace(/[\s-]/g, "");
      const pakMobilePattern = /^(?:\+92|0)3\d{9}$/;
      if (!pakMobilePattern.test(phoneDigits)) {
        return NextResponse.json(
          { error: "Please enter a valid Pakistani mobile number (e.g. 03001234567)." },
          { status: 400 }
        );
      }
    }
    for (const cartItem of items) {
      if (
        !cartItem.variant_id ||
        !Number.isInteger(cartItem.quantity) ||
        cartItem.quantity < 1
      ) {
        return NextResponse.json(
          { error: "Each item must have a valid variant_id and a quantity of at least 1." },
          { status: 400 }
        );
      }
    }

    // COD city restriction — driven by app_settings.cod_city_mode instead of
    // a hardcoded array. "all_pakistan" skips the check entirely; "list"
    // (default) checks against the admin-managed shipping_cities table.
    if (payment_method === "cod") {
      const codCityMode = await getSetting("cod_city_mode");
      if (codCityMode !== "all_pakistan") {
        const cityNormalized = shipping_city.trim().toLowerCase();
        const { data: allowedCity } = await supabase
          .from("shipping_cities")
          .select("id")
          .eq("name", cityNormalized)
          .maybeSingle();

        if (!allowedCity) {
          return NextResponse.json(
            {
              error:
                "Cash on Delivery is currently only available in select cities. Online payment options are coming soon — please check back or contact us for help with your order.",
            },
            { status: 400 }
          );
        }
      }
    }

    // Fetch live variant data to validate stock and get authoritative prices
    // (never trust prices sent from the client)
    const variantIds = items.map((i: any) => i.variant_id);
    const { data: variants, error: variantError } = await supabase
    .from("variants")
    .select("id, price, web_price, stock, product_id, cost_price")
    .in("id", variantIds);

    if (variantError) {
      return apiErrorResponse(variantError, 500, "checkout");
    }

    // Validate stock and build order_items with authoritative prices
    const orderItems: {
      variant_id: number;
      quantity: number;
      unit_price: number;
      unit_cost_price: number | null;
      line_total: number;
    }[] = [];

    let subtotal = 0;

    for (const cartItem of items) {
      const variant = variants?.find((v) => v.id === cartItem.variant_id);
      if (!variant) {
        return NextResponse.json(
          { error: `Variant ${cartItem.variant_id} not found` },
          { status: 400 }
        );
      }
      if (variant.stock < cartItem.quantity) {
        return NextResponse.json(
          {
            error: `Insufficient stock for variant ${variant.id}. Only ${variant.stock} left.`,
          },
          { status: 400 }
        );
      }

      const authoritativePrice = variant.web_price ?? variant.price;
      const lineTotal = authoritativePrice * cartItem.quantity;
      subtotal += lineTotal;

      orderItems.push({
        variant_id: variant.id,
        quantity: cartItem.quantity,
        unit_price: authoritativePrice,
        unit_cost_price: variant.cost_price ?? null,
        line_total: lineTotal,
      });
    }

 // Coupon validation — active, not expired, under max_uses, subtotal meets min_spend.
 // Final claim is atomic via increment_coupon_uses(p_coupon_id) after the order row exists.
 let discountTotal = 0;
 let appliedCouponCode: string | null = null;
 let appliedCouponId: number | null = null;
 if (coupon_code) {
   const { data: coupon } = await supabase
     .from("coupons")
     .select("*")
     .eq("code", coupon_code)
     .eq("is_active", true)
     .single();

   if (coupon) {
     const notExpired =
       !coupon.expires_at || new Date(coupon.expires_at) > new Date();
     const underMaxUses =
       coupon.max_uses === null || coupon.uses_count < coupon.max_uses;
     const meetsMinSpend = subtotal >= (coupon.min_spend ?? 0);

     if (notExpired && underMaxUses && meetsMinSpend) {
       discountTotal =
         coupon.discount_type === "percentage"
           ? Math.round(subtotal * (coupon.value / 100))
           : coupon.value;
       appliedCouponCode = coupon.code;
       appliedCouponId = coupon.id;
     }
   }
 }

  // Voucher validation — must belong to this customer, be unused, and not expired
  let voucherAmount = 0;
  let validatedVoucherId: number | null = null;
  if (voucher_id && customer_id) {
    const { data: voucher } = await supabase
      .from("vouchers")
      .select("*")
      .eq("id", voucher_id)
      .eq("customer_id", customer_id)
      .eq("is_used", false)
      .single();

    if (voucher) {
      const notExpired = new Date(voucher.expires_at) > new Date();
      if (notExpired) {
        voucherAmount = voucher.amount;
        validatedVoucherId = voucher.id;
      }
    }
  }
// Referral validation — works for both logged-in customers (first order
    // only) and guests (identified by phone, one redemption per phone ever).
    let validatedReferrerId: number | null = null;
    let referralReferaeePhone: string | null = null;

    if (referral_code) {
      const { data: referrer } = await supabase
        .from("customers")
        .select("id, phone")
        .eq("referral_code", referral_code.trim().toUpperCase())
        .single();

      if (referrer) {
        if (customer_id) {
          // Logged-in path: must be their first order, and can't refer themselves.
          const { data: referringCustomer } = await supabase
            .from("customers")
            .select("id, orders_count")
            .eq("id", customer_id)
            .single();

          const isFirstOrder = referringCustomer?.orders_count === 0;
          if (isFirstOrder && referrer.id !== customer_id) {
            validatedReferrerId = referrer.id;
          }
        } else if (guest_phone) {
          // Guest path: can't redeem your own code, and each phone can only
          // redeem a referral once — enforced again at insert by the unique
          // index, this check just avoids a wasted round trip.
          const guestPhoneDigits = guest_phone.replace(/[\s-]/g, "");
          const referrerPhoneDigits = referrer.phone?.replace(/[\s-]/g, "");

          if (guestPhoneDigits !== referrerPhoneDigits) {
            const { data: alreadyUsed } = await supabase
              .from("referrals")
              .select("id")
              .eq("referee_phone", guestPhoneDigits)
              .maybeSingle();

            if (!alreadyUsed) {
              validatedReferrerId = referrer.id;
              referralReferaeePhone = guestPhoneDigits;
            }
          }
        }
      }
    }
  // Referee gets an instant discount for using a valid referral code —
    // separate from the referrer's later admin-approved reward.
    let refereeDiscount = 0;
    if (validatedReferrerId) {
      refereeDiscount = await getSettingNumber("referee_discount_amount");
    }

    // Cap coupon + referral discount together as a % of subtotal, so stacking
    // marketing incentives can't eat the whole order. Vouchers are excluded
    // from this cap — a voucher is already-earned customer value and always
    // applies in full, never silently reduced.
    const maxDiscountPercent = await getSettingNumber("max_discount_percent_of_subtotal");
    const marketingDiscountCap = Math.round(subtotal * (maxDiscountPercent / 100));
    const requestedMarketingDiscount = discountTotal + refereeDiscount;

    if (requestedMarketingDiscount > marketingDiscountCap) {
      // Coupon takes priority (it's the more deliberate marketing lever),
      // referral discount absorbs the reduction, down to zero if needed.
      const cappedCouponDiscount = Math.min(discountTotal, marketingDiscountCap);
      const remainingForReferral = Math.max(0, marketingDiscountCap - cappedCouponDiscount);

      discountTotal = cappedCouponDiscount;
      refereeDiscount = Math.min(refereeDiscount, remainingForReferral);
    }
    // Delivery fee: free for everyone, always.
    const deliveryFee = 0;

    const total = Math.max(0, subtotal + deliveryFee - discountTotal - voucherAmount - refereeDiscount);

    // COD tier logic
    let codTier: string | null = null;
    let codTokenAmount = 0;
    if (payment_method === "cod") {
      const tier = calculateCodTier(total);
      codTier = tier.cod_tier;
      codTokenAmount = tier.cod_token_amount;
    }

    const orderNumber = `ORD-${Date.now()}`;

    // Create the order
    const { data: order, error: orderError } = await supabase
      .from("orders")
      .insert([
        {
          order_number: orderNumber,
          customer_id: customer_id ?? null,
          guest_name: customer_id ? null : guest_name,
          guest_phone: customer_id ? null : guest_phone,
          shipping_address,
          shipping_city,
          payment_method,
          cod_tier: codTier,
          cod_token_amount: codTokenAmount,
          subtotal,
          delivery_fee: deliveryFee,
          discount_total: discountTotal,
          referral_discount: refereeDiscount,
          total,
          coupon_code: appliedCouponCode,
          voucher_id: validatedVoucherId,
        },
      ])
      .select()
      .single();

      if (orderError) {
        return apiErrorResponse(orderError, 500, "checkout");
      }

    // Insert order_items — trg_deduct_stock_order_item locks the variant and
    // decrements stock. customers.orders_count was already +1'd by the orders
    // insert trigger (and is -1'd if we delete the order on failure below).
    const itemsToInsert = orderItems.map((item) => ({
      ...item,
      order_id: order.id,
    }));

    const { error: itemsError } = await supabase
      .from("order_items")
      .insert(itemsToInsert);

    if (itemsError) {
      // Roll back the empty order (restores orders_count via DELETE trigger)
      await supabase.from("orders").delete().eq("id", order.id);
      return apiErrorResponse(itemsError, 500, "checkout");
    }

    // Atomic coupon claim after stock is reserved. On failure, remove items
    // (restores stock) then the order (restores orders_count).
    if (appliedCouponId) {
      const { data: couponClaimed, error: couponIncrementError } = await supabase.rpc(
        "increment_coupon_uses",
        { p_coupon_id: appliedCouponId }
      );
      if (couponIncrementError || couponClaimed !== true) {
        await supabase.from("order_items").delete().eq("order_id", order.id);
        await supabase.from("orders").delete().eq("id", order.id);
        if (couponIncrementError) {
          return apiErrorResponse(couponIncrementError, 409, "checkout");
        }
        return NextResponse.json(
          {
            error: "This promo code is no longer available. Please remove it and try again.",
          },
          { status: 409 }
        );
      }
    }

    // Mark voucher as used only after items (+ coupon) succeeded.
    if (validatedVoucherId) {
      const { error: voucherFlagError } = await supabase
        .from("vouchers")
        .update({ is_used: true })
        .eq("id", validatedVoucherId);
      if (voucherFlagError) {
        console.error(
          `Order ${order.id}: failed to flag voucher ${validatedVoucherId} as used:`,
          voucherFlagError.message
        );
      }
    }
 // Link the referral now that the order is confirmed placed. Reward stays
      // unissued (reward_triggered: false) until admin approves it. Works for
      // both logged-in referees (referee_customer_id set now) and guests
      // (referee_phone set now, referee_customer_id backfilled automatically
      // by trg_link_guest_referral if/when they later create an account).
      if (validatedReferrerId) {
        const { error: referralInsertError } = await supabase.from("referrals").insert({
          referrer_customer_id: validatedReferrerId,
          referee_customer_id: customer_id ?? null,
          referee_phone: customer_id ? null : referralReferaeePhone,
          referral_code: referral_code.trim().toUpperCase(),
          order_id: order.id,
          reward_triggered: false,
        });

        if (referralInsertError) {
          console.error("Referral link failed for order", order.id, referralInsertError.message);
        }
      }

    return NextResponse.json(
      {
        success: true,
        data: {
          order_id: order.id,
          order_number: order.order_number,
          total: order.total,
          cod_tier: codTier,
          cod_token_amount: codTokenAmount,
        },
      },
      { status: 201 }
    );
  } catch (err) {
    return apiErrorResponse(err, 400, "checkout");
  }
}