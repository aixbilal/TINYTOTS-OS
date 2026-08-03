"use client";

import { useState } from "react";
import { useAuth } from "@/lib/auth-context";
import { supabase } from "@/lib/supabase";
import { isValidPakPhone, PAK_PHONE_ERROR } from "@/lib/validate-phone";

const MAX_LEN = { name: 80, phone: 20, message: 1000 };

function sanitize(v: string, max: number) {
  return v.replace(/[<>]/g, "").slice(0, max);
}

export default function ContactPage() {
  const { user } = useAuth();
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [message, setMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  function validate() {
    const errs: Record<string, string> = {};
    if (!user) {
      if (!name.trim()) errs.name = "Please enter your name.";
      if (!phone.trim()) errs.phone = "Please enter your phone number.";
      else if (!isValidPakPhone(phone)) errs.phone = PAK_PHONE_ERROR;
    }
    if (!message.trim()) errs.message = "Please enter a message.";
    setFieldErrors(errs);
    return Object.keys(errs).length === 0;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!validate()) return;

    setSubmitting(true);
    try {
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
          reporter_name: user ? undefined : name.trim(),
          reporter_phone: user ? undefined : phone.trim(),
          type: "other",
          message: `[Contact Form] ${message.trim()}`,
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
        <span className="material-symbols-outlined text-primary text-[48px] mb-4 inline-block">mark_email_read</span>
        <h1 className="font-display-md text-display-md text-on-surface mb-4">Message sent</h1>
        <p className="font-body-md text-body-md text-on-surface-variant">
          Thanks for reaching out — our team will get back to you soon.
        </p>
      </main>
    );
  }

  return (
    <main className="max-w-container-max mx-auto w-full px-margin-mobile md:px-margin-desktop py-stack-lg grid grid-cols-1 md:grid-cols-2 gap-gutter">
      <div>
        <h1 className="font-display-md text-display-md text-on-surface mb-2">Contact Us</h1>
        <p className="font-body-md text-body-md text-on-surface-variant mb-stack-md">
          Questions about an order, a product, or anything else — we're happy to help.
        </p>

        <div className="flex flex-col gap-4">
          <div className="flex items-start gap-3">
            <span className="material-symbols-outlined text-primary bg-primary-container/20 p-2 rounded-full">call</span>
            <div>
              <p className="font-body-md text-body-md text-on-surface font-medium">Call or WhatsApp</p>
              <p className="font-body-sm text-body-sm text-on-surface-variant">Mon–Sat, 10am–7pm</p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <span className="material-symbols-outlined text-primary bg-primary-container/20 p-2 rounded-full">mail</span>
            <div>
              <p className="font-body-md text-body-md text-on-surface font-medium">Email</p>
              <p className="font-body-sm text-body-sm text-on-surface-variant">We reply within 24 hours</p>
            </div>
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-4 bg-surface-container-lowest border border-outline-variant/20 rounded-2xl p-6">
        {!user && (
          <>
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
          </>
        )}
        <div>
          <textarea
            placeholder="How can we help?"
            value={message}
            onChange={(e) => setMessage(sanitize(e.target.value, MAX_LEN.message))}
            maxLength={MAX_LEN.message}
            rows={6}
            className={inputClass(!!fieldErrors.message)}
          />
          <FieldError msg={fieldErrors.message} />
        </div>
        <button
          type="submit"
          disabled={submitting}
          className="w-full py-4 rounded-xl bg-primary-container text-on-primary font-button text-button hover:bg-primary transition-colors disabled:opacity-50"
        >
          {submitting ? "Sending..." : "Send Message"}
        </button>
        {error && <FieldError msg={error} />}
      </form>
    </main>
  );
}