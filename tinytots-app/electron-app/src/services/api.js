const API_BASE = "http://localhost:3000";

const DEV_POS_FALLBACK_SECRET = "tinytots-local-pos-dev-token";
const POS_TOKEN = import.meta.env.VITE_POS_API_SECRET;

if (!POS_TOKEN) {
  if (import.meta.env.PROD) {
    throw new Error(
      "VITE_POS_API_SECRET is not set. Refusing to run a production build without the POS shared secret."
    );
  }
  console.warn(
    "[POS] VITE_POS_API_SECRET is unset — using the well-known dev default. " +
      "Set VITE_POS_API_SECRET in the Electron root .env (must match backend POS_API_SECRET)."
  );
}

/**
 * fetch() wrapper for the local POS Express API.
 * Mutating requests require X-POS-Token (shared secret with the backend).
 */
export function apiFetch(path, options = {}) {
  const url = path.startsWith("http") ? path : `${API_BASE}${path}`;
  const headers = new Headers(options.headers || {});

  const method = (options.method || "GET").toUpperCase();
  if (method !== "GET" && method !== "HEAD" && method !== "OPTIONS") {
    headers.set("X-POS-Token", POS_TOKEN || DEV_POS_FALLBACK_SECRET);
  }

  return fetch(url, { ...options, headers });
}

export { API_BASE };
