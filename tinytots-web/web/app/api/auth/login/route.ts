import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { clientIp, rateLimit, rateLimitResponse } from "@/lib/rate-limit";
import { isValidEmail, EMAIL_ERROR } from "@/lib/validate-email";

const AUTH_WINDOW_MS = 15 * 60 * 1000;
const AUTH_LIMIT = 5;

export async function POST(request: NextRequest) {
  const limited = await rateLimit(`auth-login:${clientIp(request)}`, {
    limit: AUTH_LIMIT,
    windowMs: AUTH_WINDOW_MS,
  });

  if (!limited.ok) {
    return rateLimitResponse(limited.retryAfterSec);
  }

  let body: { email?: string; password?: string; captchaToken?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }

  const email = typeof body.email === "string" ? body.email.trim() : "";
  const password = typeof body.password === "string" ? body.password : "";
  const captchaToken =
    typeof body.captchaToken === "string" && body.captchaToken ? body.captchaToken : undefined;

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

  const { error } = await supabase.auth.signInWithPassword({
    email,
    password,
    ...(captchaToken ? { options: { captchaToken } } : {}),
  });

  if (error) {
    const lower = error.message.toLowerCase();
    const msg = lower.includes("email not confirmed")
      ? "Please confirm your email first — check your inbox for the confirmation link."
      : lower.includes("captcha")
      ? "Please complete the security check and try again."
      : "Incorrect email or password.";
    return NextResponse.json({ error: msg }, { status: 401 });
  }

  return response;
}
