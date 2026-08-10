// lib/whatsapp-notify/restoreStock.ts
// Restores variant stock for a cancelled order's line items.
// Guards against double-restoring via the orders.stock_restored flag.

import { SupabaseClient } from "@supabase/supabase-js";

export async function restoreStockForOrder(
  supabase: SupabaseClient,
  orderId: number,
  orderNumber: string
): Promise<{ success: boolean; error?: string }> {
  // 1. Check if already restored (idempotency guard)
  const { data: order, error: orderError } = await supabase
    .from("orders")
    .select("stock_restored")
    .eq("id", orderId)
    .single();

  if (orderError || !order) {
    console.error("restoreStockForOrder: failed to load order", orderNumber, orderError);
    return { success: false, error: "order_lookup_failed" };
  }

  if (order.stock_restored) {
    // Already restored previously — safe no-op, not an error
    return { success: true };
  }

  // 2. Get all line items for this order
  const { data: items, error: itemsError } = await supabase
    .from("order_items")
    .select("variant_id, quantity")
    .eq("order_id", orderId);

  if (itemsError) {
    console.error("restoreStockForOrder: failed to load order_items", orderNumber, itemsError);
    return { success: false, error: "items_lookup_failed" };
  }

  if (!items || items.length === 0) {
    console.error("restoreStockForOrder: no line items found for order", orderNumber);
    return { success: false, error: "no_items_found" };
  }

  // 3. Restore stock for each variant, one at a time
  for (const item of items) {
    const { data: variant, error: variantError } = await supabase
      .from("variants")
      .select("stock")
      .eq("id", item.variant_id)
      .single();

    if (variantError || !variant) {
      console.error(
        "restoreStockForOrder: failed to load variant",
        item.variant_id,
        "for order",
        orderNumber,
        variantError
      );
      return { success: false, error: "variant_lookup_failed" };
    }

    const newStock = variant.stock + item.quantity;

    const { error: updateError } = await supabase
      .from("variants")
      .update({ stock: newStock })
      .eq("id", item.variant_id);

    if (updateError) {
      console.error(
        "restoreStockForOrder: failed to update stock for variant",
        item.variant_id,
        "order",
        orderNumber,
        updateError
      );
      return { success: false, error: "stock_update_failed" };
    }
  }

  // 4. Mark the order as restored so this never runs twice
  const { error: flagError } = await supabase
    .from("orders")
    .update({ stock_restored: true })
    .eq("id", orderId);

  if (flagError) {
    console.error("restoreStockForOrder: failed to set stock_restored flag", orderNumber, flagError);
    return { success: false, error: "flag_update_failed" };
  }

  return { success: true };
}