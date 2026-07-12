import "dotenv/config";
import { createClient } from "@supabase/supabase-js";
import { getState, saveState, clearState, setNeedsHuman } from "../services/conversationState.js";
import { sendMessage, sendButtonMessage } from "./sendMessage.js";
import { createNotification } from "../services/notifications.js";

export const OWNER_PHONE = "923085016378";

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export const PUBLIC_CODE_REGEX = /^[A-Z]-\d+$/i;
export const CART_REGEX = /^cart$/i;
export const DELIVERY_CHARGE = 249;

// ---------------- Helpers ----------------
function formatCart(cart) {
  let lines = [];
  let subtotal = 0;
  cart.forEach((item, i) => {
    const lineTotal = item.price * item.quantity;
    subtotal += lineTotal;
    const sizeText = item.size ? ` (${item.size})` : "";
    lines.push(`${i + 1}) ${item.name}${sizeText} x${item.quantity} — Rs. ${lineTotal.toFixed(2)}`);
  });
  return { text: lines.join("\n"), subtotal };
}

// ---------------- Fast-lane lookup ----------------
export async function handleFastLane(publicCode, senderPhone) {
  const { data, error } = await supabase
    .from("variants")
    .select(`id, size, price, stock, public_code, product:products(name)`)
    .eq("public_code", publicCode)
    .single();

  if (error || !data) {
    return `Code "${publicCode}" not recognized. Please check and try again.`;
  }

  if (data.stock <= 0) {
    return `${data.product.name} (${data.size}) is currently out of stock.`;
  }

  // Preserve any existing cart while we ask for quantity on the new item
  const state = await getState(senderPhone);
  const existingCart = state?.answers?.cart || [];

  await saveState(senderPhone, "awaiting_quantity", {
    cart: existingCart,
    pendingItem: {
      variantId: data.id,
      name: data.product.name,
      size: data.size,
      price: data.price,
      stock: data.stock,
    },
  });

  return `${data.product.name}\nSize: ${data.size}\nPrice: Rs. ${data.price}\nIn stock ✅ (${data.stock} available)\n\nHow many would you like? Reply with a number.`;
}

// ---------------- Quantity reply (adds pending item to cart) ----------------
export async function handleQuantityReply(senderPhone, text) {
  const state = await getState(senderPhone);

  if (!state || state.step !== "awaiting_quantity" || !state.answers?.pendingItem) {
    return "Something went wrong — please send a product code to start again.";
  }

  const trimmed = text.trim();
  const qty = parseInt(trimmed, 10);

  if (!Number.isInteger(qty) || qty <= 0 || String(qty) !== trimmed) {
    return "Please reply with a valid quantity (a whole number, e.g. 1, 2, 3).";
  }

  const { pendingItem, cart = [] } = state.answers;

  if (qty > pendingItem.stock) {
    return `Sorry, only ${pendingItem.stock} in stock. Please reply with a smaller quantity.`;
  }

  // Merge with existing cart line for the same variant, if present
  const existingIndex = cart.findIndex((c) => c.variantId === pendingItem.variantId);
  const updatedCart = [...cart];

  if (existingIndex >= 0) {
    updatedCart[existingIndex] = {
      ...updatedCart[existingIndex],
      quantity: updatedCart[existingIndex].quantity + qty,
    };
  } else {
    updatedCart.push({
      variantId: pendingItem.variantId,
      name: pendingItem.name,
      size: pendingItem.size,
      price: pendingItem.price,
      quantity: qty,
    });
  }

  await saveState(senderPhone, "shopping", { cart: updatedCart });

  const { text: cartText, subtotal } = formatCart(updatedCart);

  return `Added ✅\n\n🛒 Your cart:\n${cartText}\n\nSubtotal: Rs. ${subtotal.toFixed(2)}\n\nSend another product code to add more, CART to review, or BUY to checkout.`;
}

// ---------------- CART command (review anytime) ----------------
export async function handleCartReply(senderPhone) {
  const state = await getState(senderPhone);
  const cart = state?.answers?.cart || [];

  if (cart.length === 0) {
    return "Your cart is empty. Send a product code to add an item.";
  }

  const { text: cartText, subtotal } = formatCart(cart);
  return `🛒 Your cart:\n${cartText}\n\nSubtotal: Rs. ${subtotal.toFixed(2)}\n\nSend another product code to add more, or BUY to checkout.`;
}

