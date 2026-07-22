import { supabase } from "@/lib/supabase";
import AddToCart from "@/components/AddToCart";
import Link from "next/link";
import DOMPurify from "isomorphic-dompurify";

async function getProduct(id: string) {
  const { data, error } = await supabase
    .from("products")
    .select(
      `
      id, name, sku, description, brand, category, image_url,
      variants ( id, color, size, price, web_price, stock )
    `
    )
    .eq("id", id)
    .eq("is_active", true)
    .single();

  if (error) return null;
  return data;
}

export default async function ProductDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const product = await getProduct(id);

  if (!product) {
    return (
      <main className="max-w-3xl mx-auto px-margin-mobile md:px-margin-desktop py-stack-lg">
        <p className="text-on-surface-variant">Product not found.</p>
        <Link href="/products" className="text-primary hover:underline">
          ← Back to shop
        </Link>
      </main>
    );
  }

  return (
    <main className="max-w-container-max mx-auto px-margin-mobile md:px-margin-desktop py-stack-lg">
      <nav className="text-body-sm font-body-sm text-on-surface-variant mb-stack-sm flex items-center gap-2">
        <Link href="/" className="hover:text-primary transition-colors">Home</Link>
        <span className="material-symbols-outlined text-[16px]">chevron_right</span>
        <Link href="/products" className="hover:text-primary transition-colors">Shop All</Link>
        <span className="material-symbols-outlined text-[16px]">chevron_right</span>
        <span className="text-on-surface">{product.name}</span>
      </nav>

      <div className="grid md:grid-cols-2 gap-gutter">
        <div className="aspect-square rounded-[16px] overflow-hidden border border-outline-variant/30 bg-surface-container-low">
          {product.image_url ? (
            <img
              className="w-full h-full object-cover"
              src={product.image_url}
              alt={product.name}
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-on-surface-variant">
              No image
            </div>
          )}
        </div>

        <div>
          <h1 className="font-display-md text-display-md text-on-surface">{product.name}</h1>
          <p className="font-body-sm text-body-sm text-on-surface-variant mt-1">
            {product.brand} {product.category ? `· ${product.category}` : ""}
          </p>
          {product.description && (
            <div
              className="font-body-md text-body-md text-on-surface-variant mt-4 prose prose-sm max-w-none"
              dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(product.description) }}
            />
          )}

          <AddToCart
            productId={product.id}
            productName={product.name}
            variants={product.variants}
          />
        </div>
      </div>
    </main>
  );
}