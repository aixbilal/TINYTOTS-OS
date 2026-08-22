"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { useAuth } from "@/lib/auth-context";
import { supabase } from "@/lib/supabase";
import { isValidPakPhone, PAK_PHONE_ERROR } from "@/lib/validate-phone";
import InternalTrustStrip from "@/components/InternalTrustStrip";
import type { StoreContact } from "@/lib/get-store-contact";

const MAX_LEN = { name: 80, phone: 20, message: 1000 };

// Neutral, defensible brand-tone copy only — no specific SLA/timing claims
// that aren't a confirmed policy (matches InternalTrustStrip's convention).
const PROMISES = [
  { icon: "favorite", title: "Friendly Support", body: "We're here to help with a smile." },
  { icon: "bolt", title: "Prompt Response", body: "We aim to get back to you as quickly as we can." },
  { icon: "handshake", title: "Hassle-Free Solutions", body: "We'll work with you to sort things out simply." },
  { icon: "verified_user", title: "Customer First", body: "Your experience with TinyTots matters to us." },
];

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
  const [contact, setContact] = useState<StoreContact | null>(null);

  useEffect(() => {
    fetch("/api/store-contact")
      .then((res) => res.json())
      .then((json) => setContact(json.data))
      .catch(() => setContact(null));
  }, []);

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
    `w-full border rounded-lg px-4 py-3 bg-surface-elevated text-text-primary font-body-md text-body-md focus:outline-none transition-colors ${
      hasError ? "border-red-700 focus:border-red-700" : "border-border-default focus:border-brand-primary"
    }`;

  const FieldError = ({ msg }: { msg?: string }) =>
    msg ? <p className="font-label-md text-label-md text-red-700 mt-1">{msg}</p> : null;

  const waLink = contact?.whatsapp
    ? `https://wa.me/${contact.whatsapp.replace(/[^0-9]/g, "")}`
    : null;

  if (submitted) {
    return (
      <>
        <main className="max-w-xl mx-auto px-margin-mobile md:px-margin-desktop py-stack-lg text-center">
          <span className="material-symbols-outlined text-brand-primary text-[48px] mb-4 inline-block">mark_email_read</span>
          <h1 className="font-display-md text-display-md text-text-primary mb-4">Message sent</h1>
          <p className="font-body-md text-body-md text-text-secondary">
            Thanks for reaching out — our team will get back to you soon.
          </p>
        </main>
        <InternalTrustStrip />
      </>
    );
  }

  const reachCards = [
    contact?.whatsapp && {
      icon: "chat",
      label: "WhatsApp",
      body: "Chat with us on WhatsApp for quick support.",
      value: contact.whatsapp,
      href: waLink!,
    },
    {
      icon: "mail",
      label: "Email",
      body: "Drop us an email and we'll get back to you.",
      value: contact?.email ?? "support@tinytotsofficial.com",
      href: `mailto:${contact?.email ?? "support@tinytotsofficial.com"}`,
    },
    contact?.phone && {
      icon: "call",
      label: "Phone",
      body: "Speak with our care team during working hours.",
      value: contact.phone,
      href: `tel:${contact.phone}`,
    },
    {
      icon: "location_on",
      label: "Our Location",
      body: contact?.location ?? "Toba Tek Singh, Punjab, Pakistan",
      value: null,
      href: null,
    },
  ].filter(Boolean) as { icon: string; label: string; body: string; value: string | null; href: string | null }[];

  // Only established, already-published facts — no invented numbers. Delivery
  // timelines and return-window specifics live on /shipping-returns (admin-
  // editable there), so we link out rather than restate figures that could drift.
  const faqs = [
    contact?.hours && { q: "What are your working hours?", a: contact.hours },
    {
      q: "How long does delivery take?",
      a: "Delivery timelines vary by region — see our Shipping & Returns page for full details.",
    },
    {
      q: "How can I track my order?",
      a: "Enter your order number and the phone number used at checkout on our Track Order page.",
    },
    {
      q: "What is your return policy?",
      a: "We offer a 7-day return policy — see our Shipping & Returns page for eligibility and steps.",
    },
  ].filter(Boolean) as { q: string; a: string }[];

  return (
    <>
    <main className="max-w-container-max mx-auto w-full px-margin-mobile md:px-margin-desktop py-stack-lg">
      <nav className="font-body-sm text-body-sm text-text-secondary mb-stack-sm flex items-center gap-2">
        <Link href="/" className="hover:text-brand-primary transition-colors">Home</Link>
        <span className="material-symbols-outlined text-[16px]">chevron_right</span>
        <Link href="/help" className="hover:text-brand-primary transition-colors">Help Center</Link>
        <span className="material-symbols-outlined text-[16px]">chevron_right</span>
        <span className="text-text-primary">Contact &amp; Customer Care</span>
      </nav>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-gutter items-center mb-stack-lg">
        <div>
          <span className="font-label-md text-label-md uppercase tracking-wider text-text-secondary mb-2 block">
            We&apos;re Here to Help
          </span>
          <h1 className="font-display-xl text-display-md text-text-primary tracking-tight mb-3">
            Your happiness means everything to us.
          </h1>
          <p className="font-body-md text-body-md text-text-secondary">
            Our customer care team is always here to assist you. Reach out anytime — we&apos;re happy to help.
          </p>
        </div>
        <div className="relative w-full aspect-[4/3] rounded-2xl overflow-hidden">
          <Image
            src="/images/homepage/brand-story-support.webp"
            alt=""
            fill
            sizes="(min-width: 768px) 480px, 100vw"
            className="object-cover"
          />
        </div>
      </div>

      <section className="mb-stack-lg">
        <h2 className="font-headline-lg text-text-primary mb-stack-sm text-center">Ways to Reach Us</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-bento-gap">
          {reachCards.map((c) => (
            <div
              key={c.label}
              className="border border-border-default rounded-2xl p-6 bg-surface-elevated flex flex-col items-center text-center gap-2"
            >
              <span className="flex items-center justify-center w-12 h-12 rounded-full bg-brand-primary/10 text-brand-primary">
                <span className="material-symbols-outlined text-[24px]">{c.icon}</span>
              </span>
              <p className="font-label-md text-label-md uppercase tracking-wider text-text-primary font-semibold">{c.label}</p>
              <p className="font-body-sm text-body-sm text-text-secondary">{c.body}</p>
              {c.value && c.href && (
                <a href={c.href} className="mt-1 font-body-sm text-body-sm text-brand-primary hover:underline break-all">
                  {c.value}
                </a>
              )}
            </div>
          ))}
        </div>
      </section>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-gutter items-start mb-stack-lg">
        <form
          onSubmit={handleSubmit}
          noValidate
          className="lg:col-span-2 flex flex-col gap-4 bg-surface-elevated border border-border-default rounded-2xl p-6"
        >
          <div>
            <p className="font-label-md text-label-md uppercase tracking-wider text-text-secondary mb-1">Send Us a Message</p>
            <h2 className="font-headline-lg text-text-primary mb-1">We&apos;d love to hear from you.</h2>
            <p className="font-body-sm text-body-sm text-text-secondary">
              Fill out the form and our team will get back to you shortly.
            </p>
          </div>
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
            className="w-full py-4 rounded-xl bg-brand-primary text-white font-button text-button hover:opacity-90 transition-opacity disabled:opacity-50"
          >
            {submitting ? "Sending..." : "Send Message"}
          </button>
          {error && <FieldError msg={error} />}
        </form>

        <div className="border border-border-default rounded-2xl p-6 bg-surface-elevated flex flex-col gap-4">
          <p className="font-label-md text-label-md uppercase tracking-wider text-text-secondary">Our Promise to You</p>
          {PROMISES.map((p) => (
            <div key={p.title} className="flex items-start gap-3">
              <span className="flex items-center justify-center w-9 h-9 rounded-full bg-brand-primary/10 text-brand-primary shrink-0">
                <span className="material-symbols-outlined text-[18px]">{p.icon}</span>
              </span>
              <div>
                <p className="font-body-md text-body-md text-text-primary font-semibold">{p.title}</p>
                <p className="font-body-sm text-body-sm text-text-secondary">{p.body}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-gutter items-start">
        <div className="lg:col-span-2 border border-border-default rounded-2xl p-6 bg-surface-elevated">
          <div className="flex items-center justify-between mb-2">
            <p className="font-headline-md text-headline-md text-text-primary">Frequently Asked Questions</p>
            <Link href="/help" className="font-body-sm text-body-sm text-brand-primary hover:underline whitespace-nowrap">
              View all articles →
            </Link>
          </div>
          <div className="flex flex-col divide-y divide-border-subtle">
            {faqs.map((f) => (
              <div key={f.q} className="py-3">
                <p className="font-body-md text-body-md text-text-primary font-medium">{f.q}</p>
                <p className="font-body-sm text-body-sm text-text-secondary mt-1">{f.a}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="border border-border-default rounded-2xl p-6 bg-surface-elevated flex flex-col gap-3">
          <p className="font-headline-md text-headline-md text-text-primary">Need Help Faster?</p>
          <Link
            href="/help"
            className="flex items-center justify-between px-4 py-3 rounded-xl border border-border-default hover:border-brand-primary transition-colors font-body-sm text-body-sm text-text-primary"
          >
            Visit Help Center
            <span className="material-symbols-outlined text-[18px] text-brand-primary">arrow_forward</span>
          </Link>
          <Link
            href="/report-issue"
            className="flex items-center justify-between px-4 py-3 rounded-xl border border-border-default hover:border-brand-primary transition-colors font-body-sm text-body-sm text-text-primary"
          >
            Report an Issue
            <span className="material-symbols-outlined text-[18px] text-brand-primary">arrow_forward</span>
          </Link>
          {waLink && (
            <a
              href={waLink}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-brand-primary text-white font-button text-button hover:opacity-90 transition-opacity"
            >
              <span className="material-symbols-outlined text-[18px]">chat</span>
              Contact Us on WhatsApp
            </a>
          )}
        </div>
      </div>
    </main>
    <InternalTrustStrip />
    </>
  );
}