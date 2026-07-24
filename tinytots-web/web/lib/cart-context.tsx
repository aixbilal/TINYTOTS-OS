"use client";

import { createContext, useContext, useState, ReactNode } from "react";

export type CartItem = {
  variantId: number;
  productId: number;
  productName: string;
  size: string | null;
  color: string | null;
  price: number;
  quantity: number;
  maxStock: number;
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
};

const CartContext = createContext<CartContextType | undefined>(undefined);

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);
  const [appliedCoupon, setAppliedCoupon] = useState<AppliedCoupon | null>(null);
  const [appliedVoucher, setAppliedVoucher] = useState<AppliedVoucher | null>(null);

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