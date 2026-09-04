import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { clientIp, rateLimit, rateLimitResponse } from "@/lib/rate-limit";
import { isValidEmail, EMAIL_ERROR } from "@/lib/validate-email";

const AUTH_WINDOW_MS = 15 * 60 * 1000;
const AUTH_LIMIT = 5;

// TEMPORARY DIAGNOSTIC — remove once the login-latency root cause is found.
// performance.now() with a Date.now() fallback; never logs email/password/
// IP/cookies/headers/tokens/session/raw errors — durations only.
const now = () => (typeof performance !== "undefined" ? performance.now() : Date.now());

export async function POST(request: NextRequest) {
  const t0 = now();

  const rlStart = now();
  const limited = await rateLimit(`auth-login:${clientIp(request)}`, {
    limit: AUTH_LIMIT,
    windowMs: AUTH_WINDOW_MS,
  });
  const rateLimitMs = now() - rlStart;

  if (!limited.ok) {
    const totalMs = now() - t0;
    console.log("[auth-login-timing]", {
      rateLimitMs: Math.round(rateLimitMs),
      supabaseSignInMs: 0,
      totalMs: Math.round(totalMs),
      result: "rejected",
    });
    const resp = rateLimitResponse(limited.retryAfterSec);
    resp.headers.set(
      "Server-Timing",
      `ratelimit;dur=${rateLimitMs.toFixed(1)}, total;dur=${totalMs.toFixed(1)}`
    );
    return resp;
  }

  let body: { email?: string; password?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }

  const email = typeof body.email === "string" ? body.email.trim() : "";
  const password = typeof body.password === "string" ? body.password : "";

  if (!email || !password) {
    return NextResponse.json(
      { error: "Please enter your email and password." },
      { status: 400 }
    );
  }
  if (!isValidEmail(email)) {
    return NextResponse.json({ error: EMAIL_ERROR }, { status: 400 });
  }

  let response = NextResponse.json({ success: true });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => {
            response.cookies.set(name, value, options);
          });
        },
      },
    }
  );

  const signInStart = now();
  const { error } = await supabase.auth.signInWithPassword({ email, password });
  const supabaseSignInMs = now() - signInStart;
  const totalMs = now() - t0;

  console.log("[auth-login-timing]", {
    rateLimitMs: Math.round(rateLimitMs),
    supabaseSignInMs: Math.round(supabaseSignInMs),
    totalMs: Math.round(totalMs),
    result: error ? "rejected" : "success",
  });
  const serverTiming = `ratelimit;dur=${rateLimitMs.toFixed(1)}, supabase;dur=${supabaseSignInMs.toFixed(1)}, total;dur=${totalMs.toFixed(1)}`;

  if (error) {
    const msg = error.message.toLowerCase().includes("email not confirmed")
      ? "Please confirm your email first — check your inbox for the confirmation link."
      : "Incorrect email or password.";
    const resp = NextResponse.json({ error: msg }, { status: 401 });
    resp.headers.set("Server-Timing", serverTiming);
    return resp;
  }

  response.headers.set("Server-Timing", serverTiming);
  return response;
}
