"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import { supabase } from "@/lib/supabase";
import AccountSidebar from "@/components/AccountSidebar";

const MAX_MESSAGE_LEN = 1000;

type ReturnItem = {
  id: number;
  type: string;
  message: string;
  status: string;
  photo_url: string | null;
  created_at: string;
  order: { id: number; order_number: string } | null;
};

type OrderOption = {
  id: number;
  order_number: string;
  status: string;
  created_at: string;
};

type OrderItemOption = {
  id: number;
  quantity: number;
  variant: { color: string | null; size: string | null; product: { name: string } | null } | null;
};

const STATUS_LABELS: Record<string, string> = {
  open: "Submitted",
  in_progress: "Being reviewed",
  approved: "Approved",
  rejected: "Rejected",
  refunded: "Refunded",
  exchanged: "Exchanged",
  resolved: "Resolved",
};

const STATUS_PILL: Record<string, string> = {
  open: "bg-surface-container-high text-on-surface-variant border-outline/10",
  in_progress: "bg-primary-container/20 text-on-primary-container border-primary-container/30",
  approved: "bg-secondary-container/20 text-on-secondary-container border-secondary-container/30",
  rejected: "bg-error-container/40 text-on-error-container border-error-container",
  refunded: "bg-tertiary-container/20 text-on-tertiary-container border-tertiary-container/30",
  exchanged: "bg-tertiary-container/20 text-on-tertiary-container border-tertiary-container/30",
  resolved: "bg-tertiary-container/20 text-on-tertiary-container border-tertiary-container/30",
};

// Only orders in these statuses are eligible to be returned.
const RETURNABLE_STATUSES = ["shipped", "delivered"];

