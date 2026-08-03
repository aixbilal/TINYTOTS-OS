import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-admin";
import { clientIp, rateLimit, rateLimitResponse } from "@/lib/rate-limit";
import { isValidEmail, EMAIL_ERROR } from "@/lib/validate-email";

// POST /api/newsletter - subscribe an email from the footer form
export async function POST(req: NextRequest) {
  const limited = rateLimit(`newsletter:${clientIp(req)}`, {
    limit: 5,
    windowMs: 60_000,
  });
  if (!limited.ok) return rateLimitResponse(limited.retryAfterSec);

  try {
    const { email } = await req.json();

    if (!email || typeof email !== "string" || !isValidEmail(email)) {
      return NextResponse.json({ error: EMAIL_ERROR }, { status: 400 });
    }

    const { error } = await supabaseAdmin
      .from("newsletter_subscribers")
      .insert({ email: email.trim().toLowerCase() });

    if (error) {
      // Unique violation -> already subscribed, treat as success.
      if (error.code === "23505") {
        return NextResponse.json({ ok: true, already_subscribed: true });
      }
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ ok: true });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Failed to subscribe." }, { status: 500 });
  }
}
