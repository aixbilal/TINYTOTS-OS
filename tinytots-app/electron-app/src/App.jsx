import { printReceipt } from "./receipts/printReceipt";
import { useState, useEffect } from "react";
import ScannerListener from "./components/ScannerListener";
import Header from "./components/Header";
import ProductGrid from "./components/ProductGrid";
import CartSidebar from "./components/CartSidebar";
import { buildSale } from "./receipts/buildSale";
import {
  queueSale,
  syncQueuedSales,
  getQueueCount,
} from "./services/offlineQueue";
import useNetworkStatus from "./hooks/useNetworkStatus";

function App() {
  const isOnline = useNetworkStatus();

  console.log("Network Status:", isOnline ? "Online" : "Offline");

  const [products, setProducts] = useState([]);
  const [cart, setCart] = useState([]);
  const [pendingSales, setPendingSales] = useState(getQueueCount());

  useEffect(() => {
    async function loadProducts() {
      try {
        const res = await fetch("http://localhost:3000/api/products");
        if (!res.ok) throw new Error("fetch failed");
        const data = await res.json();
        setProducts(data);
        localStorage.setItem("tiny_tots_products_cache", JSON.stringify(data));
      } catch (err) {
        console.error("Failed to load products, using cache:", err);
        const cached = localStorage.getItem("tiny_tots_products_cache");
        setProducts(cached ? JSON.parse(cached) : []);
      }
    }
    loadProducts();
  }, []);

  useEffect(() => {
    async function syncSales() {
      if (isOnline) {
        await syncQueuedSales();
        setPendingSales(getQueueCount());
      }
    }

    syncSales();
  }, [isOnline]);

  function addToCart(product) {
    // Don't allow out-of-stock items
    if (product.stock <= 0) {
      alert(
        `${product.name}\n\n${product.color} / ${product.size}\n\nThis item is out of stock.`
      );
      return;
    }

    setCart((prevCart) => {
      const existing = prevCart.find(
        (item) => item.variant_id === product.variant_id
      );

      // Don't allow quantity greater than available stock
      if (existing) {
        if (existing.qty >= product.stock) {
          alert(
            `Only ${product.stock} item(s) available for:\n\n${product.name}\n${product.color} / ${product.size}`
          );
          return prevCart;
        }

        return prevCart.map((item) =>
          item.variant_id === product.variant_id
            ? { ...item, qty: item.qty + 1 }
            : item
        );
      }

      return [...prevCart, { ...product, qty: 1 }];
    });
  }

  // Prints via Electron's webContents.print(). This is intentionally
  // the ONLY print path in the app — it works purely over local IPC,
  // so it doesn't care whether the backend or internet is reachable.
  async function printViaElectron(sale) {
    try {
      await printReceipt(sale);
      return { printed: true };
    } catch (printError) {
      console.error("Printing failed:", printError);
      return { printed: false, error: printError.message };
    }
  }

  async function checkout(subtotal, tax, total) {
    if (cart.length === 0) {
      alert("Cart is empty.");
      return;
    }

    try {
      const response = await fetch("http://localhost:3000/api/checkout", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          cart,
          subtotal,
          tax,
          total,
        }),
      });

      const result = await response.json();

      if (!result.success) {
        alert(result.error || result.message);
        return;
      }

      // ---------------- ONLINE: sale already confirmed in the DB ----------------

      const sale = buildSale({
        cart,
        subtotal,
        tax,
        total,
        receiptNumber: result.receipt_number,
      });

      const printResult = await printViaElectron(sale);

      if (printResult.printed) {
        alert(`Sale Completed!\nReceipt: ${result.receipt_number}`);
      } else {
        alert(
          `Sale completed, but printing failed:\n${printResult.error}\n\nReceipt: ${result.receipt_number}`
        );
      }

      setCart([]);
    } catch (error) {
      console.error("Checkout failed - no internet:", error);

      // ---------------- OFFLINE: queue the sale, but still print immediately ----------------
      // The customer still needs a physical receipt right now. We build one
      // locally from the cart (no backend/internet required) with a temporary
      // offline receipt number. The real receipt_number is assigned once
      // syncQueuedSales() reaches the server later.

      const offlineReceiptNumber = `OFFLINE-${Date.now()}`;

      const sale = buildSale({
        cart,
        subtotal,
        tax,
        total,
        receiptNumber: offlineReceiptNumber,
      });

      queueSale({
        cart,
        subtotal,
        tax,
        total,
        offlineReceiptNumber,
      });

      setPendingSales(getQueueCount());

      const printResult = await printViaElectron(sale);

      if (printResult.printed) {
        alert(
          `No internet connection.\n\nSale saved locally and receipt printed.\nTemporary Receipt: ${offlineReceiptNumber}\n\nIt will sync automatically once you're back online.`
        );
      } else {
        alert(
          `No internet connection.\n\nSale saved locally, but printing failed:\n${printResult.error}\n\nIt will sync automatically once you're back online.`
        );
      }

      setCart([]);
    }
  }

  return (
    <div className="min-h-screen bg-gray-100">
      <ScannerListener cart={cart} setCart={setCart} />

      <Header />

      <div className="bg-white border-b px-6 py-2 flex justify-between items-center text-sm">
        <div>
          {isOnline ? (
            <span className="text-green-600 font-semibold">🟢 Online</span>
          ) : (
            <span className="text-red-600 font-semibold">🔴 Offline</span>
          )}
        </div>

        <div className="font-medium">Pending Sales: {pendingSales}</div>
      </div>

      <div className="grid grid-cols-3 gap-6 p-6">
        <div className="col-span-2">
          <ProductGrid products={products} onAdd={addToCart} />
        </div>

        <div>
          <CartSidebar cart={cart} onCheckout={checkout} />
        </div>
      </div>
    </div>
  );
}

export default App;