// ---------------- BUY reply (checks out the whole cart) ----------------
export async function handleBuyReply(senderPhone) {
  const state = await getState(senderPhone);
  const cart = state?.answers?.cart || [];

  if (cart.length === 0) {
    return "Your cart is empty. Send a product code to add an item first.";
  }

  return finalizeSale(senderPhone, cart);
}

// ---------------- Finalize sale (loops over cart items) ----------------
async function finalizeSale(senderPhone, cart) {
  const subtotal = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const discount = subtotal * 0.05;
  const total = subtotal - discount;
  const receiptNumber = `WA-${Date.now()}`;

  const { data: sale, error: saleError } = await supabase
    .from("sales")
    .insert([{
      receipt_number: receiptNumber,
      subtotal,
      discount,
      tax: 0,
      total,
      status: "pending",
      cashier: "WhatsApp Bot",
      payment_method: null,
      source: "whatsapp",
      customer_phone: senderPhone,
    }])
    .select()
    .single();

  if (saleError) {
    console.error("finalizeSale sales insert error:", saleError);
    return "Something went wrong reserving your order. Please try again.";
  }

  const saleItemsPayload = cart.map((item) => ({
    sale_id: sale.id,
    variant_id: item.variantId,
    quantity: item.quantity,
    unit_price: item.price,
    line_total: item.price * item.quantity,
  }));

  const { error: itemError } = await supabase.from("sale_items").insert(saleItemsPayload);

  if (itemError) {
    console.error("finalizeSale sale_items insert error:", itemError);
    return "Reservation partially failed. Please contact support.";
  }

  // ---- Low-stock notifications for each cart item ----
  // NOTE: stock is already decremented by the `trg_deduct_stock` DB trigger
  // on sale_items insert (deduct_stock() function) — do NOT decrement again
  // here, or stock gets deducted twice.
  for (const item of cart) {
    const { data: variantRow, error: variantFetchError } = await supabase
      .from("variants")
      .select("stock, size, product:products(name)")
      .eq("id", item.variantId)
      .single();

    if (variantFetchError) {
      console.error("finalizeSale variant fetch error:", variantFetchError);
      continue;
    }

    // variantRow.stock already reflects the trigger's deduction at this point
    const newStock = variantRow.stock;

    const itemLabel = `${variantRow.product?.name || "Item"} (${variantRow.size || ""})`;

    if (newStock <= 0) {
      await createNotification({
        category: "inventory",
        priority: "critical",
        title: "Out of Stock",
        description: `${itemLabel} just sold out via WhatsApp.`,
        target_role: "admin",
        action_label: "View Product",
        action_type: "view_product",
        action_payload: { variantId: item.variantId },
      });
    } else if (newStock <= 5) {
      await createNotification({
        category: "inventory",
        priority: "warning",
        title: "Low Stock",
        description: `${itemLabel} has only ${newStock} unit(s) remaining after a WhatsApp sale.`,
        target_role: "admin",
        action_label: "View Product",
        action_type: "view_product",
        action_payload: { variantId: item.variantId },
      });
    }
  }

  await saveState(senderPhone, "awaiting_fulfillment", { saleId: sale.id });

  const { text: cartText } = formatCart(cart);

  return `Reserved ✅\nOrder ID: ${receiptNumber}\n\n${cartText}\n\nSubtotal: Rs. ${subtotal.toFixed(2)}\nWhatsApp discount (5%): -Rs. ${discount.toFixed(2)}\nYour total: Rs. ${total.toFixed(2)}\n\nHow would you like to receive this?\n1) Pickup from store\n2) Delivery`;
}

// ---------------- Restore stock for every item on a sale (used on cancel) ----------------
export async function restoreStockForSale(saleId) {
  const { data: items, error: itemsError } = await supabase
    .from("sale_items")
    .select("variant_id, quantity")
    .eq("sale_id", saleId);

  if (itemsError) {
    console.error("restoreStockForSale fetch error:", itemsError);
    return;
  }

  for (const item of items) {
    const { data: variantRow, error: variantFetchError } = await supabase
      .from("variants")
      .select("stock")
      .eq("id", item.variant_id)
      .single();

    if (variantFetchError) {
      console.error("restoreStockForSale variant fetch error:", variantFetchError);
      continue;
    }

    const restoredStock = variantRow.stock + item.quantity;

    const { error: stockUpdateError } = await supabase
      .from("variants")
      .update({ stock: restoredStock })
      .eq("id", item.variant_id);

    if (stockUpdateError) {
      console.error("restoreStockForSale stock update error:", stockUpdateError);
    }
  }
}

