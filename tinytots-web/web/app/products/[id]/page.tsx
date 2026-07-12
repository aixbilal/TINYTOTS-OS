import { supabase } from "@/lib/supabase";
import AddToCart from "@/components/AddToCart";
import Link from "next/link";

async function getProduct(id: string) {
  const { data, error } = await supabase
    .from("products")
    .select(
      `
      id,
      name,
      sku,
      description,
      brand,
      category,
      image_url,
      variants (
        id,
        color,
        size,
        price,
        stock
      )
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
      <div className="max-w-3xl mx-auto px-6 py-12">Product not found.</div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-black">
      <main className="max-w-3xl mx-auto px-6 py-12">
        <Link href="/" className="text-sm text-zinc-500 hover:underline">
          ← Back to shop
        </Link>

        <div className="mt-6 grid sm:grid-cols-2 gap-8">
          <div className="aspect-square bg-zinc-100 dark:bg-zinc-900 rounded-lg" />

          <div>
            <h1 className="text-2xl font-semibold text-black dark:text-white">
              {product.name}
            </h1>
            <p className="text-sm text-zinc-500 mt-1">{product.brand}</p>
            <p className="text-sm text-zinc-500">{product.description}</p>

            <AddToCart
              productId={product.id}
              productName={product.name}
              variants={product.variants}
            />
          </div>
        </div>
      </main>
    </div>
  );
}