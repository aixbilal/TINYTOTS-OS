import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { clientIp, rateLimit, rateLimitResponse } from "@/lib/rate-limit";
import { isValidEmail, EMAIL_ERROR } from "@/lib/validate-email";

const AUTH_WINDOW_MS = 15 * 60 * 1000;
const AUTH_LIMIT = 5;

export async function POST(request: NextRequest) {
  const limited = await rateLimit(`auth-forgot:${clientIp(request)}`, {
    limit: AUTH_LIMIT,
    windowMs: AUTH_WINDOW_MS,
  });
  if (!limited.ok) return rateLimitResponse(limited.retryAfterSec);

  let body: { email?: string; redirectTo?: string; captchaToken?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }

  const email = typeof body.email === "string" ? body.email.trim() : "";
  const captchaToken =
    typeof body.captchaToken === "string" && body.captchaToken ? body.captchaToken : undefined;
  if (!email) {
    return NextResponse.json(
      { error: "Please enter your email address." },
      { status: 400 }
    );
  }
  if (!isValidEmail(email)) {
    return NextResponse.json({ error: EMAIL_ERROR }, { status: 400 });
  }

  const origin = request.headers.get("origin") || process.env.NEXT_PUBLIC_SITE_URL || "";
  const redirectTo =
    typeof body.redirectTo === "string" && body.redirectTo.startsWith("/")
      ? `${origin}${body.redirectTo}`
      : `${origin}/reset-password`;

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  // Always return success to the client — do not reveal whether the email exists.
  await supabase.auth.resetPasswordForEmail(email, {
    redirectTo,
    ...(captchaToken ? { captchaToken } : {}),
  });

  return NextResponse.json({ success: true });
}