// ---------------- Global cancel (works from any state) ----------------
export async function handleGlobalCancel(senderPhone) {
  const state = await getState(senderPhone);

  if (state?.answers?.saleId) {
    // Stock was already decremented when this sale was finalized —
    // restore it before flipping the sale to cancelled.
    await restoreStockForSale(state.answers.saleId);

    const { error } = await supabase
      .from("sales")
      .update({ status: "cancelled" })
      .eq("id", state.answers.saleId);

    if (error) {
      console.error("handleGlobalCancel sales update error:", error);
      await clearState(senderPhone);
      return "Something went wrong cancelling this order, but your session has been reset. Please try again.";
    }
  }

  const hadCart = state?.answers?.cart?.length > 0;
  await clearState(senderPhone);

  if (state?.answers?.saleId) {
    return "Your current action has been cancelled. Type MENU to start again.";
  }
  if (hadCart) {
    return "Your cart has been cleared. Type MENU to start again.";
  }
  return state
    ? "Your current action has been cancelled. Type MENU to start again."
    : "Nothing active to cancel. Type MENU to see options.";
}

// ---------------- Help / Menu ----------------
export const HELP_REGEX = /^(help|menu)$/i;

export function getHelpMessage() {
  return `👋 Here's what I can help with:\n\n` +
    `🛍️ *Start shopping* — just say Hi or anything, and I'll ask 3 quick questions to find items for you.\n\n` +
    `🔢 *Have a code?* — Text a product code (e.g. T-101) to add it to your cart.\n\n` +
    `🛒 *CART* — review everything in your cart and the running total.\n\n` +
    `✅ *BUY* — checkout your whole cart and reserve it.\n\n` +
    `🚚 *Delivery* — adds a flat Rs. 249 delivery charge to your total.\n\n` +
    `📦 *TRACK ORDER* — check the status of your most recent order.\n\n` +
    `❌ *CANCEL* — clear your cart or cancel whatever you're currently doing.\n\n` +
    `🙋 *TALK TO PERSON* — get connected to a real team member.\n\n` +
    `Type HELP or MENU anytime to see this again.`;
}

// ---------------- Fulfillment reply (pickup/delivery + address) ----------------
export async function handleFulfillmentReply(senderPhone, text) {
  const state = await getState(senderPhone);

  if (!state) {
    return "Something went wrong — please send a product code to start again.";
  }

  const trimmed = text.trim();

  // Note: CANCEL and other global commands are handled in the webhook router
  // before this function is ever reached, so no branches for them are needed here.

  // Step 1: waiting on "1" (pickup) or "2" (delivery)
  if (state.step === "awaiting_fulfillment") {
    const { saleId } = state.answers;

    if (trimmed === "1") {
      const { error } = await supabase
        .from("sales")
        .update({ fulfillment_type: "pickup", status: "reserved" })
        .eq("id", saleId);

      if (error) {
        console.error("handleFulfillmentReply pickup update error:", error);
        return "Something went wrong saving your pickup choice. Please try again.";
      }

      await clearState(senderPhone);
      return "Got it — reserved for pickup. Please collect at our store and mention this order when you arrive.";
    }

    if (trimmed === "2") {
      // Fetch current total so we can add the flat delivery charge on top
      const { data: currentSale, error: fetchError } = await supabase
        .from("sales")
        .select("total")
        .eq("id", saleId)
        .single();

      if (fetchError) {
        console.error("handleFulfillmentReply delivery fetch error:", fetchError);
        return "Something went wrong saving your delivery choice. Please try again.";
      }

      const newTotal = Number(currentSale.total) + DELIVERY_CHARGE;

      const { error } = await supabase
        .from("sales")
        .update({ fulfillment_type: "delivery", total: newTotal })
        .eq("id", saleId);

      if (error) {
        console.error("handleFulfillmentReply delivery update error:", error);
        return "Something went wrong saving your delivery choice. Please try again.";
      }

      await saveState(senderPhone, "awaiting_address", { saleId });
      return `Delivery charge: Rs. ${DELIVERY_CHARGE.toFixed(2)}\nUpdated total: Rs. ${newTotal.toFixed(2)}\n\nPlease send your delivery address (include area/city).`;
    }

    // Anything other than "1" or "2" -> re-ask, don't advance
    return "Please reply with 1 for Pickup or 2 for Delivery.";
  }

  // Step 2: waiting on the delivery address text
  if (state.step === "awaiting_address") {
    const { saleId } = state.answers;

    const { data: sale, error } = await supabase
      .from("sales")
      .update({ delivery_address: trimmed, status: "reserved" })
      .eq("id", saleId)
      .select("total")
      .single();

    if (error) {
      console.error("handleFulfillmentReply address update error:", error);
      return "Something went wrong saving your address. Please try again.";
    }

    await clearState(senderPhone);
    return `Delivery address saved ✅\nYour order is reserved and will be delivered to:\n${trimmed}\n\nFinal total (incl. Rs. ${DELIVERY_CHARGE.toFixed(2)} delivery): Rs. ${Number(sale.total).toFixed(2)}`;
  }

  return "Something went wrong — please send a product code to start again.";
}

