import type { MetadataRoute } from "next";
import { getSiteUrl } from "@/lib/site-url";

export default function robots(): MetadataRoute.Robots {
  const site = getSiteUrl();

  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: [
          "/admin",
          "/admin/",
          "/api/",
          "/account",
          "/account/",
          "/checkout",
          "/cart",
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
    host: site,
  };
}
