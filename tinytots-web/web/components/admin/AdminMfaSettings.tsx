"use client";

import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { useAdminAuth } from "@/lib/admin-auth-context";

type TotpFactor = {
  id: string;
  friendly_name?: string | null;
  status: string;
  factor_type: string;
};

type EnrollState = {
  factorId: string;
  qrCode: string;
  secret: string;
} | null;

export default function AdminMfaSettings() {
  const { session } = useAdminAuth();
  const [factors, setFactors] = useState<TotpFactor[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [enroll, setEnroll] = useState<EnrollState>(null);
  const [verifyCode, setVerifyCode] = useState("");
  const [verifying, setVerifying] = useState(false);
  const [disablePassword, setDisablePassword] = useState("");
  const [disabling, setDisabling] = useState(false);
  const [info, setInfo] = useState("");

  const refresh = useCallback(async () => {
    setLoading(true);
    setError("");
    const { data, error: listError } = await supabase.auth.mfa.listFactors();
    if (listError) {
      setError(listError.message);
      setFactors([]);
    } else {
      setFactors((data?.totp || []) as TotpFactor[]);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const verified = factors.filter((f) => f.status === "verified");
  const enabled = verified.length > 0;

  async function startEnroll() {
    setError("");
    setInfo("");
    setVerifyCode("");
    const { data, error: enrollError } = await supabase.auth.mfa.enroll({
      factorType: "totp",
      friendlyName: "Authenticator app",
    });
    if (enrollError || !data) {
      setError(enrollError?.message || "Could not start 2FA enrollment.");
      return;
    }
    setEnroll({
      factorId: data.id,
      qrCode: data.totp.qr_code,
      secret: data.totp.secret,
    });
  }

  async function confirmEnroll(e: React.FormEvent) {
    e.preventDefault();
    if (!enroll) return;
    setVerifying(true);
    setError("");
    setInfo("");

    const { data: challenge, error: challengeError } = await supabase.auth.mfa.challenge({
      factorId: enroll.factorId,
    });
    if (challengeError || !challenge) {
      setError(challengeError?.message || "Could not create verification challenge.");
      setVerifying(false);
      return;
    }

    const { error: verifyError } = await supabase.auth.mfa.verify({
      factorId: enroll.factorId,
      challengeId: challenge.id,
      code: verifyCode.trim(),
    });

    if (verifyError) {
      setError(verifyError.message || "Invalid code. Try again with a fresh code from your app.");
      setVerifying(false);
      return;
    }

    setEnroll(null);
    setVerifyCode("");
    setInfo("Two-factor authentication is now enabled for your admin account.");
    setVerifying(false);
    await refresh();
  }

  async function cancelEnroll() {
    if (enroll?.factorId) {
      // Clean up the unverified factor so it doesn't linger.
      await supabase.auth.mfa.unenroll({ factorId: enroll.factorId }).catch(() => {});
    }
    setEnroll(null);
    setVerifyCode("");
    setError("");
    await refresh();
  }

  async function disableFactor(factorId: string) {
    setError("");
    setInfo("");
    if (!disablePassword) {
      setError("Enter your current password to disable 2FA.");
      return;
    }
    const token = session?.access_token;
    if (!token) {
      setError("Your session expired. Please log in again.");
      return;
    }
    setDisabling(true);
    try {
      const res = await fetch("/api/admin/account/mfa-disable", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ currentPassword: disablePassword, factorId }),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(json.error || "Failed to disable 2FA.");
      } else {
        setDisablePassword("");
        setInfo("Two-factor authentication has been disabled.");
        await refresh();
      }
    } catch {
      setError("Network error. Please try again.");
    }
    setDisabling(false);
  }

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6 shadow-sm">
      <h2 className="text-sm font-semibold text-gray-900 mb-1">Two-factor authentication (2FA)</h2>
      <p className="text-xs text-gray-500 mb-4">
        Optional extra security for admin login using an authenticator app (Google Authenticator,
        Authy, 1Password, etc.).
      </p>

      {loading ? (
        <p className="text-xs text-gray-400">Checking 2FA status...</p>
      ) : (
        <p className="text-sm mb-4">
          Status:{" "}
          <span className={enabled ? "text-green-700 font-medium" : "text-gray-600 font-medium"}>
            {enabled ? "Enabled" : "Disabled"}
          </span>
        </p>
      )}

      {error && <p className="text-xs text-red-600 mb-3">{error}</p>}
      {info && <p className="text-xs text-green-700 mb-3">{info}</p>}

      {!enroll && !enabled && (
        <button
          type="button"
          onClick={startEnroll}
          className="bg-indigo-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-indigo-700"
        >
          Set up 2FA
        </button>
      )}

      {enroll && (
        <div className="flex flex-col gap-3 border border-indigo-100 bg-indigo-50/40 rounded-md p-4">
          <p className="text-sm text-gray-800">
            Scan this QR code with your authenticator app, then enter the 6-digit code to confirm.
          </p>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={enroll.qrCode}
            alt="2FA QR code"
            className="w-48 h-48 bg-white border border-gray-200 rounded-md self-start"
          />
          <div>
            <p className="text-xs text-gray-500 mb-1">
              Can&apos;t scan? Enter this secret manually and store it somewhere safe (Supabase does
              not provide backup codes):
            </p>
            <code className="block text-xs bg-white border border-gray-200 rounded px-2 py-1.5 break-all select-all">
              {enroll.secret}
            </code>
          </div>
          <div className="rounded-md bg-amber-50 border border-amber-200 px-3 py-2 text-xs text-amber-900">
            <strong>Recovery:</strong> Supabase does not issue backup codes. Save this secret (or
            enroll a second authenticator on another device) before you finish. If you lose every
            authenticator, another admin/developer can disable 2FA for your account using the
            service role — 2FA is never mandatory, so the main admin account cannot be permanently
            locked by this feature alone.
          </div>
          <form onSubmit={confirmEnroll} className="flex flex-col gap-2">
            <input
              type="text"
              inputMode="numeric"
              autoComplete="one-time-code"
              placeholder="6-digit code"
              value={verifyCode}
              onChange={(e) => setVerifyCode(e.target.value)}
              className="border rounded-md px-3 py-2 text-sm w-40"
            />
            <div className="flex gap-2">
              <button
                type="submit"
                disabled={verifying || verifyCode.trim().length < 6}
                className="bg-indigo-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-indigo-700 disabled:opacity-50"
              >
                {verifying ? "Verifying..." : "Confirm & enable"}
              </button>
              <button
                type="button"
                onClick={cancelEnroll}
                className="border border-gray-300 text-gray-700 px-4 py-2 rounded-md text-sm"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {enabled && (
        <div className="flex flex-col gap-3">
          <ul className="text-sm text-gray-700 list-disc pl-5">
            {verified.map((f) => (
              <li key={f.id}>{f.friendly_name || "Authenticator app"}</li>
            ))}
          </ul>
          <p className="text-xs text-gray-500">
            Tip: enroll a second authenticator on another device as a backup — Supabase does not
            provide printable backup codes.
          </p>
          <input
            type="password"
            placeholder="Current password (required to disable)"
            value={disablePassword}
            onChange={(e) => setDisablePassword(e.target.value)}
            autoComplete="current-password"
            className="border rounded-md px-3 py-2 text-sm w-full max-w-sm"
          />
          {verified.map((f) => (
            <button
              key={f.id}
              type="button"
              disabled={disabling}
              onClick={() => disableFactor(f.id)}
              className="bg-white border border-red-300 text-red-700 px-4 py-2 rounded-md text-sm font-medium hover:bg-red-50 disabled:opacity-50 self-start"
            >
              {disabling ? "Disabling..." : "Disable 2FA"}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
