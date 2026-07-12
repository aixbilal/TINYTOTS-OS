// POS.jsx
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  ArrowLeft, LogOut, ScanBarcode, Search, Trash2, X, Minus, Plus,
  Wallet, CreditCard, Smartphone, MoreHorizontal, Lock, Printer as PrinterIcon,
} from "lucide-react";
import FloralFlourish from "../components/FloralFlourish";
import ScannerListener from "../components/ScannerListener";
import SearchProductModal from "../components/pos/SearchProductModal";
import { receiptConfig } from "../receipts/receiptConfig";
import { buildSale } from "../receipts/buildSale";
import { printReceipt } from "../receipts/printReceipt";
import { queueSale, syncQueuedSales, getQueueCount } from "../services/offlineQueue";
import useNetworkStatus from "../hooks/useNetworkStatus";
import { getSession, clearSession } from "../auth";
import loginBg from "../assets/login-bg.png";

const PAYMENT_METHODS = [
  { key: "cash", label: "Cash", icon: Wallet },
  { key: "card", label: "Card", icon: CreditCard },
  { key: "upi", label: "UPI", icon: Smartphone },
  { key: "wallet", label: "Wallet", icon: Wallet },
  { key: "other", label: "Other", icon: MoreHorizontal },
];

const TAX_RATE = receiptConfig.taxRatePercent / 100;

const glassCard =
  "rounded-2xl border border-white/40 backdrop-blur-xl transition-transform duration-300";
const glassCardStyle = {
  background: "linear-gradient(160deg, rgba(255,255,255,0.30) 0%, rgba(255,255,255,0.12) 100%)",
  boxShadow: "inset 0 1px 1px rgba(255,255,255,0.5)",
};