// ---------------- Order tracking (all active orders, not just latest) ----------------
export const TRACK_ORDER_REGEX = /^track\s*(your)?\s*order$/i;

export async function handleTrackOrder(senderPhone) {
  const { data, error } = await supabase
    .from("sales")
    .select("receipt_number, status, fulfillment_type, delivery_address, total, created_at")
    .eq("customer_phone", senderPhone)
    .in("status", ["pending", "reserved"])
    .order("created_at", { ascending: false });

  if (error) {
    console.error("handleTrackOrder fetch error:", error);
    return "Something went wrong looking up your orders. Please try again.";
  }

  if (!data || data.length === 0) {
    return "No active orders found for this number.";
  }

  let reply = `You have ${data.length} active order${data.length > 1 ? "s" : ""}:\n\n`;

  data.forEach((order, i) => {
    reply += `${i + 1}) Order ${order.receipt_number}\nStatus: ${order.status}\nTotal: Rs. ${Number(order.total).toFixed(2)}`;
    if (order.fulfillment_type) {
      reply += `\nFulfillment: ${order.fulfillment_type}`;
    }
    if (order.fulfillment_type === "delivery" && order.delivery_address) {
      reply += `\nDelivery address: ${order.delivery_address}`;
    }
    reply += `\n\n`;
  });

  return reply.trim();
}

// ---------------- Owner command: mark an order completed ----------------
export const DONE_REGEX = /^done\s+(\S+)$/i;

export async function handleMarkDone(senderPhone, matchedText) {
  if (senderPhone !== OWNER_PHONE) {
    return "This command is only available to store staff.";
  }

  const match = matchedText.match(DONE_REGEX);
  const orderId = match?.[1];

  if (!orderId) {
    return "Please use the format: DONE WA-xxxxxxxxxx";
  }

  const { data: sale, error: fetchError } = await supabase
    .from("sales")
    .select("id, status, customer_phone, receipt_number")
    .eq("receipt_number", orderId)
    .maybeSingle();

  if (fetchError) {
    console.error("handleMarkDone fetch error:", fetchError);
    return "Something went wrong looking up that order.";
  }

  if (!sale) {
    return `Order ${orderId} not found.`;
  }

  if (sale.status === "completed") {
    return `Order ${orderId} is already marked completed.`;
  }

  if (sale.status !== "reserved") {
    return `Order ${orderId} has status "${sale.status}" — only reserved orders can be marked completed.`;
  }

  const { error: updateError } = await supabase
    .from("sales")
    .update({ status: "completed" })
    .eq("id", sale.id);

  if (updateError) {
    console.error("handleMarkDone update error:", updateError);
    return "Something went wrong marking that order completed.";
  }

  // Best-effort notify the customer; don't fail the owner's command if this fails
  try {
    await sendMessage(
      sale.customer_phone,
      `✅ Your order ${orderId} has been marked as completed. Thank you for shopping with us!`
    );
  } catch (err) {
    console.error("handleMarkDone customer notify error:", err);
  }

  return `Order ${orderId} marked as completed ✅. Customer notified.`;
}

// ---------------- Human handoff ----------------
export const HANDOFF_REGEX = /^talk\s*to\s*person$/i;

export async function handleHandoffRequest(senderPhone) {
  await setNeedsHuman(senderPhone, true);

  try {
    await sendButtonMessage(
      OWNER_PHONE,
      `🙋 Customer requested human help.\nNumber: ${senderPhone}\n\nOpen a chat with them directly, then tap below once you're done helping them.`,
      `resolve:${senderPhone}`,
      "Mark Resolved"
    );
  } catch (err) {
    console.error("Failed to notify owner of handoff:", err);
  }

  return "A team member will contact you here shortly. In the meantime, you can browse more at [your site link]. We won't be able to respond to further WhatsApp messages until then.";
}