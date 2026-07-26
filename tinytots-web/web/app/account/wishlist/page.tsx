"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/lib/auth-context";
import { useWishlist } from "@/lib/wishlist-context";
import { supabase } from "@/lib/supabase";

type WishlistProduct = {
  id: number;
  name: string;
  brand: string | null;
  image_url: string | null;
  variants: { web_price: number | null; price: number; stock: number }[];
};

export default function WishlistPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const { productIds, loading: wishlistLoading, toggle } = useWishlist();
  const [products, setProducts] = useState<WishlistProduct[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!authLoading && !user) router.push("/login");
  }, [authLoading, user, router]);

  useEffect(() => {
    if (wishlistLoading) return;

    if (productIds.size === 0) {
      setProducts([]);
      setLoading(false);
      return;
    }

    supabase
      .from("products")
      .select("id, name, brand, image_url, variants(web_price, price, stock)")
      .in("id", Array.from(productIds))
      .eq("is_active", true)
      .then(({ data }) => {
        setProducts(data || []);
        setLoading(false);
      });
  }, [productIds, wishlistLoading]);

  if (authLoading || loading) {
    return (
      <main className="max-w-2xl mx-auto px-margin-mobile md:px-margin-desktop py-stack-lg">
        <p className="font-body-md text-body-md text-on-surface-variant">Loading...</p>
      </main>
    );
  }

  if (!user) return null;

  return (
    <main className="max-w-container-max mx-auto px-margin-mobile md:px-margin-desktop py-stack-lg">
      <Link href="/account" className="text-sm font-medium text-primary hover:underline mb-4 inline-block">
        ← Back to account
      </Link>
      <h1 className="font-display-md text-display-md text-on-surface mb-stack-md">My Wishlist</h1>

      {products.length === 0 ? (
        <p className="font-body-sm text-body-sm text-on-surface-variant">
          Nothing saved yet.{" "}
          <Link href="/products" className="text-primary hover:underline">
            Browse products
          </Link>
        </p>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-bento-gap">
          {products.map((p) => {
            const variant = p.variants?.[0];
            const price = variant?.web_price ?? variant?.price;
            const inStock = p.variants?.some((v) => v.stock > 0);
            return (
              <div
                key={p.id}
                className="group relative flex flex-col rounded-xl border border-outline-variant/30 bg-surface-container-lowest overflow-hidden hover:border-primary transition-colors"
              >
                <Link href={`/products/${p.id}`} className="aspect-square bg-surface-container-low overflow-hidden block">
                  {p.image_url ? (
                    <img src={p.image_url} alt={p.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-on-surface-variant font-body-sm text-body-sm">
                      No image
                    </div>
                  )}
                </Link>
                <button
                  onClick={() => toggle(p.id)}
                  aria-label="Remove from wishlist"
                  className="absolute top-2 right-2 bg-surface/90 backdrop-blur-sm w-8 h-8 rounded-full flex items-center justify-center shadow-sm"
                >
                  <span className="material-symbols-outlined text-[20px] text-error" style={{ fontVariationSettings: "'FILL' 1" }}>
                    favorite
                  </span>
                </button>
                <Link href={`/products/${p.id}`} className="p-4 flex flex-col gap-1">
                  <p className="font-body-md text-body-md text-on-surface">{p.name}</p>
                  <p className="font-body-sm text-body-sm text-on-surface-variant">{p.brand}</p>
                  <div className="flex justify-between items-center mt-1">
                    <p className="font-headline-md text-headline-md text-primary">
                      {price ? `Rs. ${price.toLocaleString()}` : ""}
                    </p>
                    {!inStock && <span className="font-label-md text-label-md text-error">Out of stock</span>}
                  </div>
                </Link>
              </div>
            );
          })}
        </div>
      )}
    </main>
  );
}