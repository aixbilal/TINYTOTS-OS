const STORAGE_KEY = "tiny_tots_pending_sales";

export function getQueuedSales() {
  const data = localStorage.getItem(STORAGE_KEY);

  if (!data) {
    return [];
  }

  try {
    return JSON.parse(data);
  } catch {
    return [];
  }
}

export function queueSale(sale) {
  const queue = getQueuedSales();

  queue.push({
    id: Date.now(),
    created_at: new Date().toISOString(),
    ...sale,
  });

  localStorage.setItem(STORAGE_KEY, JSON.stringify(queue));
}

export function removeQueuedSale(id) {
  const queue = getQueuedSales().filter((sale) => sale.id !== id);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(queue));
}

export function clearQueue() {
  localStorage.removeItem(STORAGE_KEY);
}

export async function syncQueuedSales() {
  const queue = getQueuedSales();

  if (queue.length === 0) {
    console.log("No pending sales to sync.");
    return;
  }

  console.log(`Syncing ${queue.length} pending sale(s)...`);

  for (const sale of queue) {
    try {
      const response = await fetch("http://localhost:3000/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          cart: sale.cart,
          subtotal: sale.subtotal,
          discount: sale.discount ?? 0,
          tax: sale.tax,
          total: sale.total,
          cashier: sale.cashier,
          paymentMethod: sale.paymentMethod,
          notes: sale.notes,
        }),
      });

      const result = await response.json();

      if (!result.success) {
        console.error("Sync failed:", result);
        continue;
      }

      removeQueuedSale(sale.id);

      console.log("Synced sale:", result.receipt_number);
    } catch (error) {
      console.error("Sync stopped:", error);
      break;
    }
  }

  console.log("Sync finished.");
}

export function getQueueCount() {
  return getQueuedSales().length;
}