import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

function hasSupabaseAuthCookie(request: NextRequest): boolean {
  // Skip Auth network round-trip for anonymous storefront traffic (biggest TTFB win on /).
  return request.cookies.getAll().some(({ name }) => {
    if (name === "sb-access-token" || name === "sb-refresh-token") return true;
    // @supabase/ssr cookie names: sb-<project-ref>-auth-token(+.N)
    return name.startsWith("sb-") && name.includes("-auth-token");
  });
}

/**
 * Phone is a required profile field (self-attested). Any signed-in customer
 * without customers.phone is sent to /account/add-phone — for email and Google.
 *
 * Auth sessions must live in cookies (@supabase/ssr) for this to see them.
 */
export async function middleware(request: NextRequest) {
  // Anonymous visitors: no JWT refresh / getUser — critical for homepage LCP/TTFB.
  if (!hasSupabaseAuthCookie(request)) {
    return NextResponse.next({ request });
  }

  let response = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => {
            request.cookies.set(name, value);
          });
          response = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) => {
            response.cookies.set(name, value, options);
          });
        },
      },
    }
  );

  // Validate JWT with Auth server — do not trust getSession() alone.
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return response;
  }

  const pathname = request.nextUrl.pathname;

  // Always refresh the session on these paths, but never force the phone gate.
  const phoneGateExempt =
    pathname === "/account/add-phone" ||
    pathname.startsWith("/account/add-phone/") ||
    pathname === "/auth/callback" ||
    pathname.startsWith("/auth/callback/") ||
    pathname.startsWith("/api/") ||
    pathname === "/login" ||
    pathname.startsWith("/login/") ||
    pathname === "/signup" ||
    pathname.startsWith("/signup/") ||
    pathname === "/forgot-password" ||
    pathname.startsWith("/forgot-password/") ||
    pathname === "/reset-password" ||
    pathname.startsWith("/reset-password/") ||
    pathname.startsWith("/admin") ||
    pathname.startsWith("/signage");

  if (phoneGateExempt) {
    return response;
  }

  const { data: customer, error } = await supabase
    .from("customers")
    .select("phone")
    .eq("auth_user_id", user.id)
    .maybeSingle();

  // Fail closed for storefront: if we can't read the row or phone is empty, gate.
  const phone = customer?.phone?.trim() ?? "";
  if (error || !phone) {
    const url = request.nextUrl.clone();
    url.pathname = "/account/add-phone";
    url.search = "";
    const redirect = NextResponse.redirect(url);
    // Preserve refreshed auth cookies on the redirect response.
    for (const c of response.cookies.getAll()) {
      redirect.cookies.set(c.name, c.value);
    }
    return redirect;
  }

  return response;
}

export const config = {
  matcher: [
    /*
     * Skip static assets and Next internals.
     */
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)",
  ],
};
