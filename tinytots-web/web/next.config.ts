import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Do NOT mark isomorphic-dompurify/jsdom as serverExternalPackages —
  // on Vercel that triggers externalRequire → ERR_REQUIRE_ESM via
  // html-encoding-sniffer/@exodus/bytes. Server HTML is sanitized with
  // sanitize-html (lib/sanitize.ts) instead.
  images: {
    formats: ["image/avif", "image/webp"],
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
        source: "/:path*.:ext(ico|png|jpg|jpeg|gif|webp|avif|svg|woff2)",
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
    ];
  },
};

export default nextConfig;
