"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/lib/auth-context";
import { isValidEmail, EMAIL_ERROR } from "@/lib/validate-email";

const BENEFITS = [
  { icon: "shopping_bag", title: "Faster checkout", body: "Save time by securely storing your details." },
  { icon: "local_shipping", title: "Track your orders", body: "Get real-time updates on your orders." },
  { icon: "favorite", title: "Wishlist & save", body: "Save your favorite styles in one place." },
  { icon: "sell", title: "Exclusive offers", body: "Be the first to know about new arrivals & special deals." },
];

// TEMPORARY DIAGNOSTIC — remove once the post-login navigation latency root
// cause is found. Timing only; never reads/logs email/password/session/token.
function loginNavSince(): number | null {
  if (typeof window === "undefined") return null;
  const start = window.sessionStorage.getItem("tinytots_login_nav_start");
  return start ? Date.now() - Number(start) : null;
}

export default function LoginPage() {
  const router = useRouter();
  const { user, loading } = useAuth();

  // Already signed in? Don't show the sign-in form — send them to their account.
  // OAuth returns through /auth/callback (not here), so this can't loop.
  useEffect(() => {
    if (!loading && user) {
      // TEMPORARY DIAGNOSTIC
      console.log("[login-nav-timing]", {
        stage: "auth-effect-replace-fired",
        sinceLoginNavStartMs: loginNavSince(),
      });
      router.replace("/account");
    }
  }, [user, loading, router]);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);
  const [googleLoading, setGoogleLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setServerError(null);

    if (typeof navigator !== "undefined" && !navigator.onLine) {
      setServerError("You're offline, please reconnect");
      return;
    }

    if (!email.trim() || !password) {
      setServerError("Please enter your email and password.");
      return;
    }
    if (!isValidEmail(email)) {
      setServerError(EMAIL_ERROR);
      return;
    }

    setSubmitting(true);
    // TEMPORARY DIAGNOSTIC — remove once the login-latency root cause is
    // found. Timings only; never logs email/password or any response data.
    const t0 = performance.now();
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim(), password }),
      });
      const t1 = performance.now();
      const data = await res.json().catch(() => ({}));
      const t2 = performance.now();

      if (!res.ok) {
        setServerError(
          typeof data.error === "string"
            ? data.error
            : "Incorrect email or password."
        );
        setSubmitting(false);
        return;
      }

      console.log("[login-client-timing]", {
        fetchMs: Math.round(t1 - t0),
        parseMs: Math.round(t2 - t1),
        beforeNavigationMs: Math.round(performance.now() - t0),
      });

      // TEMPORARY DIAGNOSTIC
      if (typeof window !== "undefined") {
        window.sessionStorage.setItem("tinytots_login_nav_start", String(Date.now()));
      }
      console.log("[login-nav-timing]", {
        stage: "hard-navigation-called",
        sinceLoginNavStartMs: 0,
      });

      // Full document navigation (not router.push): the server login route
      // sets the Supabase auth cookies, but the already-running browser
      // AuthProvider/Supabase client keeps its stale pre-login in-memory
      // session across an SPA transition. A hard navigation forces it to
      // initialize fresh and read the newly-set cookie session immediately.
      // replace() so a successful login doesn't leave /login in Back history.
      window.location.replace("/account");
    } catch {
      setServerError("Network error. Please try again.");
      setSubmitting(false);
    }
  }

  async function handleGoogleLogin() {
    setServerError(null);
    if (typeof navigator !== "undefined" && !navigator.onLine) {
      setServerError("You're offline, please reconnect");
      return;
    }
    setGoogleLoading(true);
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: `${window.location.origin}/auth/callback` },
    });
    if (error) {
      setServerError("Couldn't start Google sign-in. Please try again.");
      setGoogleLoading(false);
    }
  }

  const inputClass =
    "w-full border rounded-lg px-4 py-3 bg-surface-elevated text-text-primary font-body-md text-body-md border-border-default focus:border-brand-primary focus:outline-none transition-colors";

  return (
    <main className="max-w-container-max mx-auto w-full px-margin-mobile md:px-margin-desktop py-stack-lg">
      <div className="grid grid-cols-1 md:grid-cols-[1fr_320px] rounded-2xl border border-border-default overflow-hidden bg-surface-elevated">
        <div className="p-8 md:p-12 min-w-0">
          <h1 className="font-display-md text-display-md text-text-primary mb-2">Welcome back!</h1>
          <p className="font-body-md text-body-md text-text-secondary mb-stack-md">Sign in to continue to your account.</p>

          <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-4 max-w-sm">
            <div>
              <label className="font-label-md text-label-md text-text-secondary mb-1.5 block">Email Address</label>
              <input
                type="email"
                placeholder="Enter your email address"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className={inputClass}
              />
            </div>
            <div>
              <label className="font-label-md text-label-md text-text-secondary mb-1.5 block">Password</label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className={`${inputClass} pr-11`}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((s) => !s)}
                  aria-label={showPassword ? "Hide password" : "Show password"}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-text-secondary hover:text-brand-primary"
                >
                  <span className="material-symbols-outlined text-[20px]">
                    {showPassword ? "visibility_off" : "visibility"}
                  </span>
                </button>
              </div>
            </div>

            <div className="flex items-center justify-end -mt-1">
              <Link href="/forgot-password" className="font-label-md text-label-md text-brand-primary hover:underline">
                Forgot password?
              </Link>
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="w-full py-4 rounded-xl bg-brand-primary text-white font-button text-button hover:opacity-90 transition-opacity disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {submitting ? "Signing in..." : "Sign In"}
              {!submitting && <span className="material-symbols-outlined text-[18px]">arrow_forward</span>}
            </button>

            {serverError && <p className="font-label-md text-label-md text-red-700 -mt-1">{serverError}</p>}

            <div className="flex items-center gap-3 my-1">
              <div className="flex-1 h-px bg-border-default" />
              <span className="font-label-md text-label-md text-text-secondary uppercase tracking-wider">or continue with</span>
              <div className="flex-1 h-px bg-border-default" />
            </div>

            <button
              type="button"
              onClick={handleGoogleLogin}
              disabled={googleLoading}
              className="w-full py-3 rounded-xl border border-border-default flex items-center justify-center gap-3 font-button text-button text-text-primary hover:bg-surface-secondary transition-colors disabled:opacity-50"
            >
              <svg width="18" height="18" viewBox="0 0 18 18">
                <path fill="#4285F4" d="M17.64 9.2c0-.64-.06-1.25-.16-1.84H9v3.48h4.84a4.14 4.14 0 0 1-1.8 2.72v2.26h2.92c1.7-1.57 2.68-3.88 2.68-6.62z"/>
                <path fill="#34A853" d="M9 18c2.43 0 4.47-.8 5.96-2.18l-2.92-2.26c-.81.54-1.84.86-3.04.86-2.34 0-4.32-1.58-5.03-3.7H.96v2.33A9 9 0 0 0 9 18z"/>
                <path fill="#FBBC05" d="M3.97 10.72A5.4 5.4 0 0 1 3.68 9c0-.6.1-1.18.29-1.72V4.95H.96A9 9 0 0 0 0 9c0 1.45.35 2.83.96 4.05l3.01-2.33z"/>
                <path fill="#EA4335" d="M9 3.58c1.32 0 2.5.45 3.44 1.35l2.58-2.58C13.46.89 11.43 0 9 0A9 9 0 0 0 .96 4.95l3.01 2.33C4.68 5.16 6.66 3.58 9 3.58z"/>
              </svg>
              Continue with Google
            </button>

            <p className="font-body-sm text-body-sm text-text-secondary text-center mt-1">
              Don&apos;t have an account?{" "}
              <Link href="/signup" className="text-brand-primary hover:underline font-medium">Sign up</Link>
            </p>
          </form>
        </div>

        <div className="hidden md:flex flex-col justify-center gap-6 bg-brand-primary/[0.05] border-t md:border-t-0 md:border-l border-border-default p-8 min-w-0">
          <div>
            <span className="font-label-md text-label-md uppercase tracking-wider text-brand-primary block mb-2">
              Why sign in?
            </span>
            <div className="w-10 h-px bg-border-default" />
          </div>
          {BENEFITS.map((b) => (
            <div key={b.title} className="flex items-start gap-3">
              <span className="w-10 h-10 rounded-full bg-surface-elevated border border-border-subtle flex items-center justify-center text-brand-primary shrink-0">
                <span className="material-symbols-outlined text-[20px]">{b.icon}</span>
              </span>
              <div className="min-w-0">
                <p className="font-body-md text-body-md text-text-primary font-semibold">{b.title}</p>
                <p className="font-body-sm text-body-sm text-text-secondary">{b.body}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </main>
  );
}
