/**
 * Force IPv4 for outbound fetch on a real Node.js server.
 *
 * WHY: on some networks IPv6 is advertised but doesn't route, and Node's
 * "happy eyeballs" fallback adds ~20-30s hangs to Supabase calls. Forcing
 * the undici global dispatcher to `family: 4` avoids that.
 *
 * WORKERS: this is a Node-only concern. On Cloudflare Workers / workerd the
 * runtime owns outbound connections (no happy-eyeballs hang) and undici's
 * Node sockets are unavailable, so this must be a no-op there. `undici` is
 * pulled in via a guarded dynamic import so it never enters a non-Node
 * bundle's synchronous module graph.
 *
 * Idempotent: safe to call from many modules; only the first call does work.
 * The canonical Node path also calls this once from instrumentation.ts.
 */
let applied = false;

export async function forceIpv4Outbound(): Promise<void> {
  if (applied) return;
  applied = true;

  // Cloudflare Workers / workerd — nothing to do.
  if (
    typeof navigator !== "undefined" &&
    navigator.userAgent === "Cloudflare-Workers"
  ) {
    return;
  }
  // Next.js edge runtime — no undici there either.
  if (process.env.NEXT_RUNTIME && process.env.NEXT_RUNTIME !== "nodejs") {
    return;
  }

  try {
    const { Agent, setGlobalDispatcher } = await import("undici");
    setGlobalDispatcher(new Agent({ connect: { family: 4 } }));
  } catch {
    // undici not available (non-Node runtime) — outbound connections are
    // managed by the host; nothing to configure.
  }
}
