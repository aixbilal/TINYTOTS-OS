import type { NextConfig } from "next";
import { withSerwist } from "@serwist/turbopack";

/**
 * PWA via Serwist (successor to @ducanh2912/next-pwa; works with Next.js 16 Turbopack).
 * Service worker source: app/sw.ts — served from /serwist/sw.js via app/serwist/[path]/route.ts.
 * Disabled in development through SerwistProvider (see layout).
 */
// Enforced everywhere. Only directives that restrict framing / base-uri /
// plugins are enforced here — these cannot break resource loading. The full
// resource policy ships as Content-Security-Policy-Report-Only below so it can
// be tuned from real violation reports before being enforced.
const CSP_ENFORCED = "frame-ancestors 'none'; base-uri 'self'; object-src 'none'";

const SUPABASE_ORIGIN = "https://vldjscskhsrrzdhhvcht.supabase.co";
const CSP_REPORT_ONLY = [
  "default-src 'self'",
  // 'unsafe-inline' is required for Next.js' inline bootstrap + JSON-LD; no 'unsafe-eval'.
  "script-src 'self' 'unsafe-inline' https://va.vercel-scripts.com https://www.googletagmanager.com https://connect.facebook.net",
  "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
  `img-src 'self' data: blob: ${SUPABASE_ORIGIN} https://lh3.googleusercontent.com https://www.facebook.com https://www.google-analytics.com`,
  "font-src 'self' https://fonts.gstatic.com",
  `connect-src 'self' ${SUPABASE_ORIGIN} wss://vldjscskhsrrzdhhvcht.supabase.co https://*.upstash.io https://vitals.vercel-insights.com https://va.vercel-scripts.com https://www.google-analytics.com https://*.analytics.google.com https://region1.google-analytics.com https://connect.facebook.net https://www.facebook.com`,
  "frame-src 'self' https://www.facebook.com",
  "frame-ancestors 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  "object-src 'none'",
].join("; ");

const SECURITY_HEADERS = [
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  {
    key: "Permissions-Policy",
    value: "camera=(), microphone=(), geolocation=(), browsing-topics=()",
  },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "Content-Security-Policy", value: CSP_ENFORCED },
  { key: "Content-Security-Policy-Report-Only", value: CSP_REPORT_ONLY },
];

const nextConfig: NextConfig = {
  // X-Powered-By: Next.js leaks the framework/version — no upside.
  poweredByHeader: false,
  // Do NOT mark isomorphic-dompurify/jsdom as serverExternalPackages —
  // on Vercel that triggers externalRequire → ERR_REQUIRE_ESM via
  // html-encoding-sniffer/@exodus/bytes. Server HTML is sanitized with
  // sanitize-html (lib/sanitize.ts) instead.
  images: {
    loader: "custom",
    loaderFile: "./lib/supabase-image-loader.ts",
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
        // Application security baseline — every route.
        source: "/:path*",
        headers: SECURITY_HEADERS,
      },
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
