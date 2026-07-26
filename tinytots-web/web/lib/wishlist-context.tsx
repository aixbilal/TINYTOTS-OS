"use client";

import { createContext, useContext, useEffect, useState, useCallback } from "react";
import { useAuth } from "@/lib/auth-context";
import { supabase } from "@/lib/supabase";

type WishlistContextType = {
  productIds: Set<number>;
  loading: boolean;
  toggle: (productId: number) => Promise<void>;
  isWishlisted: (productId: number) => boolean;
};

const WishlistContext = createContext<WishlistContextType | undefined>(undefined);

export function WishlistProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const [customerId, setCustomerId] = useState<number | null>(null);
  const [productIds, setProductIds] = useState<Set<number>>(new Set());
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      setProductIds(new Set());
      setCustomerId(null);
      setLoading(false);
      return;
    }

    supabase
      .from("customers")
      .select("id")
      .eq("auth_user_id", user.id)
      .single()
      .then(({ data }) => {
        if (!data) {
          setLoading(false);
          return;
        }
        setCustomerId(data.id);
        supabase
          .from("wishlist_items")
          .select("product_id")
          .eq("customer_id", data.id)
          .then(({ data: items }) => {
            setProductIds(new Set((items || []).map((i) => i.product_id)));
            setLoading(false);
          });
      });
  }, [user]);

  const toggle = useCallback(
    async (productId: number) => {
      if (!user || !customerId) return; // caller should redirect to /login instead

      const alreadyIn = productIds.has(productId);

      // Optimistic update — flip locally first, roll back only if the write fails.
      setProductIds((prev) => {
        const next = new Set(prev);
        if (alreadyIn) next.delete(productId);
        else next.add(productId);
        return next;
      });

      if (alreadyIn) {
        const { error } = await supabase
          .from("wishlist_items")
          .delete()
          .eq("customer_id", customerId)
          .eq("product_id", productId);
        if (error) {
          setProductIds((prev) => new Set(prev).add(productId));
        }
      } else {
        const { error } = await supabase
          .from("wishlist_items")
          .insert({ customer_id: customerId, product_id: productId });
        if (error) {
          setProductIds((prev) => {
            const next = new Set(prev);
            next.delete(productId);
            return next;
          });
        }
      }
    },
    [user, customerId, productIds]
  );

  const isWishlisted = useCallback((productId: number) => productIds.has(productId), [productIds]);

  return (
    <WishlistContext.Provider value={{ productIds, loading, toggle, isWishlisted }}>
      {children}
    </WishlistContext.Provider>
  );
}

export function useWishlist() {
  const ctx = useContext(WishlistContext);
  if (!ctx) throw new Error("useWishlist must be used within WishlistProvider");
  return ctx;
}