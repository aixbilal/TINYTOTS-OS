"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/lib/auth-context";
import { supabase } from "@/lib/supabase";
import { isValidPakPhone, PAK_PHONE_ERROR } from "@/lib/validate-phone";

const MAX_LEN = { name: 80, phone: 20, message: 1000 };

function sanitize(v: string, max: number) {
  return v.replace(/[<>]/g, "").slice(0, max);
}

type OrderItemOption = {
  id: number;
  quantity: number;
  variant: { color: string | null; size: string | null; product: { name: string } | null } | null;
};

export default function ReportIssuePage() {
  const { user } = useAuth();
  const [customerId, setCustomerId] = useState<number | null>(null);

  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [orderNumber, setOrderNumber] = useState("");
  const [orderId, setOrderId] = useState<number | null>(null);
  const [orderItems, setOrderItems] = useState<OrderItemOption[]>([]);
  const [selectedItemIds, setSelectedItemIds] = useState<Set<number>>(new Set());
  const [type, setType] = useState("other");
  const [message, setMessage] = useState("");
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (!user) return;
    supabase
      .from("customers")
      .select("id")
      .eq("auth_user_id", user.id)
      .single()
      .then(({ data }) => {
        if (data) setCustomerId(data.id);
      });
  }, [user]);

  // Look up the order and its items whenever the order number changes and
  // the person is reporting a return — only returns need item selection.
  useEffect(() => {
    setOrderId(null);
    setOrderItems([]);
    setSelectedItemIds(new Set());

    if (type !== "return" || !orderNumber.trim()) return;

    const timeout = setTimeout(async () => {
      const { data: order } = await supabase
        .from("orders")
        .select("id")
        .eq("order_number", orderNumber.trim())
        .single();

      if (!order) return;
      setOrderId(order.id);

      const { data: items } = await supabase
        .from("order_items")
        .select("id, quantity, variant:variants(color, size, product:products(name))")
        .eq("order_id", order.id);

        setOrderItems((items || []) as unknown as OrderItemOption[]);
    }, 500);

    return () => clearTimeout(timeout);
  }, [orderNumber, type]);

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

  function validate() {
    const errs: Record<string, string> = {};
    if (!user) {
      if (!name.trim()) errs.name = "Please enter your name.";
      if (!phone.trim()) errs.phone = "Please enter your phone number.";
      else if (!isValidPakPhone(phone)) errs.phone = PAK_PHONE_ERROR;
    }
    if (!message.trim()) errs.message = "Please describe your issue.";
    setFieldErrors(errs);
    return Object.keys(errs).length === 0;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!validate()) return;

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
          setError(uploadJson.error || "Failed to upload photo. Please try again.");
          setSubmitting(false);
          return;
        }
        photo_url = uploadJson.url;
      }

      let resolvedOrderId = orderId ?? undefined;
      if (!resolvedOrderId && orderNumber.trim()) {
        const { data: order } = await supabase
          .from("orders")
          .select("id")
          .eq("order_number", orderNumber.trim())
          .single();
        if (order) resolvedOrderId = order.id;
      }

      const headers: Record<string, string> = { "Content-Type": "application/json" };
      if (user) {
        const {
          data: { session },
        } = await supabase.auth.getSession();
        if (!session?.access_token) {
          setError("Your session expired. Please sign in again and retry.");
          setSubmitting(false);
          return;
        }
        headers.Authorization = `Bearer ${session.access_token}`;
      }

      const res = await fetch("/api/complaints", {
        method: "POST",
        headers,
        body: JSON.stringify({
          order_id: resolvedOrderId,
          reporter_name: user ? undefined : name.trim(),
          reporter_phone: user ? undefined : phone.trim(),
          type,
          message: message.trim(),
          order_item_ids: Array.from(selectedItemIds),
          photo_url,
        }),
      });

      const json = await res.json();

      if (!res.ok) {
        setError(json.error || "Something went wrong. Please try again.");
        setSubmitting(false);
        return;
      }

      setSubmitted(true);
    } catch {
      setError("Network error. Please try again.");
      setSubmitting(false);
    }
  }

  const inputClass = (hasError: boolean) =>
    `w-full border rounded-lg px-4 py-3 bg-surface-container-lowest text-on-surface font-body-md text-body-md focus:outline-none transition-colors ${
      hasError ? "border-error focus:border-error" : "border-outline-variant focus:border-primary"
    }`;

  const FieldError = ({ msg }: { msg?: string }) =>
    msg ? <p className="font-label-md text-label-md text-error mt-1">{msg}</p> : null;

  if (submitted) {
    return (
      <main className="max-w-xl mx-auto px-margin-mobile md:px-margin-desktop py-stack-lg text-center">
        <h1 className="font-display-md text-display-md text-on-surface mb-4">Thank you</h1>
        <p className="font-body-md text-body-md text-on-surface-variant">
          We've received your report and our team will get back to you soon.
          {user && " You can track its status in "}
          {user && (
            <a href="/account/returns" className="text-primary hover:underline">
              My Returns & Reports
            </a>
          )}
          {user && "."}
        </p>
      </main>
    );
  }

  return (
    <main className="max-w-xl mx-auto px-margin-mobile md:px-margin-desktop py-stack-lg">
      <h1 className="font-display-md text-display-md text-on-surface mb-2">Report an Issue</h1>
      <p className="font-body-md text-body-md text-on-surface-variant mb-stack-md">
        Let us know about a problem with your order, a product, or anything else.
      </p>

      <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-stack-md">
        {!user && (
          <div className="flex flex-col gap-3">
            <div>
              <input
                type="text"
                placeholder="Full name"
                value={name}
                onChange={(e) => setName(sanitize(e.target.value, MAX_LEN.name))}
                maxLength={MAX_LEN.name}
                className={inputClass(!!fieldErrors.name)}
              />
              <FieldError msg={fieldErrors.name} />
            </div>
            <div>
              <input
                type="tel"
                placeholder="Phone number (e.g. 03001234567)"
                value={phone}
                onChange={(e) => setPhone(sanitize(e.target.value, MAX_LEN.phone))}
                maxLength={MAX_LEN.phone}
                className={inputClass(!!fieldErrors.phone)}
              />
              <FieldError msg={fieldErrors.phone} />
            </div>
          </div>
        )}

        <div>
          <label className="font-headline-md text-headline-md text-on-surface mb-2 block">
            What's this about?
          </label>
          <select
            value={type}
            onChange={(e) => setType(e.target.value)}
            className={inputClass(false)}
          >
            <option value="return">Return / Refund</option>
            <option value="product_issue">Product Issue</option>
            <option value="delivery_issue">Delivery Issue</option>
            <option value="other">Other</option>
          </select>
        </div>

        <div>
          <label className="font-headline-md text-headline-md text-on-surface mb-2 block">
            Order number {type === "return" ? "" : "(optional)"}
          </label>
          <input
            type="text"
            placeholder="e.g. ORD-1784875796185"
            value={orderNumber}
            onChange={(e) => setOrderNumber(e.target.value.trim())}
            className={inputClass(false)}
          />
        </div>

        {type === "return" && orderItems.length > 0 && (
          <div>
            <label className="font-headline-md text-headline-md text-on-surface mb-2 block">
              Which item(s)?
            </label>
            <div className="flex flex-col gap-2">
              {orderItems.map((item) => (
                <label
                  key={item.id}
                  className="flex items-center gap-3 border border-outline-variant rounded-lg px-4 py-3 cursor-pointer"
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

        <div>
          <label className="font-headline-md text-headline-md text-on-surface mb-2 block">
            Describe your issue
          </label>
          <textarea
            placeholder="Tell us what happened..."
            value={message}
            onChange={(e) => setMessage(sanitize(e.target.value, MAX_LEN.message))}
            maxLength={MAX_LEN.message}
            rows={5}
            className={inputClass(!!fieldErrors.message)}
          />
          <FieldError msg={fieldErrors.message} />
        </div>

        <div>
          <label className="font-headline-md text-headline-md text-on-surface mb-2 block">
            Photo (optional)
          </label>
          <input
            type="file"
            accept="image/jpeg,image/png,image/webp"
            onChange={handlePhotoChange}
            className="font-body-sm text-body-sm text-on-surface-variant"
          />
          {photoPreview && (
            <img src={photoPreview} alt="Preview" className="mt-2 w-24 h-24 object-cover rounded-lg" />
          )}
        </div>

        <div>
          <button
            type="submit"
            disabled={submitting}
            className="w-full py-4 rounded-xl bg-primary-container text-on-primary font-button text-button hover:bg-primary transition-colors disabled:opacity-50"
          >
            {submitting ? "Submitting..." : "Submit Report"}
          </button>
          <FieldError msg={error ?? undefined} />
        </div>
      </form>
    </main>
  );
}