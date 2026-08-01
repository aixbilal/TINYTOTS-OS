const API_BASE = "http://localhost:3000";

// Must match backend POS_API_SECRET (override via VITE_POS_API_SECRET in .env).
const POS_TOKEN =
  import.meta.env.VITE_POS_API_SECRET || "tinytots-local-pos-dev-token";

/**
 * fetch() wrapper for the local POS Express API.
 * Mutating requests require X-POS-Token (shared secret with the backend).
 */
export function apiFetch(path, options = {}) {
  const url = path.startsWith("http") ? path : `${API_BASE}${path}`;
  const headers = new Headers(options.headers || {});

  const method = (options.method || "GET").toUpperCase();
  if (method !== "GET" && method !== "HEAD" && method !== "OPTIONS") {
    headers.set("X-POS-Token", POS_TOKEN);
  }

  return fetch(url, { ...options, headers });
}

export { API_BASE };
