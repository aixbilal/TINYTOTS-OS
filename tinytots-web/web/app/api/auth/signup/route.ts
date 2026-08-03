import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { clientIp, rateLimit, rateLimitResponse } from "@/lib/rate-limit";
import { isValidEmail, EMAIL_ERROR } from "@/lib/validate-email";
import { validatePassword } from "@/lib/validate-password";
import { isValidPakPhone, PAK_PHONE_ERROR } from "@/lib/validate-phone";

const AUTH_WINDOW_MS = 15 * 60 * 1000;
const AUTH_LIMIT = 5;

export async function POST(request: NextRequest) {
  const limited = await rateLimit(`auth-signup:${clientIp(request)}`, {
    limit: AUTH_LIMIT,
    windowMs: AUTH_WINDOW_MS,
  });
  if (!limited.ok) return rateLimitResponse(limited.retryAfterSec);

  let body: {
    email?: string;
    password?: string;
    full_name?: string;
    phone?: string;
  };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }

  const email = typeof body.email === "string" ? body.email.trim() : "";
  const password = typeof body.password === "string" ? body.password : "";
  const fullName = typeof body.full_name === "string" ? body.full_name.trim() : "";
  const phone = typeof body.phone === "string" ? body.phone.trim() : "";

  if (!fullName) {
    return NextResponse.json({ error: "Please enter your full name." }, { status: 400 });
  }
  if (!email) {
    return NextResponse.json({ error: "Please enter your email." }, { status: 400 });
  }
  if (!isValidEmail(email)) {
    return NextResponse.json({ error: EMAIL_ERROR }, { status: 400 });
  }
  if (!phone) {
    return NextResponse.json({ error: "Phone number is required." }, { status: 400 });
  }
  if (!isValidPakPhone(phone)) {
    return NextResponse.json({ error: PAK_PHONE_ERROR }, { status: 400 });
  }
  const passwordError = validatePassword(password);
  if (passwordError) {
    return NextResponse.json({ error: passwordError }, { status: 400 });
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

  const { error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        full_name: fullName,
        phone,
      },
    },
  });

  if (error) {
    // Avoid leaking whether the email is already registered when possible.
    const lower = error.message.toLowerCase();
    if (lower.includes("already") || lower.includes("registered")) {
      return NextResponse.json(
        { error: "Could not create account. Try logging in or use a different email." },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { error: "Could not create account. Please try again." },
      { status: 400 }
    );
  }

  return response;
}
