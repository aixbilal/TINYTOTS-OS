"use client";

import { useState } from "react";
import { isValidEmail, EMAIL_ERROR } from "@/lib/validate-email";

export default function BlogSubscribeForm({ dark = true }: { dark?: boolean }) {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [errorMsg, setErrorMsg] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!isValidEmail(email)) {
      setErrorMsg(EMAIL_ERROR);
      setStatus("error");
      return;
    }
    setStatus("loading");
    setErrorMsg("");
    try {
      const res = await fetch("/api/newsletter", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const json = await res.json();
      if (!res.ok) {
        setErrorMsg(json.error || "Something went wrong. Please try again.");
        setStatus("error");
        return;
      }
      setStatus("success");
      setEmail("");
    } catch {
      setErrorMsg("Network error. Please try again.");
      setStatus("error");
    }
  }

  if (status === "success") {
    return (
      <p className={`font-body-sm text-body-sm max-w-sm ${dark ? "text-white" : "text-text-primary"}`}>
        Thanks for subscribing!
      </p>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-2 max-w-sm">
      <div className="flex items-center gap-2">
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          placeholder="Enter your email"
          className={`flex-1 px-4 py-3 rounded-lg border font-body-sm text-body-sm text-text-primary focus:outline-none ${
            dark ? "border-none" : "border-border-default bg-white"
          }`}
        />
        <button
          type="submit"
          disabled={status === "loading"}
          className="bg-brand-primary text-white font-button text-button px-5 py-3 rounded-lg hover:opacity-90 transition-opacity shrink-0 disabled:opacity-50"
        >
          {status === "loading" ? "..." : "Subscribe"}
        </button>
      </div>
      {status === "error" && (
        <p className={`font-label-md text-label-md ${dark ? "text-red-200" : "text-red-700"}`}>{errorMsg}</p>
      )}
    </form>
  );
}
