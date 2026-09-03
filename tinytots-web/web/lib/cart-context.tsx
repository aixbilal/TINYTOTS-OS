"use client";

import { createContext, useContext, useState, useEffect, ReactNode } from "react";

export type CartItem = {
  variantId: number;
  productId: number;
  productName: string;
  size: string | null;
  color: string | null;
  price: number;
  quantity: number;
  maxStock: number;
  imageUrl?: string;
};

export type AppliedCoupon = {
  code: string;
  discountType: "percentage" | "flat";
  value: number;
  discountAmount: number;
};

export type AppliedVoucher = {
  id: number;
  amount: number;
  expiresAt: string;
};

type CartContextType = {
  items: CartItem[];
  addItem: (item: Omit<CartItem, "quantity">, quantity: number) => void;
  updateQuantity: (variantId: number, quantity: number) => void;
  removeItem: (variantId: number) => void;
  clearCart: () => void;
  totalItems: number;
  subtotal: number;
  appliedCoupon: AppliedCoupon | null;
  applyCoupon: (coupon: AppliedCoupon) => void;
  clearCoupon: () => void;
  appliedVoucher: AppliedVoucher | null;
  applyVoucher: (voucher: AppliedVoucher) => void;
  clearVoucher: () => void;
  total: number;
  /** Sticky “view cart” bar — shown after add-to-cart until dismissed. */
  cartBarVisible: boolean;
  dismissCartBar: () => void;
  /** True once the client has read persisted cart state from localStorage. */
  cartHydrated: boolean;
};

const CartContext = createContext<CartContextType | undefined>(undefined);

// ---------------------------------------------------------------------------
// Client-side cart persistence (FUNC-01)
//
// The cart lives in React state; this layer mirrors ONLY the line items to
// localStorage so they survive refresh / return visits. It is deliberately
// simple: one namespaced+versioned key, an explicit validator, and a
// graceful fall back to an empty cart on anything malformed.
//
// Trust model: localStorage is user-controlled, so nothing read back here is
// authoritative. Price / stock are restored for display only — checkout
// (`app/api/checkout/route.ts`) still re-fetches live variant price, stock
// and coupon state server-side and sends only { variant_id, quantity }.
// ---------------------------------------------------------------------------
const CART_STORAGE_KEY = "tinytots_cart_v1";
const CART_STORAGE_VERSION = 1;
const MAX_PERSISTED_ITEMS = 100;
const MAX_PERSISTED_QTY = 99;

type PersistedCart = { version: number; items: unknown[] };

function isPersistableItem(raw: unknown): raw is CartItem {
  if (!raw || typeof raw !== "object") return false;
  const i = raw as Record<string, unknown>;
  const isPosInt = (v: unknown) =>
    typeof v === "number" && Number.isInteger(v) && v > 0;
  const isNonNegNum = (v: unknown) =>
    typeof v === "number" && Number.isFinite(v) && v >= 0;
  if (!isPosInt(i.variantId)) return false;
  if (!isPosInt(i.productId)) return false;
  if (typeof i.productName !== "string" || i.productName.trim() === "") return false;
  if (!isNonNegNum(i.price)) return false;
  if (
    typeof i.quantity !== "number" ||
    !Number.isInteger(i.quantity) ||
    i.quantity < 1
  )
    return false;
  if (
    typeof i.maxStock !== "number" ||
    !Number.isInteger(i.maxStock) ||
    i.maxStock < 0
  )
    return false;
  if (i.size !== null && typeof i.size !== "string") return false;
  if (i.color !== null && typeof i.color !== "string") return false;
  if (i.imageUrl !== undefined && typeof i.imageUrl !== "string") return false;
  return true;
}

function normalizePersistedItem(i: CartItem): CartItem {
  // Persistence must never widen the quantity/stock rules the live add/update
  // paths enforce: clamp into [1, min(maxStock, hard cap)].
  const ceiling = Math.min(
    i.maxStock > 0 ? i.maxStock : MAX_PERSISTED_QTY,
    MAX_PERSISTED_QTY
  );
  const item: CartItem = {
    variantId: i.variantId,
    productId: i.productId,
    productName: i.productName,
    size: i.size ?? null,
    color: i.color ?? null,
    price: i.price,
    quantity: Math.max(1, Math.min(i.quantity, ceiling)),
    maxStock: i.maxStock,
  };
  if (i.imageUrl) item.imageUrl = i.imageUrl;
  return item;
}