export default function POS() {
  const navigate = useNavigate();
  const isOnline = useNetworkStatus();
  const session = getSession();
  const isAdmin = session?.role === "admin";

  function handleLogout() {
    clearSession();
    navigate("/login");
  }

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
  const discountAmount =
    discountType === "percent" ? (subtotal * (Number(discount) || 0)) / 100 : Number(discount) || 0;
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

    setProcessing(true);
    try {
      const res = await fetch("http://localhost:3000/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          cart, subtotal, discount: discountAmount, tax, total,
          cashier, paymentMethod, notes,
        }),
      });

      if (!res.ok) {
        throw new Error(`Checkout failed with status ${res.status}`);
      }

      const result = await res.json();

      if (!result.success) {
        alert(result.error || result.message);
        return;
      }

      const sale = buildSale({
        cart, subtotal, discount: discountAmount, tax, total,
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
      // Offline fallback — same behavior as before, still prints locally and queues the sync.
      const offlineReceiptNumber = `OFFLINE-${Date.now()}`;
      const sale = buildSale({
        cart, subtotal, discount: discountAmount, tax, total,
        receiptNumber: offlineReceiptNumber, cashier, paymentMethod,
      });

      queueSale({ cart, subtotal, discount: discountAmount, tax, total, cashier, paymentMethod, notes, offlineReceiptNumber });
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
    <div
      className="min-h-screen px-10 py-6 bg-cover bg-center bg-no-repeat"
      style={{ backgroundImage: `url(${loginBg})` }}
    >
      <ScannerListener products={products} onScan={addToCart} />

      {isAdmin ? (
        <button
          onClick={() => navigate("/dashboard")}
          className="inline-flex items-center gap-2 text-sm text-ink-800 hover:text-maroon-700 mb-4"
        >
          <ArrowLeft size={15} /> Dashboard
        </button>
      ) : (
        <button
          onClick={handleLogout}
          className="inline-flex items-center gap-2 text-sm text-ink-800 hover:text-maroon-700 mb-4"
        >
          <LogOut size={15} /> Logout
        </button>
      )}

      {/* Header */}
      <div className="relative flex items-start justify-between mb-6">
        <FloralFlourish className="absolute -top-4 right-24 w-80 h-40 pointer-events-none hidden md:block" />
        <div className="relative">
          <h1 className="font-display text-4xl text-maroon-800 flex items-baseline gap-3">
            POS <span className="text-base font-sans font-normal text-ink-800">| Point of Sale</span>
          </h1>
          <p className="text-ink-800 mt-1">Scan product barcode or search to add to cart</p>
        </div>

        <div className="flex flex-col items-end gap-2">
          <button
            onClick={handleOpenDrawer}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg border border-white/40 text-ink-900 text-sm font-medium hover:bg-white/20 backdrop-blur-sm"
          >
            <PrinterIcon size={16} /> Open Cash Drawer
          </button>
          <span className={`text-xs font-medium ${isOnline ? "text-green-700" : "text-maroon-700"}`}>
            {isOnline ? "● Online" : "● Offline"}
            {pendingSales > 0 && ` — ${pendingSales} pending sync`}
          </span>
        </div>
      </div>

      {/* Info bar */}
      <div className={`px-6 py-4 flex flex-wrap gap-x-10 gap-y-3 mb-6 ${glassCard}`} style={glassCardStyle}>
        <InfoField label="Cashier">
          <input
            value={cashier}
            onChange={(e) => setCashier(e.target.value)}
            placeholder="Enter cashier name"
            className="font-semibold text-ink-900 bg-transparent outline-none border-b border-dashed border-ink-900/30 focus:border-maroon-700 w-40"
          />
        </InfoField>
        <InfoField label="Shop" value={receiptConfig.store.name} />
        <InfoField
          label="Date"
          value={now.toLocaleDateString(undefined, { day: "2-digit", month: "long", year: "numeric" })}
        />
        <InfoField label="Day" value={now.toLocaleDateString(undefined, { weekday: "long" })} />
        <InfoField label="Address" value={receiptConfig.store.address} wide />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Scan panel */}
        <div className={`flex flex-col items-center justify-center py-16 px-6 text-center ${glassCard}`} style={glassCardStyle}>
          <div className="w-24 h-24 rounded-full bg-white/25 border border-white/40 flex items-center justify-center mb-6">
            <ScanBarcode size={34} className="text-maroon-800" strokeWidth={1.4} />
          </div>
          <h2 className="font-display text-xl text-maroon-800 mb-2">Scan Barcode / QR Code</h2>
          <p className="text-sm text-ink-800 mb-6 max-w-[220px]">
            Scan a product barcode or QR code to add it to the cart
          </p>
          <div className="flex items-center gap-3 w-full max-w-[220px] mb-6">
            <span className="flex-1 h-px bg-white/40" />
            <span className="text-xs text-ink-800/60">or</span>
            <span className="flex-1 h-px bg-white/40" />
          </div>
          <button
            onClick={() => setSearchOpen(true)}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg border border-white/40 text-ink-900 text-sm font-medium hover:bg-white/20 backdrop-blur-sm"
          >
            <Search size={15} /> Search Product
          </button>
        </div>

        {/* Cart */}
        <div className={`lg:col-span-2 p-6 ${glassCard}`} style={glassCardStyle}>
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-display text-xl text-maroon-800">Cart ({cart.length})</h2>
            {cart.length > 0 && (
              <button
                onClick={() => setCart([])}
                className="text-sm text-maroon-700 hover:underline inline-flex items-center gap-1.5"
              >
                <Trash2 size={14} /> Clear Cart
              </button>
            )}
          </div>

          {cart.length === 0 ? (
            <p className="text-center text-ink-800/60 py-16 text-sm">
              Cart is empty — scan an item or search to add one.
            </p>
          ) : (
            <div className="space-y-1">
              <div className="grid grid-cols-[2fr_0.6fr_0.8fr_1fr_0.6fr_0.7fr_auto] gap-2 text-xs text-ink-800/70 px-2 pb-2 border-b border-white/30">
                <span>Product</span>
                <span>Size</span>
                <span>Color</span>
                <span>Qty</span>
                <span>Price</span>
                <span>Total</span>
                <span></span>
              </div>
              {cart.map((item) => (
                <div
                  key={item.variant_id}
                  className="grid grid-cols-[2fr_0.6fr_0.8fr_1fr_0.6fr_0.7fr_auto] gap-2 items-center px-2 py-2.5 border-b border-white/30 last:border-0"
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className="w-9 h-9 rounded-lg bg-white/20 border border-white/30 flex-shrink-0 overflow-hidden">
                      {item.image_url && <img src={item.image_url} alt="" className="w-full h-full object-cover" />}
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-ink-900 truncate">{item.name}</p>
                      <p className="text-xs text-ink-800/60 font-mono truncate">{item.sku}</p>
                    </div>
                  </div>
                  <span className="text-sm text-ink-900">{item.size || "—"}</span>
                  <span className="text-sm text-ink-900">{item.color || "—"}</span>
                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => changeQty(item.variant_id, -1)}
                      className="w-6 h-6 rounded-md border border-white/40 flex items-center justify-center hover:bg-white/20"
                    >
                      <Minus size={12} />
                    </button>
                    <span className="w-5 text-center text-sm">{item.qty}</span>
                    <button
                      onClick={() => changeQty(item.variant_id, 1)}
                      className="w-6 h-6 rounded-md border border-white/40 flex items-center justify-center hover:bg-white/20"
                    >
                      <Plus size={12} />
                    </button>
                  </div>
                  <span className="text-sm text-ink-900">{formatPKR(item.price)}</span>
                  <span className="text-sm font-medium text-ink-900">{formatPKR(item.price * item.qty)}</span>
                  <button
                    onClick={() => removeFromCart(item.variant_id)}
                    className="text-ink-800/50 hover:text-maroon-700"
                  >
                    <X size={15} />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Bottom row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-6">
        <div className={`p-5 ${glassCard}`} style={glassCardStyle}>
          <h3 className="font-medium text-maroon-800 mb-3">Notes</h3>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Add order notes…"
            rows={4}
            className="w-full bg-transparent outline-none text-sm resize-none placeholder:text-ink-800/40 text-ink-900"
          />
        </div>

        <div className={`p-5 ${glassCard}`} style={glassCardStyle}>
          <h3 className="font-medium text-maroon-800 mb-3">Payment Method</h3>
          <div className="grid grid-cols-3 gap-2">
            {PAYMENT_METHODS.map((m) => {
              const Icon = m.icon;
              const active = paymentMethod === m.key;
              return (
                <button
                  key={m.key}
                  onClick={() => setPaymentMethod(m.key)}
                  className={`flex flex-col items-center gap-1 py-3 rounded-lg border text-xs font-medium transition-colors ${
                    active
                      ? "bg-maroon-700 border-maroon-700 text-cream-50"
                      : "border-white/40 text-ink-900 hover:bg-white/20"
                  }`}
                >
                  <Icon size={15} />
                  {m.label}
                </button>
              );
            })}
          </div>
        </div>

        <div className={`p-5 ${glassCard}`} style={glassCardStyle}>
          <Row label="Subtotal" value={formatPKR(subtotal)} />
          <div className="flex items-center justify-between py-1.5 text-sm">
            <span className="text-ink-800">Discount</span>
            <div className="flex items-center gap-2">
              <input
                type="number"
                min={0}
                value={discount}
                onChange={(e) => setDiscount(e.target.value)}
                className="w-16 border border-white/40 bg-white/20 rounded px-2 py-1 text-right text-sm text-ink-900"
              />
              <select
                value={discountType}
                onChange={(e) => setDiscountType(e.target.value)}
                className="border border-white/40 bg-white/20 rounded px-1.5 py-1 text-sm text-ink-900"
              >
                <option value="flat">Rs.</option>
                <option value="percent">%</option>
              </select>
              <span className="text-ink-900 w-16 text-right">-{formatPKR(discountAmount)}</span>
            </div>
          </div>
          <Row label="Tax" value={formatPKR(tax)} />
          <div className="border-t border-white/40 my-2" />
          <div className="flex items-center justify-between mb-4">
            <span className="font-semibold text-ink-900">Total</span>
            <span className="font-display text-2xl text-maroon-800">{formatPKR(total)}</span>
          </div>
          <button
            onClick={checkout}
            disabled={processing || cart.length === 0}
            className="w-full flex items-center justify-center gap-2 bg-maroon-700 text-cream-50 font-medium py-3 rounded-lg hover:bg-maroon-800 disabled:opacity-50"
          >
            <Lock size={15} /> {processing ? "Processing…" : "Checkout"}
          </button>
        </div>
      </div>

      {searchOpen && (
        <SearchProductModal onClose={() => setSearchOpen(false)} onPick={addToCart} />
      )}
    </div>
  );
}

function InfoField({ label, value, children, wide }) {
  return (
    <div className={wide ? "min-w-[220px]" : ""}>
      <p className="text-xs text-ink-800/70">{label}</p>
      {children || <p className="font-semibold text-ink-900">{value}</p>}
    </div>
  );
}

function Row({ label, value }) {
  return (
    <div className="flex items-center justify-between py-1.5 text-sm">
      <span className="text-ink-800">{label}</span>
      <span className="text-ink-900">{value}</span>
    </div>
  );
}