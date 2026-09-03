/**
 * Runs once when the Next.js server starts — never in the browser bundle.
 * Forces IPv4 for outbound fetch so Supabase calls don't hang on broken IPv6.
 * No-op on the edge runtime and on Cloudflare Workers (see lib/force-ipv4.ts).
 */
export async function register() {
  if (process.env.NEXT_RUNTIME !== "nodejs") return;
  const { forceIpv4Outbound } = await import("@/lib/force-ipv4");
  await forceIpv4Outbound();
}
