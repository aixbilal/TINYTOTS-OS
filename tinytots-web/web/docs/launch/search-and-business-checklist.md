# Search & Business Profile Launch Checklist

For the owner, to run **after** the production domain cutover is confirmed
live (not before — verifying a property against a host that isn't serving
the real site yet just wastes the verification attempt). No external
account was logged into, verified, or otherwise touched while preparing
this checklist — it is documentation only.

## 0. Current code state (verified 2026-09-06, no defects found)

Already correctly implemented, nothing here needs a code change:

- **`NEXT_PUBLIC_SITE_URL` architecture** (`lib/site-url.ts`) — canonical
  URLs, Open Graph, sitemap and robots.txt all resolve through
  `getSiteUrl()`/`absoluteUrl()`. Resolution order: explicit
  `NEXT_PUBLIC_SITE_URL` → Vercel production hostname → Vercel preview
  hostname → a hardcoded `https://tinytotsofficial.com` production
  fallback → `localhost` in dev. **Action still required at launch:** set
  `NEXT_PUBLIC_SITE_URL=https://tinytotsofficial.com` in the production
  environment once the domain is live — the code guards against a
  catastrophic `localhost` canonical if this is missed, but the explicit
  var is still what you want set.
- **`robots.txt`** (`app/robots.ts`) — allows everything except admin,
  API, auth, and account/cart/checkout/order routes (all of which also
  carry their own `noindex`); points `sitemap:` at `/sitemap.xml`.
- **`sitemap.xml`** (`app/sitemap.ts`) — dynamic, includes all static
  storefront routes plus live products/categories/help articles/blog
  posts from the database. `/stores` is deliberately **not** listed yet
  (see §3).
- **Canonical tags** — every page goes through `pageMetadata()`
  (`lib/seo.ts`), which always sets `alternates.canonical` from the same
  `getSiteUrl()`.
- **Structured data** — `Organization` and `WebSite` JSON-LD
  (`lib/seo.ts`) use one stable `@id` each so they resolve as a single
  entity rather than duplicating per page. `Organization.description` and
  `sameAs` are sourced only from real, admin-configured facts (no
  fabricated claims) — see `ORG_DESCRIPTION` and `validSameAs()`.

## 1. Google Search Console

1. Add the production property (`https://tinytotsofficial.com`) — domain
   property (covers `www` and non-`www`, http/https) is preferable to a
   URL-prefix property if you control DNS, which you do.
2. Verify ownership. Since `NEXT_PUBLIC_SITE_URL`/DNS is already the
   source of truth, the DNS TXT record method is the least fragile choice
   (no file to keep deployed).
3. Submit `https://tinytotsofficial.com/sitemap.xml` under Sitemaps.
4. Use URL Inspection on a few key pages (`/`, `/products`, one PDP) to
   confirm they're indexed as expected once crawled.
5. Do this **after** the domain cutover is fully propagated — verifying
   against a not-yet-live host wastes the check.

## 2. Bing Webmaster Tools

1. Add the same production property.
2. Bing supports importing verified sites directly from Google Search
   Console — use that if offered, it's faster than re-verifying by hand.
3. Submit the same sitemap URL.

## 3. Google Business Profile

1. **Check for an existing profile first** — search for "TinyTots" in
   Google Maps/Search before creating one. Do not create a duplicate
   listing if one already exists (even unclaimed/unverified); claim the
   existing one instead.
2. Set the website URL field to `https://tinytotsofficial.com` once live.
3. **Physical-location consistency**: this repo currently has no
   street-level verified store address — see
   `tinytots-web/web/lib/locations/get-public-locations.ts` and the
   `feat(stores): add verified location contracts` commit on this branch.
   The only verified fact anywhere in the codebase is the business's
   city/region, `"Toba Tek Singh, Punjab, Pakistan"`
   (`app/api/v1/meta-agent/store-info/route.ts`) — not a full address. A
   Business Profile needs a real street address (or, for a delivery-only
   business with no walk-in storefront, a service-area profile with no
   public address). **Before creating or editing a GBP listing, decide
   which of those two profile types actually matches the business**, and
   supply the exact address if a storefront listing is correct. Whatever
   address is used there should also become the first verified row in
   `public.locations` (see the Plan 1/2/3 commits on this branch) so the
   website's `/stores` page and the GBP listing agree — do not let them
   drift into two different "official" addresses.
4. Once a location is verified end-to-end (GBP + `public.locations` row +
   a real Google Maps link), two follow-ups on this branch's work become
   safe to do:
   - Add `/stores` to `app/sitemap.ts`.
   - Remove the `robots: NOINDEX_FOLLOW` in `app/stores/page.tsx`'s
     `generateMetadata()` and add a nav link per the original store-locator
     plan's "one sensible discoverable link" guidance.

## 4. Explicitly not done as part of this checklist

No login, verification attempt, or configuration change was made against
Google Search Console, Bing Webmaster Tools, or Google Business Profile.
No production hostname was changed while DNS cutover is in progress.
