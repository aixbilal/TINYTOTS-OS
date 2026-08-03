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
    // Native esbuild is preferred on Windows per @serwist/turbopack defaults.
    useNativeEsbuild: true,
  });
