import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // isomorphic-dompurify → jsdom → html-encoding-sniffer is ESM-only;
  // bundling it into the RSC/SSR graph triggers ERR_REQUIRE_ESM.
  serverExternalPackages: [
    "isomorphic-dompurify",
    "jsdom",
    "html-encoding-sniffer",
  ],
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
