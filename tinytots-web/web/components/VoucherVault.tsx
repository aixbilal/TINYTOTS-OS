"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/lib/auth-context";
import { supabase } from "@/lib/supabase";
import { useCart } from "@/lib/cart-context";

type Voucher = {
  id: number;
  amount: number;
  is_used: boolean;
  expires_at: string;
  source: string;
};

export default function VoucherVault() {
  const { user } = useAuth();
  const { appliedVoucher, applyVoucher, clearVoucher } = useCart();
  const [vouchers, setVouchers] = useState<Voucher[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      setLoading(false);
      return;
    }
    const userId = user.id;

    async function fetchVouchers() {
      const { data: customer } = await supabase
        .from("customers")
        .select("id")
        .eq("auth_user_id", userId)
        .single();

      if (!customer) {
        setLoading(false);
        return;
      }

      const { data } = await supabase
        .from("vouchers")
        .select("id, amount, is_used, expires_at, source")
        .eq("customer_id", customer.id)
        .eq("is_used", false)
        .gt("expires_at", new Date().toISOString())
        .order("expires_at", { ascending: true });

      setVouchers(data || []);
      setLoading(false);
    }

    fetchVouchers();
  }, [user]);

  if (!user || loading || vouchers.length === 0) return null;

  return (
    <div className="border-t border-outline-variant/30 pt-3">
      <p className="font-body-sm text-body-sm text-on-surface-variant mb-2">
        Your vouchers
      </p>
      <div className="flex flex-col gap-2">
        {vouchers.map((v: Voucher) => {
          const isApplied = appliedVoucher?.id === v.id;
          return (
            <button
              key={v.id}
              onClick={() =>
                isApplied
                  ? clearVoucher()
                  : applyVoucher({ id: v.id, amount: v.amount, expiresAt: v.expires_at })
              }
              className={`flex items-center justify-between border rounded-lg px-3 py-2 text-left transition-colors ${
                isApplied
                  ? "border-primary bg-primary-container/10"
                  : "border-outline-variant hover:border-primary/50"
              }`}
            >
              <div>
                <p className="font-body-sm text-body-sm text-on-surface">
                  Rs. {v.amount.toLocaleString()} off
                </p>
                <p className="font-label-md text-label-md text-on-surface-variant">
                  Expires {new Date(v.expires_at).toLocaleDateString()} · {v.source}
                </p>
              </div>
              <span className="font-label-md text-label-md text-primary">
                {isApplied ? "Applied ✓" : "Apply"}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}