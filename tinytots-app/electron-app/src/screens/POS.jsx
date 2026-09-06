// POS.jsx
import { useEffect, useMemo, useRef, useState } from "react";
import {
  ScanBarcode,
  Search,
  Trash2,
  X,
  Minus,
  Plus,
  Wallet,
  CreditCard,
  Smartphone,
  MoreHorizontal,
  Lock,
  Printer as PrinterIcon,
  CheckCircle2,
  PackageX,
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

const formatPKR = (v) =>
  `Rs. ${Number(v || 0).toLocaleString("en-PK", { maximumFractionDigits: 0 })}`;

export default function POS() {
  // Dashboard/logout navigation now lives in AppShell's persistent Sidebar.
  const isOnline = useNetworkStatus();

  const [products, setProducts] = useState([]);
  const [cart, setCart] = useState([]);
  const [cashier, setCashier] = useState("");
  const [notes, setNotes] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("cash");
  const [discount, setDiscount] = useState(0);
  const [discountType, setDiscountType] = useState("flat"); // "flat" | "percent"
  const [query, setQuery] = useState("");
  const [searchOpen, setSearchOpen] = useState(false);
  const [pendingSales, setPendingSales] = useState(getQueueCount());
  const [processing, setProcessing] = useState(false);
  const [failedSales, setFailedSales] = useState(getFailedSales());
  const [showPending, setShowPending] = useState(false);
  // Reference-style post-checkout success panel. Presentation only — the sale
  // is already committed by checkout() before this is set.
  const [lastSale, setLastSale] = useState(null);

  const searchRef = useRef(null);

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

  // F2 focuses the product search. F2 is not a printable key, so it does not
  // collide with the global keyboard-wedge ScannerListener (which only buffers
  // single-character keys and Enter).
  useEffect(() => {
    function onKey(e) {
      if (e.key === "F2") {
        e.preventDefault();
        searchRef.current?.focus();
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

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

  const filteredProducts = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return products;
    return products.filter((p) =>
      [p.name, p.sku, p.public_code, p.color, p.size]
        .filter(Boolean)
        .some((f) => String(f).toLowerCase().includes(q))
    );
  }, [products, query]);

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
        // A server-side business rejection (e.g. sold out) — NOT a committed
        // sale. Surface it and leave the cart intact so nothing is lost.
        alert(result.error || result.message);
        return;
      }

      // result.success === true: the sale is authoritative on the server from
      // here on. Nothing below may divert into the offline queue or re-submit
      // — a buildSale/render/print failure now is a receipt problem only, and
      // must never be shown to the cashier as a failed transaction.
      try {
        const sale = buildSale({
          cart,
          subtotal: result.subtotal,
          discount: result.discount,
          tax: result.tax,
          total: result.total,
          receiptNumber: result.receipt_number, cashier, paymentMethod,
        });

        // Clear the cart the moment the sale is final, before the (possibly
        // slow) print call, so there is no window to accidentally resubmit.
        resetCart();

        const printResult = await printViaElectron(sale);
        setLastSale({
          sale,
          receiptNumber: result.receipt_number,
          total: result.total ?? total,
          offline: false,
          printError: printResult.printed ? null : printResult.error,
        });
      } catch (postCommitErr) {
        // buildSale / render threw AFTER a committed sale. The sale exists;
        // show it as complete with an unresolved receipt and do NOT re-queue.
        console.error("Post-commit receipt error:", postCommitErr);
        resetCart();
        setLastSale({
          sale: null,
          receiptNumber: result.receipt_number,
          total: result.total ?? total,
          offline: false,
          printError:
            "The sale was recorded, but the receipt could not be prepared here. Reprint it from Receipts.",
        });
      }
    } catch {
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
      setLastSale({
        sale,
        receiptNumber: offlineReceiptNumber,
        total,
        offline: true,
        printError: printResult.printed ? null : printResult.error,
      });

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

  return (
    <div className="flex flex-col gap-3 h-full min-h-0">
      <ScannerListener products={products} onScan={addToCart} />

      {/* Session / status strip — quiet, priority-6 chrome */}
      <div className="flex flex-wrap items-center gap-x-6 gap-y-2 border-b border-border-default/60 pb-3 shrink-0">
        <SessionField label="Cashier">
          <input
            value={cashier}
            onChange={(e) => setCashier(e.target.value)}
            placeholder="Enter cashier name"
            className="type-input font-medium text-text-primary bg-transparent outline-none border-b border-dashed border-border-strong focus:border-brand w-40"
          />
        </SessionField>
        <SessionField label="Shop" value={receiptConfig.store.name} />
        <SessionField
          label="Date"
          value={now.toLocaleDateString(undefined, { day: "2-digit", month: "short", year: "numeric" })}
        />
        <SessionField label="Day" value={now.toLocaleDateString(undefined, { weekday: "long" })} />

        <div className="ml-auto flex items-center gap-3">
          <Badge variant={isOnline ? "success" : "warning"}>
            <span className={`w-1.5 h-1.5 rounded-full ${isOnline ? "bg-success" : "bg-warning"}`} />
            {isOnline ? "Online" : "Offline"}
            {pendingSales > 0 && ` · ${pendingSales} pending`}
          </Badge>
          {(pendingSales > 0 || failedSales.length > 0) && (
            <button
              onClick={() => setShowPending(true)}
              className="type-caption text-text-secondary hover:text-text-primary hover:underline"
            >
              View queue{failedSales.length > 0 ? ` (${failedSales.length} need attention)` : ""}
            </button>
          )}
          <Button variant="secondary" size="sm" onClick={handleOpenDrawer}>
            <PrinterIcon size={14} /> Cash Drawer
          </Button>
        </div>
      </div>

      {/* Main workspace: product workspace (left) / cart + checkout (right) */}
      <div className="flex flex-col lg:flex-row gap-4 flex-1 min-h-0">
        {/* LEFT — product workspace, open on the canvas */}
        <div className="flex flex-1 min-w-0 flex-col gap-3">
          <div className="flex items-center gap-2 rounded-md border border-border-default bg-surface-sunken px-3 h-11 shrink-0 focus-within:border-brand focus-within:ring-2 focus-within:ring-brand/40 transition-[border-color,box-shadow]">
            <ScanBarcode size={18} className="text-text-muted shrink-0" />
            <input
              ref={searchRef}
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Scan a barcode, or search by product, SKU, colour or size…  (F2)"
              className="type-input flex-1 min-w-0 bg-transparent outline-none text-text-primary placeholder:text-text-muted"
            />
            {query && (
              <button
                onClick={() => setQuery("")}
                className="text-text-muted hover:text-text-primary shrink-0"
                aria-label="Clear search"
              >
                <X size={15} />
              </button>
            )}
            <Button variant="secondary" size="sm" onClick={() => setSearchOpen(true)}>
              <Search size={14} /> Advanced
            </Button>
          </div>

          <div className="flex items-center justify-between px-0.5 shrink-0">
            <p className="type-caption text-text-secondary">
              {filteredProducts.length} product{filteredProducts.length === 1 ? "" : "s"}
              {query ? ` matching “${query}”` : ""}
            </p>
            <p className="type-caption text-text-muted inline-flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-success" /> Scanner active
            </p>
          </div>

          <div className="flex-1 min-h-0 overflow-y-auto -mx-1 px-1">
            {products.length === 0 ? (
              <div className="flex flex-col items-center justify-center gap-2 py-16 text-center text-text-secondary">
                <PackageX size={26} className="text-text-muted" />
                <p className="type-body-sm">
                  No products loaded. Check the connection to the local server, then reload.
                </p>
              </div>
            ) : filteredProducts.length === 0 ? (
              <div className="flex flex-col items-center justify-center gap-2 py-16 text-center text-text-secondary">
                <Search size={22} className="text-text-muted" />
                <p className="type-body-sm">No products match “{query}”.</p>
              </div>
            ) : (
              <div className="grid grid-cols-3 sm:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-2">
                {filteredProducts.map((p) => (
                  <ProductTile key={p.variant_id} product={p} onAdd={addToCart} />
                ))}
              </div>
            )}
          </div>
        </div>

        {/* RIGHT — cart + checkout. Set apart by surface tone (warm white over
            the canvas) and a whisper of lift, not a hard outline (§33). The item
            list scrolls internally while the payment/summary/checkout footer
            stays pinned; on a viewport too short for even header+footer, the
            whole panel scrolls as a unit rather than clipping the checkout. */}
        <div className="w-full lg:w-[380px] shrink-0 flex flex-col rounded-xl bg-surface-panel shadow-sm overflow-y-auto lg:overflow-visible lg:min-h-0">
          <div className="flex items-center justify-between px-4 py-3 border-b border-border-default/60 shrink-0">
            <h2 className="type-section text-text-primary">Cart ({cart.length})</h2>
            {cart.length > 0 && (
              <button
                onClick={() => setCart([])}
                className="type-caption text-text-muted hover:text-error-text inline-flex items-center gap-1.5 transition-colors"
              >
                <Trash2 size={13} /> Clear
              </button>
            )}
          </div>

          <div className="flex-1 min-h-0 overflow-y-auto">
            {cart.length === 0 ? (
              <div className="flex flex-col items-center justify-center text-center gap-2 py-12 px-6">
                <div className="w-11 h-11 rounded-full bg-surface-elevated flex items-center justify-center text-text-muted">
                  <ScanBarcode size={18} />
                </div>
                <p className="type-body-sm text-text-secondary">
                  Your cart is empty — scan an item or tap a product to add it.
                </p>
              </div>
            ) : (
              <div className="divide-y divide-border-default/50">
                {cart.map((item) => (
                  <div
                    key={item.variant_id}
                    className="group flex items-center gap-2.5 px-3 py-2.5 hover:bg-surface-sunken transition-colors"
                  >
                    <div className="w-9 h-9 rounded-md bg-surface-elevated flex-shrink-0 overflow-hidden">
                      {item.image_url && (
                        <img src={item.image_url} alt="" className="w-full h-full object-cover" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="type-body-sm font-medium text-text-primary truncate">{item.name}</p>
                      <p className="type-caption text-text-muted truncate">
                        {[item.size, item.color].filter(Boolean).join(" / ") || item.sku}
                      </p>
                    </div>
                    <div className="flex items-center gap-1 shrink-0">
                      <button
                        onClick={() => changeQty(item.variant_id, -1)}
                        className="w-6 h-6 rounded-md flex items-center justify-center hover:bg-surface-elevated text-text-secondary transition-colors"
                        aria-label="Decrease quantity"
                      >
                        <Minus size={12} />
                      </button>
                      <span className="w-5 text-center type-body-sm text-text-primary tabular-nums">{item.qty}</span>
                      <button
                        onClick={() => changeQty(item.variant_id, 1)}
                        className="w-6 h-6 rounded-md flex items-center justify-center hover:bg-surface-elevated text-text-secondary transition-colors"
                        aria-label="Increase quantity"
                      >
                        <Plus size={12} />
                      </button>
                    </div>
                    <div className="w-16 shrink-0 text-right">
                      <p className="type-body-sm font-medium text-text-primary">
                        {formatPKR(item.price * item.qty)}
                      </p>
                      {Number(item.discount_percent) > 0 && (
                        <p className="type-caption text-brand">-{item.discount_percent}%</p>
                      )}
                    </div>
                    <button
                      onClick={() => removeFromCart(item.variant_id)}
                      className="text-text-muted hover:text-error-text shrink-0 opacity-0 group-hover:opacity-100 focus:opacity-100 transition-opacity"
                      aria-label="Remove item"
                    >
                      <X size={15} />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="shrink-0 border-t border-border-default px-4 py-3 space-y-3">
            <input
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Add a note to this sale (optional)…"
              className="type-body-sm w-full bg-surface-sunken border border-border-default rounded-md px-2.5 py-1.5 text-text-primary outline-none placeholder:text-text-muted focus:border-brand"
            />

            <div>
              <p className="type-field-label text-text-secondary mb-1.5">Payment Method</p>
              <div className="grid grid-cols-5 gap-1.5">
                {PAYMENT_METHODS.map((m) => {
                  const Icon = m.icon;
                  const active = paymentMethod === m.key;
                  return (
                    <button
                      key={m.key}
                      onClick={() => setPaymentMethod(m.key)}
                      className={`flex flex-col items-center gap-1 py-2 rounded-md border type-label transition-colors ${
                        active
                          ? "bg-brand border-brand text-pure-white"
                          : "border-border-default text-text-secondary hover:bg-surface-sunken hover:text-text-primary"
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
              <div className="flex items-center justify-between py-0.5 type-body-sm">
                <span className="text-text-secondary">Discount</span>
                <div className="flex items-center gap-1.5">
                  <input
                    type="number"
                    min={0}
                    value={discount}
                    onChange={(e) => setDiscount(e.target.value)}
                    className="w-14 border border-border-default bg-surface-sunken rounded px-1.5 py-1 text-right type-body-sm text-text-primary outline-none focus:border-brand"
                  />
                  <select
                    value={discountType}
                    onChange={(e) => setDiscountType(e.target.value)}
                    className="border border-border-default bg-surface-sunken rounded px-1 py-1 type-body-sm text-text-primary outline-none"
                  >
                    <option value="flat">Rs.</option>
                    <option value="percent">%</option>
                  </select>
                  <span className="text-text-primary w-16 text-right">-{formatPKR(discountAmount)}</span>
                </div>
              </div>
              {tax > 0 && <Row label={`Tax (${receiptConfig.taxRatePercent}%)`} value={formatPKR(tax)} />}
            </div>

            <div className="border-t border-border-default pt-2.5 flex items-center justify-between">
              <span className="type-card-title text-text-primary">Total</span>
              <span className="type-stat text-brand tabular-nums">{formatPKR(total)}</span>
            </div>

            <Button
              onClick={checkout}
              disabled={processing || cart.length === 0}
              loading={processing}
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

      {lastSale && (
        <SaleSuccess
          data={lastSale}
          onNewSale={() => setLastSale(null)}
          onPrintAgain={() => printViaElectron(lastSale.sale)}
        />
      )}

      {showPending && (
        <Dialog open onClose={() => setShowPending(false)} title="Pending & Failed Sales">
          {failedSales.length === 0 && pendingSales === 0 && (
            <p className="type-body-sm text-text-secondary">Nothing pending — everything&apos;s synced.</p>
          )}
          <div className="space-y-2 max-h-[50vh] overflow-y-auto">
            {failedSales.map((s) => (
              <div key={s.client_sale_id} className="border border-error/30 bg-error/10 rounded-md p-3 type-body-sm">
                <p className="font-medium text-error-text">{s.offlineReceiptNumber} — Rs. {s.total}</p>
                <p className="text-error-text/80 type-caption mt-1">{s.failReason}</p>
                <div className="flex gap-3 mt-2">
                  <button
                    onClick={() => { retrySale(s.client_sale_id); setFailedSales(getFailedSales()); setPendingSales(getQueueCount()); }}
                    className="type-caption underline text-text-secondary"
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
                    className="type-caption underline text-error-text"
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

function ProductTile({ product, onAdd }) {
  const out = product.stock <= 0;
  const low = !out && product.stock <= 5;
  return (
    <button
      onClick={() => onAdd(product)}
      disabled={out}
      className="group flex flex-col rounded-lg p-2 text-left transition-[background-color,transform] hover:bg-surface-sunken active:translate-y-px focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/50 disabled:opacity-45 disabled:cursor-not-allowed"
    >
      <div className="aspect-square w-full rounded-md bg-surface-elevated overflow-hidden mb-2">
        {product.image_url ? (
          <img
            src={product.image_url}
            alt=""
            loading="lazy"
            className="w-full h-full object-cover transition-transform duration-200 group-hover:scale-[1.04]"
          />
        ) : (
          <span className="w-full h-full flex items-center justify-center text-text-muted">
            <PackageX size={18} />
          </span>
        )}
      </div>
      <p className="type-caption font-medium text-text-primary leading-tight line-clamp-2">
        {product.name}
      </p>
      <p className="type-tiny text-text-muted truncate mt-0.5">
        {[product.size, product.color].filter(Boolean).join(" / ") || product.sku}
      </p>
      <div className="mt-1 flex items-center justify-between gap-1">
        <span className="type-body-sm font-semibold text-text-primary">
          {formatPKR(product.price)}
        </span>
        <span
          className={`type-label ${
            out ? "text-error-text" : low ? "text-warning-text" : "text-text-muted"
          }`}
        >
          {out ? "Out" : `${product.stock}`}
        </span>
      </div>
    </button>
  );
}

function SaleSuccess({ data, onNewSale, onPrintAgain }) {
  // Local reprint feedback. "Print Again" only re-prints the sale that is
  // already recorded — it never re-submits the sale.
  const [reprint, setReprint] = useState({ state: "idle", error: null });

  async function handlePrintAgain() {
    if (!data.sale) return;
    setReprint({ state: "printing", error: null });
    const result = await onPrintAgain();
    setReprint(
      result?.printed
        ? { state: "ok", error: null }
        : { state: "error", error: result?.error || "Printing failed." }
    );
  }

  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center px-4">
      <div className="absolute inset-0 bg-surface-overlay tt-anim-fade" onClick={onNewSale} />
      <div className="relative w-full max-w-sm rounded-xl bg-surface-panel border border-border-strong p-6 text-center shadow-lg tt-anim-dialog">
        <div className="w-14 h-14 rounded-full bg-success/12 text-success-text flex items-center justify-center mx-auto mb-4">
          <CheckCircle2 size={30} />
        </div>
        <h2 className="type-heading-sm text-text-primary">
          {data.offline ? "Sale saved offline" : "Payment successful"}
        </h2>
        <p className="type-body-sm text-text-secondary mt-1">
          {data.offline
            ? "Saved on this device. It will sync to the server automatically once you're back online — do not re-enter this sale."
            : data.printError
            ? "The sale is recorded. The receipt did not print — use Print Again or reprint it from Receipts."
            : "The sale is recorded and the receipt printed."}
        </p>

        <div className="mt-4 rounded-md border border-border-default bg-surface-sunken px-4 py-3 text-left space-y-1">
          <Row label="Receipt No." value={data.receiptNumber} />
          <Row label="Total Paid" value={formatPKR(data.total)} />
        </div>

        {data.printError && (
          <p className="type-caption text-warning-text mt-3">{data.printError}</p>
        )}

        <div className="mt-5 grid grid-cols-2 gap-2">
          <Button
            variant="secondary"
            onClick={handlePrintAgain}
            disabled={!data.sale || reprint.state === "printing"}
            loading={reprint.state === "printing"}
          >
            <PrinterIcon size={14} /> Print Again
          </Button>
          <Button onClick={onNewSale}>New Sale</Button>
        </div>

        {reprint.state === "ok" && (
          <p className="type-caption text-success-text mt-2">Receipt printed.</p>
        )}
        {reprint.state === "error" && (
          <p className="type-caption text-warning-text mt-2">
            Still couldn’t print: {reprint.error}. Reprint from Receipts.
          </p>
        )}
      </div>
    </div>
  );
}

function SessionField({ label, value, children }) {
  return (
    <div>
      <p className="type-caption text-text-muted">{label}</p>
      {children || <p className="type-body-sm font-medium text-text-primary">{value}</p>}
    </div>
  );
}

function Row({ label, value }) {
  return (
    <div className="flex items-center justify-between py-0.5 type-body-sm">
      <span className="text-text-secondary">{label}</span>
      <span className="text-text-primary">{value}</span>
    </div>
  );
}
