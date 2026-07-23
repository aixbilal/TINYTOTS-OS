import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin as supabase } from "@/lib/supabase-admin";

// Cities where COD is currently allowed. Expand this list later
// (e.g. add more cities, or switch to an "all Pakistan" flag) —
// this is the only place that needs to change.
const COD_ALLOWED_CITIES = [
  "lahore",
  "islamabad",
  "rawalpindi", // twin city with Islamabad, commonly bundled in
  "faisalabad",
  "multan",
  "gujranwala",
  "sialkot",
  "sargodha",
  "bahawalpur",
  "sheikhupura",
];

const DELIVERY_FEE = 249;
const FREE_DELIVERY_ORDER_LIMIT = 5;

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
  try {
    const body = await request.json();
    const {
      items, // [{ variant_id, quantity }]
      shipping_address,
      shipping_city,
      payment_method, // 'jazzcash' | 'easypaisa' | 'card' | 'cod'
      customer_id, // optional, null for guest
      guest_name,
      guest_phone,
      coupon_code,
    } = body;

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
    if (!["jazzcash", "easypaisa", "card", "cod"].includes(payment_method)) {
      return NextResponse.json(
        { error: "Invalid payment method." },
        { status: 400 }
      );
    }
    if (!customer_id && (!guest_name || !guest_phone)) {
      return NextResponse.json(
        { error: "guest_name and guest_phone are required for guest checkout" },
        { status: 400 }
      );
    }
    if (guest_phone) {
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

    // COD city restriction
    if (payment_method === "cod") {
      const cityNormalized = shipping_city.trim().toLowerCase();
      if (!COD_ALLOWED_CITIES.includes(cityNormalized)) {
        return NextResponse.json(
          {
            error:
              "Cash on Delivery is currently only available in select cities (Punjab & Islamabad). Please choose Card, JazzCash, or Easypaisa instead.",
          },
          { status: 400 }
        );
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
      return NextResponse.json({ error: variantError.message }, { status: 500 });
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

 // Coupon validation — active, not expired, under max_uses, subtotal meets min_spend
 let discountTotal = 0;
 let appliedCouponCode: string | null = null;
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
     }
   }
 }

    // Delivery fee: free for first 5 orders per signed-in customer, else Rs. 249.
    // Guests always pay delivery.
    let deliveryFee = DELIVERY_FEE;
    if (customer_id) {
      const { data: customer } = await supabase
        .from("customers")
        .select("orders_count")
        .eq("id", customer_id)
        .single();

      if (customer && customer.orders_count < FREE_DELIVERY_ORDER_LIMIT) {
        deliveryFee = 0;
      }
    }

    const total = subtotal + deliveryFee - discountTotal;

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
          total,
          coupon_code: appliedCouponCode,
        },
      ])
      .select()
      .single();

      if (orderError) {
        return NextResponse.json({ error: orderError.message }, { status: 500 });
      }
  
      // Insert order_items — this triggers the deduct_stock_order function automatically
      if (appliedCouponCode) {
        await supabase.rpc("increment_coupon_uses", { p_code: appliedCouponCode });
      }
  
      // Insert order_items — this triggers the deduct_stock_order function automatically
    const itemsToInsert = orderItems.map((item) => ({
      ...item,
      order_id: order.id,
    }));

    const { error: itemsError } = await supabase
      .from("order_items")
      .insert(itemsToInsert);

    if (itemsError) {
      // Roll back the order if items failed to insert, to avoid an orphaned empty order
      await supabase.from("orders").delete().eq("id", order.id);
      return NextResponse.json({ error: itemsError.message }, { status: 500 });
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
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Invalid request" },
      { status: 400 }
    );
  }
}