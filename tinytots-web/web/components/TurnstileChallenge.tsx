"use client";

import { useEffect, useRef, useState } from "react";

// Minimal surface of Cloudflare's official Turnstile client script (loaded
// directly — see loadTurnstileScript below — no npm dependency needed).
declare global {
  interface Window {
    turnstile?: {
      render: (
        container: HTMLElement,
        options: {
          sitekey: string;
          callback?: (token: string) => void;
          "expired-callback"?: () => void;
          "error-callback"?: () => void;
          theme?: "light" | "dark" | "auto";
          size?: "normal" | "flexible" | "compact";
        }
      ) => string;
      reset: (widgetId?: string) => void;
      remove: (widgetId?: string) => void;
    };
  }
}

const SCRIPT_SRC = "https://challenges.cloudflare.com/turnstile/v0/api.js";
let scriptLoadPromise: Promise<void> | null = null;

function loadTurnstileScript(): Promise<void> {
  if (typeof window === "undefined") return Promise.resolve();
  if (window.turnstile) return Promise.resolve();
  if (scriptLoadPromise) return scriptLoadPromise;

  scriptLoadPromise = new Promise((resolve, reject) => {
    const existing = document.querySelector<HTMLScriptElement>(`script[src="${SCRIPT_SRC}"]`);
    if (existing) {
      existing.addEventListener("load", () => resolve());
      existing.addEventListener("error", () => reject(new Error("Turnstile script failed to load")));
      return;
    }
    const script = document.createElement("script");
    script.src = SCRIPT_SRC;
    script.async = true;
    script.defer = true;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error("Turnstile script failed to load"));
    document.head.appendChild(script);
  });
  return scriptLoadPromise;
}

/**
 * Cloudflare Turnstile (Managed mode), rendered directly from Cloudflare's
 * own script — no third-party React wrapper dependency. The token is only
 * ever held in this component's parent's transient state (never storage,
 * never a cookie, never the URL) and is single-use: give the parent a way to
 * force a fresh challenge by changing this component's `key` prop after each
 * submit attempt, rather than calling an imperative reset method.
 */
export default function TurnstileChallenge({
  siteKey,
  onToken,
  onExpired,
  onError,
}: {
  siteKey: string;
  onToken: (token: string) => void;
  onExpired?: () => void;
  onError?: () => void;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const widgetIdRef = useRef<string | null>(null);
  const [loadFailed, setLoadFailed] = useState(false);

  useEffect(() => {
    let cancelled = false;

    loadTurnstileScript()
      .then(() => {
        if (cancelled || !containerRef.current || !window.turnstile) return;
        widgetIdRef.current = window.turnstile.render(containerRef.current, {
          sitekey: siteKey,
          callback: (token) => onToken(token),
          "expired-callback": () => onExpired?.(),
          "error-callback": () => onError?.(),
          theme: "light",
          size: "flexible",
        });
      })
      .catch(() => {
        if (!cancelled) setLoadFailed(true);
      });

    return () => {
      cancelled = true;
      if (widgetIdRef.current && window.turnstile) {
        window.turnstile.remove(widgetIdRef.current);
      }
    };
    // Intentionally mount once per `key` — parents force a fresh widget
    // (and a fresh single-use token) by changing the `key` they pass in.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (loadFailed) {
    return (
      <p className="font-label-md text-label-md text-red-700">
        Security check failed to load. Please refresh the page and try again.
      </p>
    );
  }

  return <div ref={containerRef} className="min-h-[65px] w-full flex items-center justify-center" />;
}
