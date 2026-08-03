import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Do NOT mark isomorphic-dompurify/jsdom as serverExternalPackages —
  // on Vercel that triggers externalRequire → ERR_REQUIRE_ESM via
  // html-encoding-sniffer/@exodus/bytes. Server HTML is sanitized with
  // sanitize-html (lib/sanitize.ts) instead.
  images: {
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
};

export default nextConfig;
