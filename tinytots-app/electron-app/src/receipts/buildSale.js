// src/receipts/buildSale.js

export function buildSale({
  cart,
  subtotal,
  discount = 0,
  tax = 0,
  total,
  receiptNumber = null,
  cashier = "Admin",
  paymentMethod = "Cash",
  cashReceived = total,
  change = 0,
}) {
  return {
    receiptNumber,
    created_at: new Date().toISOString(),
    cashier,
    paymentMethod,
    cashReceived,
    change,
    subtotal,
    discount,
    tax,
    total,
    printed: false,
    synced: false,
    items: cart.map((item) => {
      const qty = Number(item.qty ?? item.quantity ?? 1);
      const price = Number(item.price ?? 0);

      return {
        variant_id: item.variant_id,
        barcode: item.barcode ?? "",
        sku: item.sku ?? "",
        name: item.name ?? "",
        variant: [item.size, item.color].filter(Boolean).join(" / ") || "",
        qty,
        price,
        lineTotal: qty * price,
      };
    }),
  };
}