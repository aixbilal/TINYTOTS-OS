// Stub for esbuild-wasm.
//
// @serwist/turbopack references BOTH `import("esbuild")` and
// `import("esbuild-wasm")` in its service-worker bundler. This project sets
// `useNativeEsbuild: true`, so only the native `esbuild` branch ever runs and
// the wasm branch is dead code. It is aliased here so the Cloudflare/OpenNext
// post-build esbuild pass does not fail trying to resolve an uninstalled
// `esbuild-wasm`. The SW is generated at build time and served as a static
// asset, so this module is never evaluated on the Worker at runtime.
throw new Error(
  "esbuild-wasm stub: unreachable (useNativeEsbuild is enabled; SW is built at build time)"
);