function loadPersistedCart(): CartItem[] {
  if (typeof window === "undefined") return [];
  let raw: string | null = null;
  try {
    raw = window.localStorage.getItem(CART_STORAGE_KEY);
  } catch {
    return [];
  }
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw) as Partial<PersistedCart> | null;
    if (
      !parsed ||
      typeof parsed !== "object" ||
      parsed.version !== CART_STORAGE_VERSION ||
      !Array.isArray(parsed.items)
    ) {
      // Missing / unsupported version / malformed shape — discard it safely.
      try {
        window.localStorage.removeItem(CART_STORAGE_KEY);
      } catch {}
      return [];
    }
    const clean: CartItem[] = [];
    const seen = new Set<number>();
    for (const candidate of parsed.items.slice(0, MAX_PERSISTED_ITEMS)) {
      if (!isPersistableItem(candidate)) continue;
      if (seen.has(candidate.variantId)) continue;
      seen.add(candidate.variantId);
      clean.push(normalizePersistedItem(candidate));
    }
    return clean;
  } catch {
    try {
      window.localStorage.removeItem(CART_STORAGE_KEY);
    } catch {}
    return [];
  }
}

function savePersistedCart(items: CartItem[]) {
  if (typeof window === "undefined") return;
  try {
    if (items.length === 0) {
      window.localStorage.removeItem(CART_STORAGE_KEY);
      return;
    }
    const payload: PersistedCart = {
      version: CART_STORAGE_VERSION,
      items: items.slice(0, MAX_PERSISTED_ITEMS),
    };
    window.localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(payload));
  } catch {
    // Private mode / quota exceeded — the cart still works in memory for this
    // session; persistence is best-effort.
  }
}

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);
  const [appliedCoupon, setAppliedCoupon] = useState<AppliedCoupon | null>(null);
  const [appliedVoucher, setAppliedVoucher] = useState<AppliedVoucher | null>(null);
  const [cartBarVisible, setCartBarVisible] = useState(false);
  const [cartHydrated, setCartHydrated] = useState(false);

  // Hydrate from localStorage after mount. This must run in an effect, not a
  // useState initializer — reading localStorage during SSR/first render would
  // desync the server and client and throw a hydration mismatch on the header
  // badge. setState-in-effect is the intended pattern here (one-shot on mount).
  useEffect(() => {
    const restored = loadPersistedCart();
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setItems((prev) => {
      if (prev.length === 0) return restored;
      // Something was added in the brief window before hydration finished —
      // keep it, and fold in any persisted lines it doesn't already have.
      const merged = [...prev];
      for (const r of restored) {
        if (!merged.some((m) => m.variantId === r.variantId)) merged.push(r);
      }
      return merged;
    });
    setCartHydrated(true);
  }, []);

  // Mirror line-item changes back to storage — only after hydration, so the
  // initial empty state can't clobber a persisted cart before it's read.
  useEffect(() => {
    if (!cartHydrated) return;
    savePersistedCart(items);
  }, [items, cartHydrated]);

  function addItem(item: Omit<CartItem, "quantity">, quantity: number) {
    setItems((prev) => {
      const existing = prev.find((i) => i.variantId === item.variantId);
      if (existing) {
        const newQty = Math.min(existing.quantity + quantity, existing.maxStock);
        return prev.map((i) =>
          i.variantId === item.variantId ? { ...i, quantity: newQty } : i
        );
      }
      return [...prev, { ...item, quantity: Math.min(quantity, item.maxStock) }];
    });
    setCartBarVisible(true);
  }

  function dismissCartBar() {
    setCartBarVisible(false);
  }

  function updateQuantity(variantId: number, quantity: number) {
    setItems((prev) =>
      prev
        .map((i) =>
          i.variantId === variantId
            ? { ...i, quantity: Math.max(1, Math.min(quantity, i.maxStock)) }
            : i
        )
        .filter((i) => i.quantity > 0)
    );
  }

  function removeItem(variantId: number) {
    setItems((prev) => prev.filter((i) => i.variantId !== variantId));
  }

  function clearCart() {
    setItems([]);
    setAppliedCoupon(null);
    setAppliedVoucher(null);
    setCartBarVisible(false);
  }

  function applyCoupon(coupon: AppliedCoupon) {
    setAppliedCoupon(coupon);
  }

  function clearCoupon() {
    setAppliedCoupon(null);
  }

  function applyVoucher(voucher: AppliedVoucher) {
    setAppliedVoucher(voucher);
  }

  function clearVoucher() {
    setAppliedVoucher(null);
  }

  const totalItems = items.reduce((sum, i) => sum + i.quantity, 0);
  const subtotal = items.reduce((sum, i) => sum + i.quantity * i.price, 0);
  const total = Math.max(
    0,
    subtotal - (appliedCoupon?.discountAmount ?? 0) - (appliedVoucher?.amount ?? 0)
  );

  return (
    <CartContext.Provider
      value={{
        items,
        addItem,
        updateQuantity,
        removeItem,
        clearCart,
        totalItems,
        subtotal,
        appliedCoupon,
        applyCoupon,
        clearCoupon,
        appliedVoucher,
        applyVoucher,
        clearVoucher,
        total,
        cartBarVisible,
        dismissCartBar,
        cartHydrated,
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used within CartProvider");
  return ctx;
}
