/**
 * Runs once when the Next.js Node server starts — never in the browser bundle.
 * Forces IPv4 for outbound fetch so Supabase calls don't hang on broken IPv6.
 */
export async function register() {
  if (process.env.NEXT_RUNTIME !== "nodejs") return;

  const { Agent, setGlobalDispatcher } = await import("undici");
  setGlobalDispatcher(new Agent({ connect: { family: 4 } }));
}
