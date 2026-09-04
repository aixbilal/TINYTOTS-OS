// Project-owned stub published locally under the package name "esbuild-wasm".
//
// Why this package exists (TinyTots K.2-A.1):
//
// @serwist/turbopack's `withSerwist()` adds "esbuild" and "esbuild-wasm" to
// Next's `serverExternalPackages`. That makes Next/Turbopack pass both names
// through as literal external references instead of bundling them, so the
// dynamic `import("esbuild-wasm")` in @serwist/turbopack's else-branch (the
// non-native-esbuild fallback; this project sets `useNativeEsbuild: true`, so
// that branch is dead code — see app/serwist/[path]/route.ts) survives all
// the way into the generated Next server output.
//
// OpenNext's Cloudflare adapter then runs its own separate esbuild bundling
// pass over that server output (bundle-server.js) to produce the single
// Worker script. That pass performs real module resolution for every static
// import, including this dynamic one, and fails the build with
// "Could not resolve esbuild-wasm" when no package by that name exists.
//
// The real `esbuild-wasm` package is a multi-MB WASM build of esbuild that
// this project does not need and must not ship in the Worker bundle — the
// branch that imports it can never execute. This package satisfies the
// resolver with a few bytes instead, and fails loudly (rather than silently
// no-op'ing) if that assumption is ever wrong, i.e. if the fallback branch is
// somehow reached at runtime.
//
// Mirrors the intent of ../../cloudflare-shims/esbuild-wasm-stub.js, which
// covers the same dead branch during the Next/Turbopack build phase; this
// file covers OpenNext's separate, later esbuild bundling phase, which does
// not honor Turbopack's `resolveAlias`.
throw new Error(
  "esbuild-wasm stub: unreachable (useNativeEsbuild is enabled; the service worker is built at build time via native esbuild, not esbuild-wasm)"
);
