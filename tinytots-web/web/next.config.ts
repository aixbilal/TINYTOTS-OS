import type { NextConfig } from "next";
import { withSerwist } from "@serwist/turbopack";

/**
 * PWA via Serwist (successor to @ducanh2912/next-pwa; works with Next.js 16 Turbopack).
 * Service worker source: app/sw.ts — served from /serwist/sw.js via app/serwist/[path]/route.ts.
 * Disabled in development through SerwistProvider (see layout).
 */
const nextConfig: NextConfig = {
  // Do NOT mark isomorphic-dompurify/jsdom as serverExternalPackages —
  // on Vercel that triggers externalRequire → ERR_REQUIRE_ESM via
  // html-encoding-sniffer/@exodus/bytes. Server HTML is sanitized with
  // sanitize-html (lib/sanitize.ts) instead.
  images: {
    formats: ["image/avif", "image/webp"],
    minimumCacheTTL: 60 * 60 * 24 * 30,
    remotePatterns: [
      {
        protocol: "https",
        hostname: "vldjscskhsrrzdhhvcht.supabase.co",
        pathname: "/storage/v1/object/public/**",
      },
      {
        protocol: "https",
        hostname: "lh3.googleusercontent.com",
        pathname: "/**",
      },
    ],
  },
  async headers() {
    return [
      {
        source: "/:path*.:ext(ico|png|jpg|jpeg|gif|webp|avif|svg|woff|woff2)",
        headers: [
          {
            key: "Cache-Control",
            value: "public, max-age=31536000, immutable",
          },
        ],
      },
      {
        source: "/_next/static/:path*",
        headers: [
          {
            key: "Cache-Control",
            value: "public, max-age=31536000, immutable",
          },
        ],
      },
      {
        source: "/_next/image",
        headers: [
          {
            key: "Cache-Control",
            value: "public, max-age=86400, stale-while-revalidate=604800",
          },
        ],
      },
    ];
  },
};

export default withSerwist(nextConfig);
