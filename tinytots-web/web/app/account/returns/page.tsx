"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import { supabase } from "@/lib/supabase";
import AccountSidebar from "@/components/AccountSidebar";

const MAX_MESSAGE_LEN = 1000;
const REASONS = ["Size / Fit Issue", "Damaged in Transit", "Incorrect Variant", "Changed my mind", "Other"];

type ReturnItem = {
  id: number;
  type: string;
  message: string;
  status: string;
  photo_url: string | null;
  created_at: string;
  order: { id: number; order_number: string } | null;
};

type Order = { id: number; order_number: string; status: string; created_at: string };
type OrderItemRow = {
  id: number;
  quantity: number;
  variant: { color: string | null; size: string | null; price: number; product: { name: string; image_url: string | null } | null } | null;
};

const STATUS_LABELS: Record<string, string> = {
  open: "Submitted", in_progress: "Being reviewed", approved: "Approved",
  rejected: "Rejected", refunded: "Refunded", exchanged: "Exchanged", resolved: "Resolved",
};
const STATUS_PILL: Record<string, string> = {
  open: "bg-surface-secondary text-text-secondary border-border-default",
  in_progress: "bg-brand-primary/10 text-brand-primary border-brand-primary/30",
  approved: "bg-green-700/10 text-green-700 border-green-700/30",
  rejected: "bg-red-700/10 text-red-700 border-red-700/30",
  refunded: "bg-green-700/10 text-green-700 border-green-700/30",
  exchanged: "bg-green-700/10 text-green-700 border-green-700/30",
  resolved: "bg-green-700/10 text-green-700 border-green-700/30",
};
const RETURNABLE_STATUSES = ["shipped", "delivered"];

const STEPS = ["Lookup", "Select Items", "Review"];

