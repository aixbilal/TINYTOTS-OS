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

function addNoIndex(res: NextResponse): NextResponse {
  res.headers.set("X-Robots-Tag", "noindex, nofollow");
  return res;
}

/**
 * Server-side gate for the /admin/* pages. This is defense-in-depth and a
 * crawler hint — `requireAdmin` on every /api/admin/* route remains the
 * authoritative authorization boundary. Anonymous or non-admin visitors are
 * redirected to /admin/login instead of being served the panel shell, and all
 * /admin responses carry X-Robots-Tag: noindex.
 */
async function guardAdmin(request: NextRequest): Promise<NextResponse> {
  const loginUrl = request.nextUrl.clone();
  loginUrl.pathname = "/admin/login";
  loginUrl.search = "";
  const toLogin = () => addNoIndex(NextResponse.redirect(loginUrl));

  const pathname = request.nextUrl.pathname;
  if (pathname === "/admin/login" || pathname.startsWith("/admin/login/")) {
    return addNoIndex(NextResponse.next({ request }));
  }

  if (!hasSupabaseAuthCookie(request)) return toLogin();

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll() {
          /* read-only: no cookie propagation needed for a gate decision */
        },
      },
    }
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return toLogin();

  const { data: adminRow, error } = await supabase
    .from("admin_users")
    .select("is_active")
    .eq("auth_user_id", user.id)
    .maybeSingle();

  // Fail closed on a definitive "not an active admin"; fail open on a transient
  // read error so a DB blip can't lock out a real admin (client guard + API
  // requireAdmin still protect all data).
  if (!error && (!adminRow || adminRow.is_active !== true)) return toLogin();

  return addNoIndex(NextResponse.next({ request }));
}

/**
 * Phone is a required profile field (self-attested). Any signed-in customer
 * without customers.phone is sent to /account/add-phone — for email and Google.
 *
 * Auth sessions must live in cookies (@supabase/ssr) for this to see them.
 */
export async function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname;

  // Admin pages: server-gated + noindex (see guardAdmin).
  if (pathname === "/admin" || pathname.startsWith("/admin/")) {
    return guardAdmin(request);
  }

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
    {
      /*
       * Skip static assets, Next internals, and service-worker artifacts.
       * (Exact same pathname exclusion regex as before.)
       */
      source:
        "/((?!_next/static|_next/image|favicon.ico|serwist/|sw\\.js|sw\\.js\\.map|workbox-.*|swe-worker-.*|manifest\\.json|offline|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)",
      // Documented Next.js prefetch signals (see "Matching Headers, Cookies,
      // and Query Strings" in the Middleware matcher config docs). A request
      // carrying either header is a Link prefetch, not a real navigation —
      // `missing` excludes it from invoking middleware() at all, so it never
      // pays the getUser()/customers.phone round trips. Real navigations
      // carry neither header and are unaffected — middleware() itself, the
      // phone gate, and admin handling are unchanged.
      missing: [
        { type: "header", key: "next-router-prefetch" },
        { type: "header", key: "purpose", value: "prefetch" },
      ],
    },
  ],
};
