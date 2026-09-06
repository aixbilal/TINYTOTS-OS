// POS.jsx
import { useEffect, useState } from "react";
import {
  ScanBarcode, Search, Trash2, X, Minus, Plus,
  Wallet, CreditCard, Smartphone, MoreHorizontal, Lock, Printer as PrinterIcon,
} from "lucide-react";
import ScannerListener from "../components/ScannerListener";
import SearchProductModal from "../components/pos/SearchProductModal";
import Button from "../components/ui/Button";
import Badge from "../components/ui/Badge";
import Dialog from "../components/ui/Dialog";
import { receiptConfig } from "../receipts/receiptConfig";
import { buildSale } from "../receipts/buildSale";
import { printReceipt } from "../receipts/printReceipt";
import {
  queueSale,
  syncQueuedSales,
  getQueueCount,
  getFailedSales,
  removeQueuedSale,
  retrySale,
} from "../services/offlineQueue";
import { apiFetch } from "../services/api";
import useNetworkStatus from "../hooks/useNetworkStatus";

const PAYMENT_METHODS = [
  { key: "cash", label: "Cash", icon: Wallet },
  { key: "card", label: "Card", icon: CreditCard },
  { key: "upi", label: "UPI", icon: Smartphone },
  { key: "wallet", label: "Wallet", icon: Wallet },
  { key: "other", label: "Other", icon: MoreHorizontal },
];

const TAX_RATE = receiptConfig.taxRatePercent / 100;