export default function MyReturnsPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const [customerId, setCustomerId] = useState<number | null>(null);
  const [customerName, setCustomerName] = useState<string | null>(null);

  const [items, setItems] = useState<ReturnItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Start-a-return form state
  const [showForm, setShowForm] = useState(false);
  const [eligibleOrders, setEligibleOrders] = useState<OrderOption[]>([]);
  const [ordersLoading, setOrdersLoading] = useState(false);
  const [selectedOrderId, setSelectedOrderId] = useState<number | null>(null);
  const [orderItems, setOrderItems] = useState<OrderItemOption[]>([]);
  const [selectedItemIds, setSelectedItemIds] = useState<Set<number>>(new Set());
  const [reason, setReason] = useState("");
  const [message, setMessage] = useState("");
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

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

    loadReturns();
  }, [user]);

  async function loadReturns() {
    setLoading(true);
    const {
      data: { session },
    } = await supabase.auth.getSession();
    if (!session) return;
    const res = await fetch("/api/account/returns", {
      headers: { Authorization: `Bearer ${session.access_token}` },
    });
    const json = await res.json();
    if (res.ok) setItems(json.complaints || []);
    else setError(json.error || "Failed to load");
    setLoading(false);
  }

  async function openForm() {
    setShowForm(true);
    setFormError(null);
    if (!customerId) return;
    setOrdersLoading(true);
    const { data } = await supabase
      .from("orders")
      .select("id, order_number, status, created_at")
      .eq("customer_id", customerId)
      .in("status", RETURNABLE_STATUSES)
      .order("created_at", { ascending: false });
    setEligibleOrders(data || []);
    setOrdersLoading(false);
  }

  function closeForm() {
    setShowForm(false);
    setSelectedOrderId(null);
    setOrderItems([]);
    setSelectedItemIds(new Set());
    setReason("");
    setMessage("");
    setPhotoFile(null);
    setPhotoPreview(null);
    setFormError(null);
  }

  async function selectOrder(orderId: number) {
    setSelectedOrderId(orderId);
    setSelectedItemIds(new Set());
    setOrderItems([]);
    const { data } = await supabase
      .from("order_items")
      .select("id, quantity, variant:variants(color, size, product:products(name))")
      .eq("order_id", orderId);
    setOrderItems((data || []) as unknown as OrderItemOption[]);
  }

  function toggleItem(id: number) {
    setSelectedItemIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function handlePhotoChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setPhotoFile(file);
    setPhotoPreview(URL.createObjectURL(file));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setFormError(null);

    if (!selectedOrderId) {
      setFormError("Please select the order you'd like to return.");
      return;
    }
    if (selectedItemIds.size === 0) {
      setFormError("Please select at least one item to return.");
      return;
    }
    if (!message.trim()) {
      setFormError("Please tell us briefly why you're returning this.");
      return;
    }

    setSubmitting(true);
    try {
      let photo_url: string | undefined;
      if (photoFile) {
        const formData = new FormData();
        formData.append("file", photoFile);
        const uploadRes = await fetch("/api/complaints/upload-photo", {
          method: "POST",
          body: formData,
        });
        const uploadJson = await uploadRes.json();
        if (!uploadRes.ok) {
          setFormError(uploadJson.error || "Failed to upload photo. Please try again.");
          setSubmitting(false);
          return;
        }
        photo_url = uploadJson.url;
      }

      const fullMessage = reason ? `[${reason}] ${message.trim()}` : message.trim();

      const res = await fetch("/api/complaints", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          customer_id: customerId,
          order_id: selectedOrderId,
          type: "return",
          message: fullMessage,
          order_item_ids: Array.from(selectedItemIds),
          photo_url,
        }),
      });

      const json = await res.json();
      if (!res.ok) {
        setFormError(json.error || "Something went wrong. Please try again.");
        setSubmitting(false);
        return;
      }

      setSubmitting(false);
      closeForm();
      loadReturns();
    } catch {
      setFormError("Network error. Please try again.");
      setSubmitting(false);
    }
  }

  const inputClass =
    "w-full border rounded-lg px-4 py-3 bg-surface text-on-surface font-body-md text-body-md border-outline-variant focus:border-primary focus:outline-none transition-colors";

  if (authLoading || loading) {
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
              Track the status of every return, exchange, or issue you've reported.
            </p>
          </div>
          {!showForm && (
            <button
              onClick={openForm}
              className="bg-primary-container text-on-primary font-button text-button h-12 px-6 rounded-xl hover:opacity-90 transition-opacity flex items-center gap-2 shadow-sm whitespace-nowrap"
            >
              <span className="material-symbols-outlined">assignment_return</span> Start a Return
            </button>
          )}
        </div>

        {error && <p className="font-label-md text-label-md text-error">{error}</p>}

        {/* Start-a-return form */}
        {showForm && (
          <form
            onSubmit={handleSubmit}
            className="border border-outline-variant/30 rounded-2xl p-6 bg-surface-container-lowest flex flex-col gap-4"
          >
            <div className="flex items-center justify-between">
              <h2 className="font-headline-md text-headline-md text-on-surface">Start a Return</h2>
              <button
                type="button"
                onClick={closeForm}
                className="text-on-surface-variant hover:text-on-surface"
                aria-label="Close"
              >
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            <div>
              <label className="font-body-sm text-body-sm text-on-surface-variant mb-2 block">
                Which order is this for?
              </label>
              {ordersLoading ? (
                <p className="font-body-sm text-body-sm text-on-surface-variant">Loading your orders...</p>
              ) : eligibleOrders.length === 0 ? (
                <p className="font-body-sm text-body-sm text-on-surface-variant">
                  You don't have any shipped or delivered orders eligible for return right now.
                </p>
              ) : (
                <div className="flex flex-col gap-2">
                  {eligibleOrders.map((o) => (
                    <label
                      key={o.id}
                      className={`flex items-center justify-between gap-3 border rounded-xl px-4 py-3 cursor-pointer transition-colors ${
                        selectedOrderId === o.id
                          ? "border-primary bg-primary-container/10"
                          : "border-outline-variant/30 hover:bg-surface-container-low"
                      }`}
                    >
                      <span className="flex items-center gap-3">
                        <input
                          type="radio"
                          name="order"
                          checked={selectedOrderId === o.id}
                          onChange={() => selectOrder(o.id)}
                        />
                        <span className="font-body-sm text-body-sm text-on-surface">{o.order_number}</span>
                      </span>
                      <span className="font-label-md text-label-md text-on-surface-variant">
                        {new Date(o.created_at).toLocaleDateString()}
                      </span>
                    </label>
                  ))}
                </div>
              )}
            </div>

            {selectedOrderId && orderItems.length > 0 && (
              <div>
                <label className="font-body-sm text-body-sm text-on-surface-variant mb-2 block">
                  Which item(s) are you returning?
                </label>
                <div className="flex flex-col gap-2">
                  {orderItems.map((item) => (
                    <label
                      key={item.id}
                      className="flex items-center gap-3 border border-outline-variant/30 rounded-lg px-4 py-3 cursor-pointer hover:bg-surface-container-low transition-colors"
                    >
                      <input
                        type="checkbox"
                        checked={selectedItemIds.has(item.id)}
                        onChange={() => toggleItem(item.id)}
                      />
                      <span className="font-body-sm text-body-sm text-on-surface">
                        {item.variant?.product?.name || "Item"}
                        {item.variant?.color && ` — ${item.variant.color}`}
                        {item.variant?.size && ` / ${item.variant.size}`}
                        {` × ${item.quantity}`}
                      </span>
                    </label>
                  ))}
                </div>
              </div>
            )}

            {selectedOrderId && (
              <>
                <div>
                  <label className="font-body-sm text-body-sm text-on-surface-variant mb-2 block">
                    Reason
                  </label>
                  <select value={reason} onChange={(e) => setReason(e.target.value)} className={inputClass}>
                    <option value="">Select a reason</option>
                    <option value="Wrong size">Wrong size</option>
                    <option value="Wrong item received">Wrong item received</option>
                    <option value="Damaged / defective">Damaged / defective</option>
                    <option value="Not as described">Not as described</option>
                    <option value="Changed my mind">Changed my mind</option>
                    <option value="Other">Other</option>
                  </select>
                </div>

                <div>
                  <label className="font-body-sm text-body-sm text-on-surface-variant mb-2 block">
                    Tell us more
                  </label>
                  <textarea
                    placeholder="Add any details that will help us process this quickly..."
                    value={message}
                    onChange={(e) => setMessage(e.target.value.slice(0, MAX_MESSAGE_LEN))}
                    maxLength={MAX_MESSAGE_LEN}
                    rows={4}
                    className={inputClass}
                  />
                </div>

                <div>
                  <label className="font-body-sm text-body-sm text-on-surface-variant mb-2 block">
                    Photo (optional)
                  </label>
                  <input
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    onChange={handlePhotoChange}
                    className="font-body-sm text-body-sm text-on-surface-variant"
                  />
                  {photoPreview && (
                    <img
                      src={photoPreview}
                      alt="Preview"
                      className="mt-2 w-24 h-24 object-cover rounded-lg border border-outline-variant/20"
                    />
                  )}
                </div>

                <div className="flex items-center gap-3 mt-1">
                  <button
                    type="submit"
                    disabled={submitting}
                    className="bg-primary-container text-on-primary font-button text-button px-6 py-3 rounded-xl hover:opacity-90 transition-opacity disabled:opacity-50"
                  >
                    {submitting ? "Submitting..." : "Submit Return Request"}
                  </button>
                  <button
                    type="button"
                    onClick={closeForm}
                    className="font-button text-button text-on-surface-variant hover:underline"
                  >
                    Cancel
                  </button>
                </div>
              </>
            )}

            {formError && <p className="font-label-md text-label-md text-error">{formError}</p>}
          </form>
        )}

        {/* History */}
        {items.length === 0 ? (
          !showForm && (
            <div className="border border-dashed border-outline-variant/40 rounded-2xl p-10 flex flex-col items-center text-center gap-3 bg-surface-container-lowest">
              <span className="material-symbols-outlined text-[40px] text-on-surface-variant">inventory_2</span>
              <p className="font-body-md text-body-md text-on-surface-variant">No returns or reports yet.</p>
              <button onClick={openForm} className="font-body-sm text-body-sm text-primary hover:underline">
                Start a return →
              </button>
            </div>
          )
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-bento-gap">
            {items.map((c) => (
              <div
                key={c.id}
                className="border border-outline-variant/20 rounded-2xl p-6 bg-surface-container-lowest flex flex-col gap-3"
              >
                <div className="flex justify-between items-start gap-3">
                  <span
                    className={`px-3 py-1 rounded-full font-label-md text-label-md border ${
                      STATUS_PILL[c.status] ?? "bg-surface-container-high text-on-surface-variant border-outline/10"
                    }`}
                  >
                    {STATUS_LABELS[c.status] || c.status}
                  </span>
                  <span className="font-label-md text-label-md text-on-surface-variant whitespace-nowrap">
                    {new Date(c.created_at).toLocaleDateString()}
                  </span>
                </div>
                <p className="font-body-sm text-body-md text-on-surface">{c.message}</p>
                {c.order && (
                  <p className="font-label-md text-label-md text-on-surface-variant font-mono">
                    Order: {c.order.order_number}
                  </p>
                )}
                {c.photo_url && (
                  <img
                    src={c.photo_url}
                    alt="Attached photo"
                    className="w-20 h-20 object-cover rounded-xl border border-outline-variant/20"
                  />
                )}
              </div>
            ))}
          </div>
        )}
      </section>
    </main>
  );
}