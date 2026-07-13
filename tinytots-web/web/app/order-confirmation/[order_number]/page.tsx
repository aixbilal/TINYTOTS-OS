import { supabaseAdmin as supabase } from "@/lib/supabase-admin";
import Link from "next/link";

async function getOrder(orderNumber: string) {
  const { data: order, error } = await supabase
    .from("orders")
    .select(
      `
      id,
      order_number,
      guest_name,
      guest_phone,
      shipping_address,
      shipping_city,
      status,
      payment_method,
      cod_tier,
      cod_token_amount,
      subtotal,
      delivery_fee,
      discount_total,
      total,
      created_at,
      order_items (
        id,
        quantity,
        unit_price,
        line_total,
        variants (
          size,
          color,
          products ( name )
        )
      )
    `
    )
    .eq("order_number", orderNumber)
    .single();

  if (error) return null;
  return order;
}

function codTierMessage(tier: string | null, tokenAmount: number) {
  if (!tier) return null;
  if (tier === "full_cod") {
    return "No advance payment needed — pay the full amount on delivery.";
  }
  if (tier === "token_percent") {
    return `Please pay Rs. ${tokenAmount.toLocaleString()} (10% token) in advance to confirm this order. The rest is due on delivery.`;
  }
  if (tier === "token_flat") {
    return `Please pay a Rs. ${tokenAmount.toLocaleString()} token in advance to confirm this order, or pay the full amount online instead. The rest is due on delivery.`;
  }
  return null;
}

export default async function OrderConfirmationPage({
  params,
}: {
  params: Promise<{ order_number: string }>;
}) {
  const { order_number } = await params;
  const order = await getOrder(order_number);

  if (!order) {
    return (
      <div className="max-w-2xl mx-auto px-6 py-12">
        <p className="text-zinc-500">
          We couldn't find that order. Please check the order number.
        </p>
      </div>
    );
  }

  const codMessage =
    order.payment_method === "cod"
      ? codTierMessage(order.cod_tier, order.cod_token_amount)
      : null;

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-black">
      <main className="max-w-2xl mx-auto px-6 py-12">
        <div className="text-center mb-8">
          <p className="text-3xl mb-2">✓</p>
          <h1 className="text-2xl font-semibold text-black dark:text-white">
            Order placed successfully
          </h1>
          <p className="text-sm text-zinc-500 mt-1">
            Order number: <span className="font-medium">{order.order_number}</span>
          </p>
        </div>

        {codMessage && (
          <div className="mb-6 border border-amber-300 dark:border-amber-700 bg-amber-50 dark:bg-amber-950 rounded-lg p-4 text-sm text-amber-800 dark:text-amber-200">
            {codMessage}
          </div>
        )}

        <div className="border border-zinc-200 dark:border-zinc-800 rounded-lg p-5 mb-6">
          <h2 className="font-medium text-black dark:text-white mb-3">
            Items
          </h2>
          <div className="space-y-3">
            {order.order_items.map((item: any) => (
              <div key={item.id} className="flex justify-between text-sm">
                <div>
                  <p className="text-black dark:text-white">
                    {item.variants?.products?.name}
                  </p>
                  <p className="text-zinc-500">
                    {item.variants?.size ?? "One Size"}
                    {item.variants?.color ? ` / ${item.variants.color}` : ""}
                    {" × "}
                    {item.quantity}
                  </p>
                </div>
                <p className="text-black dark:text-white">
                  Rs. {item.line_total.toLocaleString()}
                </p>
              </div>
            ))}
          </div>

          <div className="border-t border-zinc-200 dark:border-zinc-800 mt-4 pt-4 space-y-1 text-sm">
            <div className="flex justify-between text-zinc-500">
              <span>Subtotal</span>
              <span>Rs. {order.subtotal.toLocaleString()}</span>
            </div>
            <div className="flex justify-between text-zinc-500">
              <span>Delivery</span>
              <span>
                {order.delivery_fee > 0
                  ? `Rs. ${order.delivery_fee.toLocaleString()}`
                  : "Free"}
              </span>
            </div>
            {order.discount_total > 0 && (
              <div className="flex justify-between text-zinc-500">
                <span>Discount</span>
                <span>−Rs. {order.discount_total.toLocaleString()}</span>
              </div>
            )}
            <div className="flex justify-between font-semibold text-black dark:text-white pt-1">
              <span>Total</span>
              <span>Rs. {order.total.toLocaleString()}</span>
            </div>
          </div>
        </div>

        <div className="border border-zinc-200 dark:border-zinc-800 rounded-lg p-5 mb-6 text-sm">
          <h2 className="font-medium text-black dark:text-white mb-2">
            Shipping to
          </h2>
          <p className="text-zinc-500">{order.guest_name}</p>
          <p className="text-zinc-500">{order.guest_phone}</p>
          <p className="text-zinc-500">
            {order.shipping_address}, {order.shipping_city}
          </p>
        </div>

        <Link
          href={`/track-order?order_number=${order.order_number}`}
          className="block text-center w-full py-3 rounded border border-zinc-300 dark:border-zinc-700 text-black dark:text-white font-medium mb-3"
        >
          Track this order
        </Link>
        <Link
          href="/"
          className="block text-center w-full py-3 rounded bg-black text-white dark:bg-white dark:text-black font-medium"
        >
          Continue shopping
        </Link>
      </main>
    </div>
  );
}