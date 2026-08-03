import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "");

  // Production UI must bake in a real shared secret — never the local fallback.
  // Prefer an explicitly exported process.env value (allows CI / pack scripts to override).
  if (mode === "production") {
    const secret = (
      process.env.VITE_POS_API_SECRET !== undefined
        ? process.env.VITE_POS_API_SECRET
        : env.VITE_POS_API_SECRET || ""
    ).trim();
    if (
      !secret ||
      secret === "tinytots-local-pos-dev-token" ||
      secret === "change-me-to-a-long-random-string"
    ) {
      throw new Error(
        "VITE_POS_API_SECRET must be set to a real secret in .env before a production build. " +
          "It must match backend POS_API_SECRET (not the local dev fallback)."
      );
    }
  }

  return {
    // Relative asset paths so packaged Electron can load file://…/dist/index.html
    base: "./",
    plugins: [react(), tailwindcss()],
    server: {
      proxy: {
        "/api": {
          target: "http://localhost:3000",
          changeOrigin: true,
          secure: false,
        },
      },
    },
  };
});
