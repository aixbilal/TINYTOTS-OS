import type { MetadataRoute } from "next";
import { getSiteUrl } from "@/lib/site-url";

export default function robots(): MetadataRoute.Robots {
  const site = getSiteUrl();

  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        // Private / transactional / auth areas. robots.txt controls crawling,
        // not indexing — each of these also carries a noindex robots tag.
        disallow: [
          "/admin",
          "/admin/",
          "/api/",
          "/account",
          "/account/",
          "/cart",
          "/checkout",
          "/order-confirmation",
          "/auth/",
          "/login",
          "/signup",
          "/forgot-password",
          "/reset-password",
          "/signage",
        ],
      },
    ],
    sitemap: `${site}/sitemap.xml`,
    // `host` is a non-standard directive (Google ignores it); omitted for
    // standards cleanliness. Canonical host is enforced via <link rel=canonical>
    // and absolute URLs from getSiteUrl().
  };
}
