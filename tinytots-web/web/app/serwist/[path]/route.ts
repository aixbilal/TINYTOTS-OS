import { spawnSync } from "node:child_process";
import { createSerwistRoute } from "@serwist/turbopack";

const revision =
  spawnSync("git", ["rev-parse", "HEAD"], { encoding: "utf-8" }).stdout?.trim() ||
  crypto.randomUUID();

export const { dynamic, dynamicParams, revalidate, generateStaticParams, GET } =
  createSerwistRoute({
    swSrc: "app/sw.ts",
    // Precache offline shells so navigation fallbacks work after first install.
    additionalPrecacheEntries: [
      { url: "/offline", revision },
      { url: "/~offline", revision },
    ],
    // Strip live commerce/auth URLs from the precache manifest.
    manifestTransforms: [
      async (entries) => ({
        manifest: entries.filter((entry) => {
          const url = entry.url.split("?")[0];
          return !/\/(cart|checkout|login|signup|account|admin|forgot-password|reset-password|track-order|order-confirmation)(\/|$)/.test(
            url
          ) && !url.startsWith("/api/");
        }),
        warnings: [],
      }),
    ],
    // Native esbuild is preferred on Windows per @serwist/turbopack defaults.
    useNativeEsbuild: true,
  });
