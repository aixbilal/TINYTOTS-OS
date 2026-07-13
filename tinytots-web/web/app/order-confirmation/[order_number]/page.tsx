import { supabaseAdmin as supabase } from "@/lib/supabase-admin";
import Link from "next/link";

async function getOrder(orderNumber: string) {
  const { data: order, error } = await supabase
    .from("orders")
    .select(
      `
      id, order_number, guest_name, guest_phone, shipping_address, shipping_city,
      status, payment_method, cod_tier, cod_token_amount, subtotal, delivery_fee,
      discount_total, total, created_at,
      order_items ( id, quantity, unit_price, line_total,
        variants ( size, color, products ( name ) )
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
  if (tier === "full_cod") return "No advance payment needed — pay the full amount on delivery.";
  if (tier === "token_percent")
    return `Please pay Rs. ${tokenAmount.toLocaleString()} (10% token) in advance to confirm this order. The rest is due on delivery.`;
  if (tier === "token_flat")
    return `Please pay a Rs. ${tokenAmount.toLocaleString()} token in advance to confirm this order, or pay the full amount online instead. The rest is due on delivery.`;
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
      <main className="max-w-2xl mx-auto px-margin-mobile md:px-margin-desktop py-stack-lg">
        <p className="text-on-surface-variant font-body-md text-body-md">
          We couldn&apos;t find that order. Please check the order number.
        </p>
      </main>
    );
  }

  const codMessage =
    order.payment_method === "cod" ? codTierMessage(order.cod_tier, order.cod_token_amount) : null;

  return (
    <main className="max-w-2xl mx-auto px-margin-mobile md:px-margin-desktop py-stack-lg">
      <div className="text-center mb-stack-md">
        <span className="material-symbols-outlined text-[56px] text-[#4C9A6A]">check_circle</span>
        <h1 className="font-display-md text-display-md text-on-surface mt-2">
          Order placed successfully
        </h1>
        <p className="font-body-sm text-body-sm text-on-surface-variant mt-1">
          Order number: <span className="font-semibold text-on-surface">{order.order_number}</span>
        </p>
      </div>

      {codMessage && (
        <div className="mb-stack-md border border-[#D9822B]/40 bg-[#D9822B]/10 rounded-xl p-4 font-body-sm text-body-sm text-[#8a5417]">
          {codMessage}
        </div>
      )}

      <div className="border border-outline-variant/30 rounded-xl p-5 mb-stack-sm bg-surface-container-lowest">
        <h2 className="font-headline-md text-headline-md text-on-surface mb-3">Items</h2>
        <div className="flex flex-col gap-3">
          {order.order_items.map((item: any) => (
            <div key={item.id} className="flex justify-between font-body-sm text-body-sm">
              <div>
                <p className="text-on-surface">{item.variants?.products?.name}</p>
                <p className="text-on-surface-variant">
                  {item.variants?.size ?? "One Size"}
                  {item.variants?.color ? ` / ${item.variants.color}` : ""} × {item.quantity}
                </p>
              </div>
              <p className="text-on-surface">Rs. {item.line_total.toLocaleString()}</p>
            </div>
          ))}
        </div>

        <div className="border-t border-outline-variant/30 mt-4 pt-4 flex flex-col gap-1 font-body-sm text-body-sm">
          <div className="flex justify-between text-on-surface-variant">
            <span>Subtotal</span>
            <span>Rs. {order.subtotal.toLocaleString()}</span>
          </div>
          <div className="flex justify-between text-on-surface-variant">
            <span>Delivery</span>
            <span>{order.delivery_fee > 0 ? `Rs. ${order.delivery_fee.toLocaleString()}` : "Free"}</span>
          </div>
          {order.discount_total > 0 && (
            <div className="flex justify-between text-on-surface-variant">
              <span>Discount</span>
              <span>−Rs. {order.discount_total.toLocaleString()}</span>
            </div>
          )}
          <div className="flex justify-between font-semibold text-on-surface pt-1">
            <span>Total</span>
            <span>Rs. {order.total.toLocaleString()}</span>
          </div>
        </div>
      </div>

      <div className="border border-outline-variant/30 rounded-xl p-5 mb-stack-md font-body-sm text-body-sm bg-surface-container-lowest">
        <h2 className="font-headline-md text-headline-md text-on-surface mb-2">Shipping to</h2>
        <p className="text-on-surface-variant">{order.guest_name}</p>
        <p className="text-on-surface-variant">{order.guest_phone}</p>
        <p className="text-on-surface-variant">{order.shipping_address}, {order.shipping_city}</p>
      </div>

      <Link
        href={`/track-order?order_number=${order.order_number}`}
        className="block text-center w-full py-3 rounded-xl border border-outline text-on-surface font-button text-button hover:bg-surface-container-low transition-colors mb-3"
      >
        Track this order
      </Link>
      <Link
        href="/"
        className="block text-center w-full py-4 rounded-xl bg-primary-container text-on-primary font-button text-button hover:bg-primary transition-colors"
      >
        Continue shopping
      </Link>
    </main>
  );
}