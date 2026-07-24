"use client";

import { useState } from "react";
import { useAuth } from "@/lib/auth-context";
import { supabase } from "@/lib/supabase";
import { useEffect } from "react";

const MAX_LEN = { name: 80, phone: 20, message: 1000 };

function sanitize(v: string, max: number) {
  return v.replace(/[<>]/g, "").slice(0, max);
}

function isValidPakPhone(phone: string) {
  const digits = phone.replace(/[\s-]/g, "");
  return /^(03\d{9}|\+923\d{9})$/.test(digits);
}

export default function ReportIssuePage() {
  const { user } = useAuth();
  const [customerId, setCustomerId] = useState<number | null>(null);

  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [orderNumber, setOrderNumber] = useState("");
  const [type, setType] = useState("other");
  const [message, setMessage] = useState("");
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

  function validate() {
    const errs: Record<string, string> = {};
    if (!user) {
      if (!name.trim()) errs.name = "Please enter your name.";
      if (!phone.trim()) errs.phone = "Please enter your phone number.";
      else if (!isValidPakPhone(phone)) errs.phone = "Enter a valid number, e.g. 03001234567.";
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
      let order_id: number | undefined;
      if (orderNumber.trim()) {
        const { data: order } = await supabase
          .from("orders")
          .select("id")
          .eq("order_number", orderNumber.trim())
          .single();
        if (order) order_id = order.id;
      }

      const res = await fetch("/api/complaints", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          customer_id: user ? customerId : undefined,
          order_id,
          reporter_name: user ? undefined : name.trim(),
          reporter_phone: user ? undefined : phone.trim(),
          type,
          message: message.trim(),
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
            Order number (optional)
          </label>
          <input
            type="text"
            placeholder="e.g. ORD-1784875796185"
            value={orderNumber}
            onChange={(e) => setOrderNumber(e.target.value.trim())}
            className={inputClass(false)}
          />
        </div>

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