export default function MyReturnsPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const [customerId, setCustomerId] = useState<number | null>(null);
  const [customerName, setCustomerName] = useState<string | null>(null);

  const [items, setItems] = useState<ReturnItem[]>([]);
  const [historyLoading, setHistoryLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showWizard, setShowWizard] = useState(false);

  // Wizard state
  const [step, setStep] = useState(1);
  const [orderNumber, setOrderNumber] = useState("");
  const [lookupError, setLookupError] = useState<string | null>(null);
  const [lookingUp, setLookingUp] = useState(false);
  const [order, setOrder] = useState<Order | null>(null);
  const [orderItems, setOrderItems] = useState<OrderItemRow[]>([]);
  const [selectedItemIds, setSelectedItemIds] = useState<Set<number>>(new Set());
  const [reasons, setReasons] = useState<Record<number, string>>({});
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [refundMethod, setRefundMethod] = useState<"voucher" | "original_payment">("voucher");
  const [note, setNote] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  useEffect(() => {
    if (!authLoading && !user) router.push("/login");
  }, [authLoading, user, router]);

  useEffect(() => {
    if (!user) return;
    supabase
      .from("customers")
      .select("id, full_name")
      .eq("auth_user_id", user.id)
      .single()
      .then(({ data }) => {
        setCustomerId(data?.id ?? null);
        setCustomerName(data?.full_name ?? null);
      });
    loadHistory();
  }, [user]);

  async function loadHistory() {
    setHistoryLoading(true);
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return;
    const res = await fetch("/api/account/returns", {
      headers: { Authorization: `Bearer ${session.access_token}` },
    });
    const json = await res.json();
    if (res.ok) setItems(json.complaints || []);
    else setError(json.error || "Failed to load");
    setHistoryLoading(false);
  }

  function startWizard() {
    setShowWizard(true);
    setStep(1);
    setOrderNumber("");
    setOrder(null);
    setOrderItems([]);
    setSelectedItemIds(new Set());
    setReasons({});
    setPhotoFile(null);
    setPhotoPreview(null);
    setRefundMethod("voucher");
    setNote("");
    setLookupError(null);
    setSubmitError(null);
  }

  function closeWizard() {
    setShowWizard(false);
  }

  async function handleLookup(e: React.FormEvent) {
    e.preventDefault();
    setLookupError(null);
    if (!orderNumber.trim() || !customerId) return;

    setLookingUp(true);
    const { data: foundOrder } = await supabase
      .from("orders")
      .select("id, order_number, status, created_at")
      .eq("order_number", orderNumber.trim())
      .eq("customer_id", customerId)
      .single();

    if (!foundOrder) {
      setLookupError("We couldn't find that order on your account. Double-check the order number.");
      setLookingUp(false);
      return;
    }
    if (!RETURNABLE_STATUSES.includes(foundOrder.status)) {
      setLookupError("This order isn't eligible for return yet — it needs to be shipped or delivered first.");
      setLookingUp(false);
      return;
    }

    const { data: rows } = await supabase
      .from("order_items")
      .select("id, quantity, variant:variants(color, size, price, product:products(name, image_url))")
      .eq("order_id", foundOrder.id);

    setOrder(foundOrder);
    setOrderItems((rows || []) as unknown as OrderItemRow[]);
    setLookingUp(false);
    setStep(2);
  }

  function toggleItem(id: number) {
    setSelectedItemIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
        setReasons((r) => {
          const copy = { ...r };
          delete copy[id];
          return copy;
        });
      } else next.add(id);
      return next;
    });
  }

  function setReason(id: number, reason: string) {
    setReasons((prev) => ({ ...prev, [id]: reason }));
  }

  function goToReview() {
    if (selectedItemIds.size === 0) {
      setLookupError("Please select at least one item to return.");
      return;
    }
    const missingReason = Array.from(selectedItemIds).some((id) => !reasons[id]);
    if (missingReason) {
      setLookupError("Please choose a reason for each selected item.");
      return;
    }
    setLookupError(null);
    setStep(3);
  }

  function handlePhotoChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setPhotoFile(file);
    setPhotoPreview(URL.createObjectURL(file));
  }

  async function handleSubmit() {
    if (!order || !customerId) return;
    setSubmitting(true);
    setSubmitError(null);

    try {
      let photo_url: string | undefined;
      if (photoFile) {
        const formData = new FormData();
        formData.append("file", photoFile);
        const uploadRes = await fetch("/api/complaints/upload-photo", { method: "POST", body: formData });
        const uploadJson = await uploadRes.json();
        if (!uploadRes.ok) {
          setSubmitError(uploadJson.error || "Failed to upload photo.");
          setSubmitting(false);
          return;
        }
        photo_url = uploadJson.url;
      }

      const itemLines = Array.from(selectedItemIds).map((id) => {
        const item = orderItems.find((i) => i.id === id);
        const name = item?.variant?.product?.name || "Item";
        return `${name} (${reasons[id]})`;
      });
      const message = `Return request for ${itemLines.join(", ")}.${note.trim() ? ` Note: ${note.trim()}` : ""}`;

      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (!session?.access_token) {
        setSubmitError("Your session expired. Please sign in again and retry.");
        setSubmitting(false);
        return;
      }

      const res = await fetch("/api/complaints", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          order_id: order.id,
          type: "return",
          message,
          order_item_ids: Array.from(selectedItemIds),
          photo_url,
          preferred_refund_method: refundMethod,
        }),
      });

      const json = await res.json();
      if (!res.ok) {
        setSubmitError(json.error || "Something went wrong. Please try again.");
        setSubmitting(false);
        return;
      }

      setSubmitting(false);
      setShowWizard(false);
      loadHistory();
    } catch {
      setSubmitError("Network error. Please try again.");
      setSubmitting(false);
    }
  }

  const inputClass =
    "w-full border rounded-lg px-4 py-3 bg-surface-elevated text-text-primary font-body-md text-body-md border-border-default focus:border-brand-primary focus:outline-none transition-colors";

  if (authLoading || historyLoading) {
    return (
      <main className="max-w-container-max mx-auto py-stack-lg">
        <p className="font-body-md text-body-md text-text-secondary">Loading...</p>
      </main>
    );
  }
  if (!user) return null;

  return (
    <main className="max-w-container-max mx-auto w-full py-stack-lg flex flex-col md:flex-row gap-gutter">
      <AccountSidebar name={customerName} />

      <section className="flex-grow flex flex-col gap-stack-md min-w-0">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="font-display-md text-display-md text-text-primary">Returns & Refunds</h1>
            <p className="font-body-md text-body-md text-text-secondary mt-2">
              We want you to be completely happy with your TinyTots order. Let's get this sorted.
            </p>
          </div>
          {!showWizard && (
            <button
              onClick={startWizard}
              className="bg-brand-primary text-white font-button text-button h-12 px-6 rounded-xl hover:opacity-90 transition-opacity flex items-center gap-2 shadow-sm whitespace-nowrap"
            >
              <span className="material-symbols-outlined">assignment_return</span> Start a Return
            </button>
          )}
        </div>

        {error && <p className="font-label-md text-label-md text-red-700">{error}</p>}

        {/* Wizard */}
        {showWizard && (
          <div className="border border-border-subtle rounded-2xl bg-surface-elevated p-6 md:p-8 flex flex-col gap-stack-md">
            <div className="flex items-center justify-between">
              {/* Stepper */}
              <div className="flex items-center gap-3">
                {STEPS.map((label, i) => {
                  const num = i + 1;
                  const done = step > num;
                  const active = step === num;
                  return (
                    <div key={label} className="flex items-center gap-2">
                      <div
                        className={`w-7 h-7 rounded-full flex items-center justify-center font-label-md text-label-md font-semibold shrink-0 ${
                          done
                            ? "bg-brand-primary text-white"
                            : active
                            ? "bg-brand-primary/10 text-brand-primary border-2 border-brand-primary"
                            : "bg-surface-secondary text-text-secondary"
                        }`}
                      >
                        {done ? <span className="material-symbols-outlined text-[16px]">check</span> : num}
                      </div>
                      <span className={`font-label-md text-label-md hidden sm:inline ${active ? "text-brand-primary font-semibold" : "text-text-secondary"}`}>
                        {label}
                      </span>
                      {i < STEPS.length - 1 && <div className="w-8 sm:w-12 h-px bg-border-default" />}
                    </div>
                  );
                })}
              </div>
              <button onClick={closeWizard} className="text-text-secondary hover:text-text-primary" aria-label="Close">
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            {/* Step 1: Lookup */}
            {step === 1 && (
              <form onSubmit={handleLookup} className="flex flex-col gap-4 max-w-md">
                <div>
                  <label className="font-body-sm text-body-sm text-text-secondary mb-2 block">
                    Enter your order number
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. ORD-1784875796185"
                    value={orderNumber}
                    onChange={(e) => setOrderNumber(e.target.value.trim())}
                    className={inputClass}
                  />
                </div>
                {lookupError && <p className="font-label-md text-label-md text-red-700">{lookupError}</p>}
                <button
                  type="submit"
                  disabled={lookingUp || !orderNumber.trim()}
                  className="self-start bg-brand-primary text-white font-button text-button px-6 py-3 rounded-xl hover:opacity-90 transition-opacity disabled:opacity-50"
                >
                  {lookingUp ? "Looking up..." : "Find Order"}
                </button>
              </form>
            )}

            {/* Step 2: Select Items */}
            {step === 2 && order && (
              <div className="flex flex-col gap-stack-md">
                <div className="border border-border-subtle rounded-xl px-5 py-4 flex justify-between items-center bg-surface-secondary">
                  <div>
                    <p className="font-label-md text-label-md text-green-700 uppercase tracking-wider mb-1">Order Validated</p>
                    <p className="font-headline-md text-headline-md text-text-primary">Order #{order.order_number}</p>
                    <p className="font-label-md text-label-md text-text-secondary">
                      Placed on {new Date(order.created_at).toLocaleDateString()}
                    </p>
                  </div>
                  <button onClick={() => setStep(1)} className="font-label-md text-label-md text-brand-primary hover:underline">
                    Change Order
                  </button>
                </div>

                <div>
                  <h2 className="font-headline-md text-headline-md text-text-primary mb-3">Select items to return</h2>
                  <div className="flex flex-col gap-3">
                    {orderItems.map((item) => {
                      const checked = selectedItemIds.has(item.id);
                      return (
                        <div
                          key={item.id}
                          className={`border rounded-xl p-4 flex flex-col md:flex-row md:items-center gap-4 transition-colors ${
                            checked ? "border-brand-primary bg-brand-primary/5" : "border-border-default"
                          }`}
                        >
                          <label className="flex items-center gap-4 flex-grow cursor-pointer">
                            <input type="checkbox" checked={checked} onChange={() => toggleItem(item.id)} className="w-5 h-5 accent-brand-primary shrink-0" />
                            {item.variant?.product?.image_url && (
                              <img src={item.variant.product.image_url} alt="" className="w-16 h-16 object-cover rounded-lg border border-border-default shrink-0" />
                            )}
                            <div className={`min-w-0 ${!checked ? "opacity-70" : ""}`}>
                              <p className="font-body-md text-body-md text-text-primary font-medium">
                                {item.variant?.product?.name || "Item"}
                              </p>
                              <p className="font-label-md text-label-md text-text-secondary">
                                {[item.variant?.color, item.variant?.size].filter(Boolean).join(" • ")}
                              </p>
                              <p className="font-body-sm text-body-sm text-text-secondary mt-1">
                                Rs. {item.variant?.price?.toLocaleString()}
                              </p>
                            </div>
                          </label>
                          <div className={`w-full md:w-56 shrink-0 ${!checked ? "opacity-50 pointer-events-none" : ""}`}>
                            <label className="font-label-md text-label-md text-text-secondary mb-1 block">Reason for return</label>
                            <select
                              value={reasons[item.id] || ""}
                              onChange={(e) => setReason(item.id, e.target.value)}
                              disabled={!checked}
                              className={inputClass}
                            >
                              <option value="">Select reason</option>
                              {REASONS.map((r) => (
                                <option key={r} value={r}>{r}</option>
                              ))}
                            </select>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {lookupError && <p className="font-label-md text-label-md text-red-700">{lookupError}</p>}

                <button
                  onClick={goToReview}
                  className="self-start bg-brand-primary text-white font-button text-button px-6 py-3 rounded-xl hover:opacity-90 transition-opacity"
                >
                  Continue to Review
                </button>
              </div>
            )}

            {/* Step 3: Review */}
            {step === 3 && order && (
              <div className="flex flex-col gap-stack-md">
                <div>
                  <h2 className="font-headline-md text-headline-md text-text-primary mb-3">
                    How would you like your refund?
                  </h2>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <button
                      onClick={() => setRefundMethod("voucher")}
                      className={`text-left rounded-xl p-5 border-2 transition-all ${
                        refundMethod === "voucher"
                          ? "border-brand-primary bg-brand-primary/5"
                          : "border-border-default hover:border-brand-primary/50"
                      }`}
                    >
                      <div className="flex items-center gap-2 mb-2">
                        <span className="material-symbols-outlined text-brand-primary">storefront</span>
                        <span className="font-label-md text-label-md text-green-700 bg-green-700/10 px-2 py-0.5 rounded-full">
                          Instant Processing
                        </span>
                      </div>
                      <p className="font-headline-md text-headline-md text-text-primary mb-1">Store Credit Voucher</p>
                      <p className="font-body-sm text-body-sm text-text-secondary">
                        Receive a digital voucher as soon as your return ships.
                      </p>
                    </button>
                    <button
                      onClick={() => setRefundMethod("original_payment")}
                      className={`text-left rounded-xl p-5 border-2 transition-all ${
                        refundMethod === "original_payment"
                          ? "border-brand-primary bg-brand-primary/5"
                          : "border-border-default hover:border-brand-primary/50"
                      }`}
                    >
                      <div className="flex items-center gap-2 mb-2">
                        <span className="material-symbols-outlined text-brand-primary">credit_card</span>
                      </div>
                      <p className="font-headline-md text-headline-md text-text-primary mb-1">Original Payment Method</p>
                      <p className="font-body-sm text-body-sm text-text-secondary">
                        Refunded to your original payment method. Takes 5–7 business days after inspection.
                      </p>
                    </button>
                  </div>
                </div>

                <div>
                  <label className="font-body-sm text-body-sm text-text-secondary mb-2 block">
                    Anything else we should know? (optional)
                  </label>
                  <textarea
                    value={note}
                    onChange={(e) => setNote(e.target.value.slice(0, MAX_MESSAGE_LEN))}
                    rows={3}
                    className={inputClass}
                  />
                </div>

                <div>
                  <label className="font-body-sm text-body-sm text-text-secondary mb-2 block">Photo (optional)</label>
                  <input
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    onChange={handlePhotoChange}
                    className="font-body-sm text-body-sm text-text-secondary"
                  />
                  {photoPreview && (
                    <img src={photoPreview} alt="Preview" className="mt-2 w-24 h-24 object-cover rounded-lg border border-border-default" />
                  )}
                </div>

                <p className="font-label-md text-label-md text-text-secondary border-t border-border-default pt-4">
                  By submitting this request, you agree to our{" "}
                  <a href="/shipping-returns" className="text-brand-primary hover:underline">Return Policy</a>.
                </p>

                {submitError && <p className="font-label-md text-label-md text-red-700">{submitError}</p>}

                <div className="flex items-center gap-3">
                  <button
                    onClick={handleSubmit}
                    disabled={submitting}
                    className="bg-brand-primary text-white font-button text-button px-6 py-3 rounded-xl hover:opacity-90 transition-opacity disabled:opacity-50 flex items-center gap-2"
                  >
                    {submitting ? "Submitting..." : "Submit Return Request"}
                    {!submitting && <span className="material-symbols-outlined text-[18px]">arrow_forward</span>}
                  </button>
                  <button onClick={() => setStep(2)} className="font-button text-button text-text-secondary hover:underline">
                    Back
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* History */}
        {!showWizard && items.length === 0 && (
          <div className="border border-dashed border-border-default rounded-2xl p-10 flex flex-col items-center text-center gap-3 bg-surface-elevated">
            <span className="material-symbols-outlined text-[40px] text-text-secondary">inventory_2</span>
            <p className="font-body-md text-body-md text-text-secondary">No returns or reports yet.</p>
          </div>
        )}

        {!showWizard && items.length > 0 && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-bento-gap">
            {items.map((c) => (
              <div key={c.id} className="border border-border-subtle rounded-2xl p-6 bg-surface-elevated flex flex-col gap-3">
                <div className="flex justify-between items-start gap-3">
                  <span className={`px-3 py-1 rounded-full font-label-md text-label-md border ${STATUS_PILL[c.status] ?? "bg-surface-secondary text-text-secondary border-border-default"}`}>
                    {STATUS_LABELS[c.status] || c.status}
                  </span>
                  <span className="font-label-md text-label-md text-text-secondary whitespace-nowrap">
                    {new Date(c.created_at).toLocaleDateString()}
                  </span>
                </div>
                <p className="font-body-sm text-body-md text-text-primary">{c.message}</p>
                {c.order && (
                  <p className="font-label-md text-label-md text-text-secondary font-mono">Order: {c.order.order_number}</p>
                )}
                {c.photo_url && (
                  <img src={c.photo_url} alt="Attached photo" className="w-20 h-20 object-cover rounded-xl border border-border-default" />
                )}
              </div>
            ))}
          </div>
        )}
      </section>
    </main>
  );
}