export default function POS() {
  // Dashboard/logout navigation now lives in AppShell's persistent Sidebar —
  // POS no longer needs its own back/logout control.
  const isOnline = useNetworkStatus();

  const [products, setProducts] = useState([]);
  const [cart, setCart] = useState([]);
  const [cashier, setCashier] = useState("");
  const [notes, setNotes] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("cash");
  const [discount, setDiscount] = useState(0);
  const [discountType, setDiscountType] = useState("flat"); // "flat" | "percent"
  const [searchOpen, setSearchOpen] = useState(false);
  const [pendingSales, setPendingSales] = useState(getQueueCount());
  const [processing, setProcessing] = useState(false);
  const [failedSales, setFailedSales] = useState(getFailedSales());
  const [showPending, setShowPending] = useState(false);

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
        setFailedSales(getFailedSales());
      }
    }
    syncSales();
  }, [isOnline]);

  function addToCart(product) {
    if (product.stock <= 0) {
      alert(`${product.name}\n\n${product.color} / ${product.size}\n\nThis item is out of stock.`);
      return;
    }
    setCart((prev) => {
      const existing = prev.find((item) => item.variant_id === product.variant_id);
      if (existing) {
        if (existing.qty >= product.stock) {
          alert(`Only ${product.stock} item(s) available for:\n\n${product.name}\n${product.color} / ${product.size}`);
          return prev;
        }
        return prev.map((item) =>
          item.variant_id === product.variant_id ? { ...item, qty: item.qty + 1 } : item
        );
      }
      return [...prev, { ...product, qty: 1 }];
    });
  }

  function changeQty(variantId, delta) {
    setCart((prev) =>
      prev
        .map((item) => {
          if (item.variant_id !== variantId) return item;
          const next = item.qty + delta;
          if (next > item.stock) {
            alert(`Only ${item.stock} item(s) available.`);
            return item;
          }
          return { ...item, qty: next };
        })
        .filter((item) => item.qty > 0)
    );
  }

  function removeFromCart(variantId) {
    setCart((prev) => prev.filter((item) => item.variant_id !== variantId));
  }

  const subtotal = cart.reduce((sum, item) => sum + item.price * item.qty, 0);

  // 1. Calculate automatic database-driven discount per variant scanned
  const autoDiscountAmount = cart.reduce(
    (sum, item) => sum + item.price * item.qty * ((Number(item.discount_percent) || 0) / 100),
    0
  );

  // 2. Calculate any manual discount applied by the cashier on top
  const manualDiscountAmount =
    discountType === "percent" ? (subtotal * (Number(discount) || 0)) / 100 : Number(discount) || 0;

  // 3. Combine both discounts together
  const discountAmount = autoDiscountAmount + manualDiscountAmount;
  const taxableAmount = Math.max(subtotal - discountAmount, 0);
  const tax = taxableAmount * TAX_RATE;
  const total = taxableAmount + tax;

  async function printViaElectron(sale) {
    try {
      await printReceipt(sale);
      return { printed: true };
    } catch (err) {
      return { printed: false, error: err.message };
    }
  }

  async function handleOpenDrawer() {
    if (!window.electron?.openCashDrawer) {
      alert("Cash drawer control isn't available in this build.");
      return;
    }
    const result = await window.electron.openCashDrawer();
    if (!result.success) {
      alert(`Couldn't open the drawer automatically: ${result.error}\n\nMany printers also auto-open on receipt print — check your printer's settings.`);
    }
  }

  async function checkout() {
    if (cart.length === 0) {
      alert("Cart is empty.");
      return;
    }
    if (!cashier.trim()) {
      alert("Enter the cashier's name before checking out.");
      return;
    }

    // Generated once, before any network attempt, and reused on every
    // retry (including offline sync later) so the server can recognize
    // a repeated attempt instead of creating a duplicate sale.
    const clientSaleId = crypto.randomUUID();

    setProcessing(true);
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 8000);

      const res = await apiFetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        signal: controller.signal,
        body: JSON.stringify({
          client_sale_id: clientSaleId,
          cart,
          manual_discount: discount,
          manual_discount_type: discountType,
          cashier, paymentMethod, notes,
        }),
      });
      clearTimeout(timeout);

      if (!res.ok) {
        throw new Error(`Checkout failed with status ${res.status}`);
      }

      const result = await res.json();

      if (!result.success) {
        alert(result.error || result.message);
        return;
      }

      const sale = buildSale({
        cart,
        subtotal: result.subtotal,
        discount: result.discount,
        tax: result.tax,
        total: result.total,
        receiptNumber: result.receipt_number, cashier, paymentMethod,
      });

      const printResult = await printViaElectron(sale);
      alert(
        printResult.printed
          ? `Sale Completed!\nReceipt: ${result.receipt_number}`
          : `Sale completed, but printing failed:\n${printResult.error}\n\nReceipt: ${result.receipt_number}`
      );

      resetCart();
    } catch (err) {
      // Offline fallback (or the network genuinely dropped) — still print
      // locally and queue the sync, reusing the SAME clientSaleId. If the
      // original request actually reached the server before the connection
      // died, the server will recognize this id on retry and just return
      // the existing sale instead of creating a second one.
      const offlineReceiptNumber = `OFFLINE-${Date.now()}`;
      const sale = buildSale({
        cart, subtotal, discount: discountAmount, tax, total,
        receiptNumber: offlineReceiptNumber, cashier, paymentMethod,
      });

      queueSale(
        {
          cart,
          manual_discount: discount,
          manual_discount_type: discountType,
          cashier,
          paymentMethod,
          notes,
          offlineReceiptNumber,
          // Display-only snapshot for the pending panel; server recomputes on sync.
          total,
        },
        clientSaleId
      );
      setPendingSales(getQueueCount());

      const printResult = await printViaElectron(sale);
      alert(
        printResult.printed
          ? `No internet connection.\n\nSale saved locally and receipt printed.\nTemporary Receipt: ${offlineReceiptNumber}\n\nIt will sync automatically once you're back online.`
          : `No internet connection.\n\nSale saved locally, but printing failed:\n${printResult.error}`
      );

      resetCart();
    } finally {
      setProcessing(false);
    }
  }

  function resetCart() {
    setCart([]);
    setNotes("");
    setDiscount(0);
  }

  const now = new Date();
  const formatPKR = (v) => `Rs. ${Number(v || 0).toLocaleString("en-PK", { maximumFractionDigits: 0 })}`;

  return (
    <div className="flex flex-col gap-4">
      <ScannerListener products={products} onScan={addToCart} />

      {/* Session / status bar */}
      <div className="flex flex-wrap items-center gap-x-8 gap-y-3 rounded-2xl border border-gold-300/30 bg-white px-6 py-4 shrink-0">
        <SessionField label="Cashier">
          <input
            value={cashier}
            onChange={(e) => setCashier(e.target.value)}
            placeholder="Enter cashier name"
            className="font-semibold text-ink-900 bg-transparent outline-none border-b border-dashed border-ink-900/30 focus:border-maroon-700 w-40"
          />
        </SessionField>
        <SessionField label="Shop" value={receiptConfig.store.name} />
        <SessionField
          label="Date"
          value={now.toLocaleDateString(undefined, { day: "2-digit", month: "long", year: "numeric" })}
        />
        <SessionField label="Day" value={now.toLocaleDateString(undefined, { weekday: "long" })} />
        <SessionField label="Address" value={receiptConfig.store.address} wide />

        <div className="ml-auto flex items-center gap-3">
          <Badge variant={isOnline ? "success" : "warning"}>
            {isOnline ? "Online" : "Offline"}
            {pendingSales > 0 && ` · ${pendingSales} pending`}
          </Badge>
          {(pendingSales > 0 || failedSales.length > 0) && (
            <button onClick={() => setShowPending(true)} className="type-caption text-ink-700 hover:underline">
              View queue{failedSales.length > 0 ? ` (${failedSales.length} need attention)` : ""}
            </button>
          )}
          <Button variant="secondary" size="sm" onClick={handleOpenDrawer}>
            <PrinterIcon size={14} /> Cash Drawer
          </Button>
        </div>
      </div>

      {/* Main workspace: scan/search + notes (left) / cart + checkout (right) */}
      <div className="flex flex-col lg:flex-row gap-4">
        {/* LEFT — scan/search entry + order notes */}
        <div className="flex flex-1 min-w-0 flex-col gap-4">
          <div className="flex items-center gap-4 rounded-2xl border border-gold-300/30 bg-white px-6 py-5 shrink-0">
            <div className="w-11 h-11 rounded-full bg-maroon-100 flex items-center justify-center text-maroon-700 shrink-0">
              <ScanBarcode size={20} strokeWidth={1.6} />
            </div>
            <div className="flex-1 min-w-0">
              <p className="type-card-title text-ink-900">Scan or search a product</p>
              <p className="type-body-sm text-ink-700/70">
                Scanner is active — scan a barcode any time, or search by name or SKU.
              </p>
            </div>
            <Button variant="secondary" onClick={() => setSearchOpen(true)}>
              <Search size={15} /> Search
            </Button>
          </div>

          <div className="flex-1 min-h-[120px] rounded-2xl border border-gold-300/30 bg-white px-6 py-5 flex flex-col">
            <h3 className="type-card-title text-ink-900 mb-3">Order Notes</h3>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Add order notes…"
              className="flex-1 w-full bg-transparent outline-none text-sm resize-none placeholder:text-ink-700/40 text-ink-900"
            />
          </div>
        </div>

        {/* RIGHT — cart + checkout. max-height (not a forced height) caps the panel on
            tall viewports so the item list scrolls internally while payment/summary/
            checkout stay put — on short viewports the panel just sizes to its content
            instead of being stretched. overflow-y-auto (not -hidden) on the panel
            itself is a last-resort fallback: if a viewport is so short that even the
            header+footer alone can't fit, the whole panel scrolls as a unit rather
            than silently clipping the checkout button. */}
        <div className="w-full lg:w-[400px] shrink-0 flex flex-col rounded-2xl border border-gold-300/30 bg-white overflow-y-auto lg:max-h-[calc(100vh-230px)]">
          <div className="flex items-center justify-between px-5 py-4 border-b border-gold-300/30 shrink-0">
            <h2 className="type-section text-maroon-800">Cart ({cart.length})</h2>
            {cart.length > 0 && (
              <button
                onClick={() => setCart([])}
                className="type-caption text-maroon-700 hover:underline inline-flex items-center gap-1.5"
              >
                <Trash2 size={13} /> Clear
              </button>
            )}
          </div>

          {/* min-h-0 (not a fixed floor) so this area always yields to the payment/
              summary/checkout footer below — the footer must never be clipped. */}
          <div className="flex-1 min-h-0 overflow-y-auto">
            {cart.length === 0 ? (
              <p className="text-center text-ink-700/60 py-8 px-6 text-sm">
                Cart is empty — scan an item or search to add one.
              </p>
            ) : (
              <div className="divide-y divide-gold-300/20">
                {cart.map((item) => (
                  <div key={item.variant_id} className="flex items-center gap-3 px-4 py-3">
                    <div className="w-10 h-10 rounded-lg bg-cream-100 border border-gold-300/30 flex-shrink-0 overflow-hidden">
                      {item.image_url && (
                        <img src={item.image_url} alt="" className="w-full h-full object-cover" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="type-body-sm font-medium text-ink-900 truncate">{item.name}</p>
                      <p className="type-caption text-ink-700/60 truncate">
                        {[item.size, item.color].filter(Boolean).join(" / ") || item.sku}
                      </p>
                    </div>
                    <div className="flex items-center gap-1 shrink-0">
                      <button
                        onClick={() => changeQty(item.variant_id, -1)}
                        className="w-6 h-6 rounded-md border border-gold-300/50 flex items-center justify-center hover:bg-cream-100 text-ink-700"
                      >
                        <Minus size={12} />
                      </button>
                      <span className="w-5 text-center text-sm text-ink-900">{item.qty}</span>
                      <button
                        onClick={() => changeQty(item.variant_id, 1)}
                        className="w-6 h-6 rounded-md border border-gold-300/50 flex items-center justify-center hover:bg-cream-100 text-ink-700"
                      >
                        <Plus size={12} />
                      </button>
                    </div>
                    <div className="w-16 shrink-0 text-right">
                      <p className="text-sm font-medium text-ink-900">{formatPKR(item.price * item.qty)}</p>
                      {Number(item.discount_percent) > 0 && (
                        <p className="type-caption text-maroon-700">-{item.discount_percent}%</p>
                      )}
                    </div>
                    <button
                      onClick={() => removeFromCart(item.variant_id)}
                      className="text-ink-700/50 hover:text-maroon-700 shrink-0"
                    >
                      <X size={15} />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="shrink-0 border-t border-gold-300/30 px-5 py-4 space-y-4">
            <div>
              <p className="type-field-label text-ink-900 mb-2">Payment Method</p>
              <div className="grid grid-cols-5 gap-1.5">
                {PAYMENT_METHODS.map((m) => {
                  const Icon = m.icon;
                  const active = paymentMethod === m.key;
                  return (
                    <button
                      key={m.key}
                      onClick={() => setPaymentMethod(m.key)}
                      className={`flex flex-col items-center gap-1 py-2.5 rounded-lg border text-xs font-medium transition-colors ${
                        active
                          ? "bg-maroon-700 border-maroon-700 text-cream-50"
                          : "border-gold-300/50 text-ink-900 hover:bg-cream-100"
                      }`}
                    >
                      <Icon size={14} />
                      {m.label}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="space-y-1">
              <Row label="Subtotal" value={formatPKR(subtotal)} />
              <div className="flex items-center justify-between py-1 text-sm">
                <span className="text-ink-700">Discount</span>
                <div className="flex items-center gap-1.5">
                  <input
                    type="number"
                    min={0}
                    value={discount}
                    onChange={(e) => setDiscount(e.target.value)}
                    className="w-14 border border-gold-300/50 rounded px-1.5 py-1 text-right text-sm text-ink-900"
                  />
                  <select
                    value={discountType}
                    onChange={(e) => setDiscountType(e.target.value)}
                    className="border border-gold-300/50 rounded px-1 py-1 text-sm text-ink-900"
                  >
                    <option value="flat">Rs.</option>
                    <option value="percent">%</option>
                  </select>
                  <span className="text-ink-900 w-16 text-right">-{formatPKR(discountAmount)}</span>
                </div>
              </div>
              {tax > 0 && <Row label="Tax" value={formatPKR(tax)} />}
            </div>

            <div className="border-t border-gold-300/30 pt-3 flex items-center justify-between">
              <span className="type-card-title text-ink-900">Total</span>
              <span className="type-stat text-maroon-800">{formatPKR(total)}</span>
            </div>

            <Button
              onClick={checkout}
              disabled={processing || cart.length === 0}
              size="lg"
              className="w-full"
            >
              <Lock size={15} /> {processing ? "Processing…" : "Checkout"}
            </Button>
          </div>
        </div>
      </div>

      {searchOpen && (
        <SearchProductModal onClose={() => setSearchOpen(false)} onPick={addToCart} />
      )}

      {showPending && (
        <Dialog open onClose={() => setShowPending(false)} title="Pending & Failed Sales">
          {failedSales.length === 0 && pendingSales === 0 && (
            <p className="type-body-sm text-ink-700/60">Nothing pending — everything's synced.</p>
          )}
          <div className="space-y-2 max-h-[50vh] overflow-y-auto">
            {failedSales.map((s) => (
              <div key={s.client_sale_id} className="border border-red-200 bg-red-50 rounded-lg p-3 text-sm">
                <p className="font-medium text-red-800">{s.offlineReceiptNumber} — Rs. {s.total}</p>
                <p className="text-red-700 text-xs mt-1">{s.failReason}</p>
                <div className="flex gap-3 mt-2">
                  <button
                    onClick={() => { retrySale(s.client_sale_id); setFailedSales(getFailedSales()); setPendingSales(getQueueCount()); }}
                    className="text-xs underline text-ink-700"
                  >
                    Retry
                  </button>
                  <button
                    onClick={() => {
                      if (confirm("Discard this sale permanently? Use this only if you've confirmed it should NOT be recorded (e.g. item was actually out of stock).")) {
                        removeQueuedSale(s.client_sale_id);
                        setFailedSales(getFailedSales());
                      }
                    }}
                    className="text-xs underline text-maroon-700"
                  >
                    Discard
                  </button>
                </div>
              </div>
            ))}
          </div>
        </Dialog>
      )}
    </div>
  );
}

function SessionField({ label, value, children, wide }) {
  return (
    <div className={wide ? "min-w-[220px]" : ""}>
      <p className="type-caption text-ink-700/70">{label}</p>
      {children || <p className="font-semibold text-ink-900">{value}</p>}
    </div>
  );
}

function Row({ label, value }) {
  return (
    <div className="flex items-center justify-between py-1 text-sm">
      <span className="text-ink-700">{label}</span>
      <span className="text-ink-900">{value}</span>
    </div>
  );
}
