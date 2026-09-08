"use client";

import { useEffect, useState } from "react";
import { adminFetch } from "@/lib/admin-fetch";
import { AdminCard, AdminButton, AdminAlert } from "@/components/admin/ui";

/**
 * Per-device Web Push opt-in for the signed-in admin.
 *
 * The one V1.1 event is a new web order. Permission is only ever requested
 * on an explicit button click (never on page load). Subscribing/unsubscribing
 * is safe to repeat — the server row is keyed by endpoint.
 */

type Status =
  | "checking"
  | "unsupported"
  | "unconfigured"
  | "denied"
  | "enabled"
  | "disabled";

function urlBase64ToArrayBuffer(base64String: string): ArrayBuffer {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const raw = atob(base64);
  const buffer = new ArrayBuffer(raw.length);
  const view = new Uint8Array(buffer);
  for (let i = 0; i < raw.length; i += 1) view[i] = raw.charCodeAt(i);
  return buffer;
}

function pushSupported(): boolean {
  return (
    typeof window !== "undefined" &&
    "serviceWorker" in navigator &&
    "PushManager" in window &&
    "Notification" in window
  );
}

export default function AdminPushSettings() {
  // Seed the unsupported state via the initializer so the mount effect never
  // has to setState synchronously.
  const [status, setStatus] = useState<Status>(() =>
    pushSupported() ? "checking" : "unsupported"
  );
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string>("");
  const [vapidKey, setVapidKey] = useState<string | null>(null);

  // One-shot probe on mount: resolve VAPID config + current subscription.
  // Every setState here runs only after an await, so it never triggers the
  // synchronous cascading-render pattern.
  useEffect(() => {
    if (!pushSupported()) return;
    let cancelled = false;

    (async () => {
      try {
        const keyRes = await fetch("/api/push/public-key");
        if (cancelled) return;
        if (keyRes.status === 503) {
          setStatus("unconfigured");
          return;
        }
        if (!keyRes.ok) throw new Error("Could not reach the push service.");
        const { publicKey } = await keyRes.json();
        if (cancelled) return;
        setVapidKey(publicKey);

        if (Notification.permission === "denied") {
          setStatus("denied");
          return;
        }

        const reg = await navigator.serviceWorker.ready;
        const sub = await reg.pushManager.getSubscription();
        if (cancelled) return;
        setStatus(sub ? "enabled" : "disabled");
      } catch (err) {
        if (cancelled) return;
        setError(err instanceof Error ? err.message : "Something went wrong.");
        setStatus("disabled");
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  async function enable() {
    if (!vapidKey || busy) return;
    setError("");
    setBusy(true);
    try {
      const permission = await Notification.requestPermission();
      if (permission !== "granted") {
        setStatus(permission === "denied" ? "denied" : "disabled");
        return;
      }

      const reg = await navigator.serviceWorker.ready;
      let sub = await reg.pushManager.getSubscription();
      if (!sub) {
        sub = await reg.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: urlBase64ToArrayBuffer(vapidKey),
        });
      }

      const json = sub.toJSON();
      const res = await adminFetch("/api/push/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          subscription: {
            endpoint: sub.endpoint,
            keys: { p256dh: json.keys?.p256dh, auth: json.keys?.auth },
          },
        }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "Could not save the subscription.");
      }
      setStatus("enabled");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not enable notifications.");
      setStatus("disabled");
    } finally {
      setBusy(false);
    }
  }

  async function disable() {
    if (busy) return;
    setError("");
    setBusy(true);
    try {
      const reg = await navigator.serviceWorker.ready;
      const sub = await reg.pushManager.getSubscription();
      if (sub) {
        await adminFetch("/api/push/unsubscribe", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ endpoint: sub.endpoint }),
        }).catch(() => {});
        await sub.unsubscribe().catch(() => {});
      }
      setStatus("disabled");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not disable notifications.");
      setStatus("enabled");
    } finally {
      setBusy(false);
    }
  }

  return (
    <AdminCard title="Order notifications">
      <p className="font-body-sm text-body-sm text-text-secondary mb-4">
        Get a push notification on this device when a new website order comes
        in. You control this per device.
      </p>

      {status === "checking" && (
        <p className="font-body-sm text-body-sm text-text-secondary">Checking…</p>
      )}

      {status === "unsupported" && (
        <AdminAlert tone="info">
          This browser doesn&apos;t support web push notifications. Try a recent
          Chrome, Edge, or Firefox (or install the app to your home screen on
          Android).
        </AdminAlert>
      )}

      {status === "unconfigured" && (
        <AdminAlert tone="info">
          Push notifications aren&apos;t configured on this deployment yet
          (missing VAPID keys). Add the server keys to enable this.
        </AdminAlert>
      )}

      {status === "denied" && (
        <AdminAlert tone="warning">
          Notifications are blocked for this site in your browser settings.
          Allow them there, then reload this page.
        </AdminAlert>
      )}

      {(status === "enabled" || status === "disabled") && (
        <div className="flex items-center gap-3">
          <span className="font-body-sm text-body-sm text-text-primary">
            {status === "enabled"
              ? "Enabled on this device."
              : "Not enabled on this device."}
          </span>
          {status === "enabled" ? (
            <AdminButton variant="secondary" onClick={disable} disabled={busy}>
              {busy ? "Working…" : "Turn off"}
            </AdminButton>
          ) : (
            <AdminButton
              variant="primary"
              onClick={enable}
              disabled={busy || !vapidKey}
            >
              {busy ? "Working…" : "Enable notifications"}
            </AdminButton>
          )}
        </div>
      )}

      {error && (
        <div className="mt-3">
          <AdminAlert tone="danger">{error}</AdminAlert>
        </div>
      )}
    </AdminCard>
  );
}
