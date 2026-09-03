// Metadata for /products and /products/[id] is defined per-page via
// generateMetadata (canonical, Open Graph, robots). This layout is a plain
// passthrough.
export default function ProductsLayout({ children }: { children: React.ReactNode }) {
  return children;
}
