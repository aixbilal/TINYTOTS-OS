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
  open: "bg-surface-container-high text-on-surface-variant border-on-surface/5",
  in_progress: "bg-primary-container/20 text-on-primary-container border-primary-container/30",
  approved: "bg-secondary-container/20 text-on-secondary-container border-secondary-container/30",
  rejected: "bg-error-container/40 text-on-error-container border-error-container",
  refunded: "bg-tertiary-container/20 text-on-tertiary-container border-tertiary-container/30",
  exchanged: "bg-tertiary-container/20 text-on-tertiary-container border-tertiary-container/30",
  resolved: "bg-tertiary-container/20 text-on-tertiary-container border-tertiary-container/30",
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

      const res = await fetch("/api/complaints", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          customer_id: customerId,
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
    "w-full border rounded-lg px-4 py-3 bg-surface text-on-surface font-body-md text-body-md border-outline-variant focus:border-primary focus:outline-none transition-colors";

  if (authLoading || historyLoading) {
    return (
      <main className="max-w-container-max mx-auto py-stack-lg">
        <p className="font-body-md text-body-md text-on-surface-variant">Loading...</p>
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
            <h1 className="font-display-md text-display-md text-on-surface">Returns & Refunds</h1>
            <p className="font-body-md text-body-md text-on-surface-variant mt-2">
              We want you to be completely happy with your TinyTots order. Let's get this sorted.
            </p>
          </div>
          {!showWizard && (
            <button
              onClick={startWizard}
              className="bg-primary-container text-on-primary font-button text-button h-12 px-6 rounded-xl hover:opacity-90 transition-opacity flex items-center gap-2 shadow-sm whitespace-nowrap"
            >
              <span className="material-symbols-outlined">assignment_return</span> Start a Return
            </button>
          )}
        </div>

        {error && <p className="font-label-md text-label-md text-error">{error}</p>}

        {/* Wizard */}
        {showWizard && (
          <div className="border border-on-surface/5 rounded-2xl bg-surface-container-lowest p-6 md:p-8 flex flex-col gap-stack-md">
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
                            ? "bg-primary text-on-primary"
                            : active
                            ? "bg-primary-container text-on-primary-container border-2 border-primary"
                            : "bg-surface-container-high text-on-surface-variant"
                        }`}
                      >
                        {done ? <span className="material-symbols-outlined text-[16px]">check</span> : num}
                      </div>
                      <span className={`font-label-md text-label-md hidden sm:inline ${active ? "text-primary font-semibold" : "text-on-surface-variant"}`}>
                        {label}
                      </span>
                      {i < STEPS.length - 1 && <div className="w-8 sm:w-12 h-px bg-outline-variant/40" />}
                    </div>
                  );
                })}
              </div>
              <button onClick={closeWizard} className="text-on-surface-variant hover:text-on-surface" aria-label="Close">
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            {/* Step 1: Lookup */}
            {step === 1 && (
              <form onSubmit={handleLookup} className="flex flex-col gap-4 max-w-md">
                <div>
                  <label className="font-body-sm text-body-sm text-on-surface-variant mb-2 block">
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
                {lookupError && <p className="font-label-md text-label-md text-error">{lookupError}</p>}
                <button
                  type="submit"
                  disabled={lookingUp || !orderNumber.trim()}
                  className="self-start bg-primary-container text-on-primary font-button text-button px-6 py-3 rounded-xl hover:opacity-90 transition-opacity disabled:opacity-50"
                >
                  {lookingUp ? "Looking up..." : "Find Order"}
                </button>
              </form>
            )}

            {/* Step 2: Select Items */}
            {step === 2 && order && (
              <div className="flex flex-col gap-stack-md">
                <div className="border border-on-surface/5 rounded-xl px-5 py-4 flex justify-between items-center bg-surface-container-low">
                  <div>
                    <p className="font-label-md text-label-md text-tertiary uppercase tracking-wider mb-1">Order Validated</p>
                    <p className="font-headline-md text-headline-md text-on-surface">Order #{order.order_number}</p>
                    <p className="font-label-md text-label-md text-on-surface-variant">
                      Placed on {new Date(order.created_at).toLocaleDateString()}
                    </p>
                  </div>
                  <button onClick={() => setStep(1)} className="font-label-md text-label-md text-primary hover:underline">
                    Change Order
                  </button>
                </div>

                <div>
                  <h2 className="font-headline-md text-headline-md text-on-surface mb-3">Select items to return</h2>
                  <div className="flex flex-col gap-3">
                    {orderItems.map((item) => {
                      const checked = selectedItemIds.has(item.id);
                      return (
                        <div
                          key={item.id}
                          className={`border rounded-xl p-4 flex flex-col md:flex-row md:items-center gap-4 transition-colors ${
                            checked ? "border-primary bg-primary-container/5" : "border-outline-variant/30"
                          }`}
                        >
                          <label className="flex items-center gap-4 flex-grow cursor-pointer">
                            <input type="checkbox" checked={checked} onChange={() => toggleItem(item.id)} className="w-5 h-5 accent-primary shrink-0" />
                            {item.variant?.product?.image_url && (
                              <img src={item.variant.product.image_url} alt="" className="w-16 h-16 object-cover rounded-lg border border-outline-variant/20 shrink-0" />
                            )}
                            <div className={`min-w-0 ${!checked ? "opacity-70" : ""}`}>
                              <p className="font-body-md text-body-md text-on-surface font-medium">
                                {item.variant?.product?.name || "Item"}
                              </p>
                              <p className="font-label-md text-label-md text-on-surface-variant">
                                {[item.variant?.color, item.variant?.size].filter(Boolean).join(" • ")}
                              </p>
                              <p className="font-body-sm text-body-sm text-on-surface-variant mt-1">
                                Rs. {item.variant?.price?.toLocaleString()}
                              </p>
                            </div>
                          </label>
                          <div className={`w-full md:w-56 shrink-0 ${!checked ? "opacity-50 pointer-events-none" : ""}`}>
                            <label className="font-label-md text-label-md text-on-surface-variant mb-1 block">Reason for return</label>
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

                {lookupError && <p className="font-label-md text-label-md text-error">{lookupError}</p>}

                <button
                  onClick={goToReview}
                  className="self-start bg-primary-container text-on-primary font-button text-button px-6 py-3 rounded-xl hover:opacity-90 transition-opacity"
                >
                  Continue to Review
                </button>
              </div>
            )}

            {/* Step 3: Review */}
            {step === 3 && order && (
              <div className="flex flex-col gap-stack-md">
                <div>
                  <h2 className="font-headline-md text-headline-md text-on-surface mb-3">
                    How would you like your refund?
                  </h2>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <button
                      onClick={() => setRefundMethod("voucher")}
                      className={`text-left rounded-xl p-5 border-2 transition-all ${
                        refundMethod === "voucher"
                          ? "border-primary-container bg-primary-container/5"
                          : "border-outline-variant/30 hover:border-outline-variant"
                      }`}
                    >
                      <div className="flex items-center gap-2 mb-2">
                        <span className="material-symbols-outlined text-primary">storefront</span>
                        <span className="font-label-md text-label-md text-tertiary bg-tertiary-container/20 px-2 py-0.5 rounded-full">
                          Instant Processing
                        </span>
                      </div>
                      <p className="font-headline-md text-headline-md text-on-surface mb-1">Store Credit Voucher</p>
                      <p className="font-body-sm text-body-sm text-on-surface-variant">
                        Receive a digital voucher as soon as your return ships.
                      </p>
                    </button>
                    <button
                      onClick={() => setRefundMethod("original_payment")}
                      className={`text-left rounded-xl p-5 border-2 transition-all ${
                        refundMethod === "original_payment"
                          ? "border-primary-container bg-primary-container/5"
                          : "border-outline-variant/30 hover:border-outline-variant"
                      }`}
                    >
                      <div className="flex items-center gap-2 mb-2">
                        <span className="material-symbols-outlined text-primary">credit_card</span>
                      </div>
                      <p className="font-headline-md text-headline-md text-on-surface mb-1">Original Payment Method</p>
                      <p className="font-body-sm text-body-sm text-on-surface-variant">
                        Refunded to your original payment method. Takes 5–7 business days after inspection.
                      </p>
                    </button>
                  </div>
                </div>

                <div>
                  <label className="font-body-sm text-body-sm text-on-surface-variant mb-2 block">
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
                  <label className="font-body-sm text-body-sm text-on-surface-variant mb-2 block">Photo (optional)</label>
                  <input
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    onChange={handlePhotoChange}
                    className="font-body-sm text-body-sm text-on-surface-variant"
                  />
                  {photoPreview && (
                    <img src={photoPreview} alt="Preview" className="mt-2 w-24 h-24 object-cover rounded-lg border border-outline-variant/20" />
                  )}
                </div>

                <p className="font-label-md text-label-md text-on-surface-variant border-t border-outline-variant/20 pt-4">
                  By submitting this request, you agree to our{" "}
                  <a href="/shipping-returns" className="text-primary hover:underline">Return Policy</a>.
                </p>

                {submitError && <p className="font-label-md text-label-md text-error">{submitError}</p>}

                <div className="flex items-center gap-3">
                  <button
                    onClick={handleSubmit}
                    disabled={submitting}
                    className="bg-primary-container text-on-primary font-button text-button px-6 py-3 rounded-xl hover:opacity-90 transition-opacity disabled:opacity-50 flex items-center gap-2"
                  >
                    {submitting ? "Submitting..." : "Submit Return Request"}
                    {!submitting && <span className="material-symbols-outlined text-[18px]">arrow_forward</span>}
                  </button>
                  <button onClick={() => setStep(2)} className="font-button text-button text-on-surface-variant hover:underline">
                    Back
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* History */}
        {!showWizard && items.length === 0 && (
          <div className="border border-dashed border-outline-variant/40 rounded-2xl p-10 flex flex-col items-center text-center gap-3 bg-surface-container-lowest">
            <span className="material-symbols-outlined text-[40px] text-on-surface-variant">inventory_2</span>
            <p className="font-body-md text-body-md text-on-surface-variant">No returns or reports yet.</p>
          </div>
        )}

        {!showWizard && items.length > 0 && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-bento-gap">
            {items.map((c) => (
              <div key={c.id} className="border border-on-surface/5 rounded-2xl p-6 bg-surface-container-lowest flex flex-col gap-3">
                <div className="flex justify-between items-start gap-3">
                  <span className={`px-3 py-1 rounded-full font-label-md text-label-md border ${STATUS_PILL[c.status] ?? "bg-surface-container-high text-on-surface-variant border-on-surface/5"}`}>
                    {STATUS_LABELS[c.status] || c.status}
                  </span>
                  <span className="font-label-md text-label-md text-on-surface-variant whitespace-nowrap">
                    {new Date(c.created_at).toLocaleDateString()}
                  </span>
                </div>
                <p className="font-body-sm text-body-md text-on-surface">{c.message}</p>
                {c.order && (
                  <p className="font-label-md text-label-md text-on-surface-variant font-mono">Order: {c.order.order_number}</p>
                )}
                {c.photo_url && (
                  <img src={c.photo_url} alt="Attached photo" className="w-20 h-20 object-cover rounded-xl border border-outline-variant/20" />
                )}
              </div>
            ))}
          </div>
        )}
      </section>
    </main>
  );
}