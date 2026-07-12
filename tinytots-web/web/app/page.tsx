import { supabase } from "@/lib/supabase";
import Link from "next/link";

async function getProducts() {
  const { data, error } = await supabase
    .from("products")
    .select(
      `
      id,
      name,
      sku,
      brand,
      variants (
        id,
        price,
        stock
      )
    `
    )
    .eq("is_active", true)
    .order("created_at", { ascending: false });

  if (error) return [];
  return data;
}

export default async function Home() {
  const products = await getProducts();

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-black">
      <main className="max-w-6xl mx-auto px-6 py-12">
        <h1 className="text-3xl font-semibold mb-8 text-black dark:text-white">
          TinyTots — Shop
        </h1>

        {products.length === 0 && (
          <p className="text-zinc-500">No products available right now.</p>
        )}

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-6">
          {products.map((product: any) => {
            const totalStock = product.variants.reduce(
              (sum: number, v: any) => sum + v.stock,
              0
            );
            const prices = product.variants.map((v: any) => v.price);
            const minPrice = prices.length ? Math.min(...prices) : 0;

            return (
              <Link
                key={product.id}
                href={`/products/${product.id}`}
                className="block border border-zinc-200 dark:border-zinc-800 rounded-lg p-4 hover:shadow-md transition-shadow"
              >
                <div className="aspect-square bg-zinc-100 dark:bg-zinc-900 rounded mb-3" />
                <h2 className="font-medium text-black dark:text-white">
                  {product.name}
                </h2>
                <p className="text-sm text-zinc-500">{product.brand}</p>
                <p className="mt-1 font-semibold text-black dark:text-white">
                  Rs. {minPrice.toLocaleString()}
                </p>
                <p className="text-xs text-zinc-400 mt-1">
                  {totalStock > 0 ? `${totalStock} in stock` : "Out of stock"}
                </p>
              </Link>
            );
          })}
        </div>
      </main>
    </div>
  );
}