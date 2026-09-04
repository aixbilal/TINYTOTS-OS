// Stub for `undici` — Cloudflare Workers build only.
//
// `lib/force-ipv4.ts` dynamically imports undici to pin Node's global
// dispatcher to `family: 4`, working around networks that advertise IPv6 but
// don't route it (Node "happy eyeballs" hangs on Supabase calls). That is a
// Node-only concern: on workerd the runtime owns outbound connections, so
// `forceIpv4Outbound()` returns before the import ever runs.
//
// undici is ~1.5 MB of Node http/socket implementation across three Turbopack
// server chunks. It is unreachable on the Worker but still bundled, so the
// Cloudflare build aliases it here (see `next.config.ts` — applied only when
// TINYTOTS_BUILD_TARGET=cloudflare, i.e. `npm run build:cf`). The canonical
// Node/Vercel build is untouched and still bundles the real undici.
throw new Error(
  "undici stub: unreachable on Cloudflare Workers (forceIpv4Outbound() returns before importing undici)"
);
