"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/lib/auth-context";
import { useWishlist } from "@/lib/wishlist-context";
import { useCart } from "@/lib/cart-context";
import { supabase } from "@/lib/supabase";
import AccountSidebar from "@/components/AccountSidebar";

type WishlistProduct = {
  id: number;
  name: string;
  brand: string | null;
  image_url: string | null;
  variants: { id: number; web_price: number | null; price: number; stock: number; size?: string | null; color?: string | null }[];
};

export default function WishlistPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const { productIds, loading: wishlistLoading, toggle } = useWishlist();
  const cart = useCart() as any;
  const [products, setProducts] = useState<WishlistProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [customerName, setCustomerName] = useState<string | null>(null);

  useEffect(() => {
    if (!authLoading && !user) router.push("/login");
  }, [authLoading, user, router]);

  useEffect(() => {
    if (!user) return;
    supabase
      .from("customers")
      .select("full_name")
      .eq("auth_user_id", user.id)
      .single()
      .then(({ data }) => setCustomerName(data?.full_name ?? null));
  }, [user]);

  useEffect(() => {
    if (wishlistLoading) return;

    if (productIds.size === 0) {
      setProducts([]);
      setLoading(false);
      return;
    }

    supabase
      .from("products")
      .select("id, name, brand, image_url, variants(id, web_price, price, stock, size, color)")
      .in("id", Array.from(productIds))
      .eq("is_active", true)
      .then(({ data }) => {
        setProducts(data || []);
        setLoading(false);
      });
  }, [productIds, wishlistLoading]);

  if (authLoading || loading) {
    return (
      <main className="max-w-container-max mx-auto py-stack-lg">
        <p className="font-body-md text-body-md text-on-surface-variant">Loading...</p>
      </main>
    );
  }

  if (!user) return null;

  function addToBag(p: WishlistProduct) {
    const variant = p.variants?.find((v) => v.stock > 0);
    if (!variant || !cart?.addItem) return;
    cart.addItem(
      {
        variantId: variant.id,
        productId: p.id,
        productName: p.name,
        size: variant.size ?? null,
        color: variant.color ?? null,
        price: variant.web_price ?? variant.price,
        maxStock: variant.stock,
      },
      1
    );
  }

  function moveAllToBag() {
    products.forEach((p) => {
      const inStock = p.variants?.some((v) => v.stock > 0);
      if (inStock) addToBag(p);
    });
  }

  return (
    <main className="max-w-container-max mx-auto w-full py-stack-lg flex flex-col md:flex-row gap-gutter">
      <AccountSidebar name={customerName} />

      <section className="flex-grow min-w-0">
        {/* Header & Actions */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end mb-stack-lg gap-4">
          <div>
            <h1 className="font-display-md text-display-md text-on-surface mb-2">My Wishlist</h1>
            <p className="font-body-md text-body-md text-on-surface-variant">
              {products.length} item{products.length === 1 ? "" : "s"} curated for your little one.
            </p>
          </div>
          {products.length > 0 && (
            <div className="flex gap-3">
              <button
                onClick={() => {
                  if (navigator.share) {
                    navigator.share({ title: "My TinyTots Wishlist", url: window.location.href }).catch(() => {});
                  } else {
                    navigator.clipboard?.writeText(window.location.href);
                  }
                }}
                className="px-4 py-3 border border-outline rounded-lg font-button text-button text-on-surface hover:bg-surface-container-high transition-colors flex items-center gap-2"
              >
                <span className="material-symbols-outlined text-lg">ios_share</span> Share Wishlist
              </button>
              <button
                onClick={moveAllToBag}
                className="px-6 py-3 bg-primary-container text-on-primary-container rounded-lg font-button text-button hover:opacity-90 transition-opacity"
              >
                Move All to Bag
              </button>
            </div>
          )}
        </div>

        {products.length === 0 ? (
          <p className="font-body-sm text-body-sm text-on-surface-variant">
            Nothing saved yet.{" "}
            <Link href="/products" className="text-primary hover:underline">
              Browse products
            </Link>
          </p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-bento-gap">
            {products.map((p) => {
              const variant = p.variants?.[0];
              const price = variant?.web_price ?? variant?.price;
              const inStock = p.variants?.some((v) => v.stock > 0);
              const subtitle = [variant?.color, variant?.size].filter(Boolean).join(" / ");

              return (
                <div
                  key={p.id}
                  className="group relative flex flex-col bg-surface-container-lowest rounded-2xl border border-outline/10 overflow-hidden hover:border-outline/30 transition-colors"
                >
                  <button
                    onClick={() => toggle(p.id)}
                    aria-label="Remove from wishlist"
                    className="absolute top-3 right-3 z-10 p-2 bg-surface/80 backdrop-blur rounded-full text-error hover:text-on-surface-variant transition-colors flex items-center justify-center group/btn shadow-sm"
                  >
                    <span
                      className="material-symbols-outlined group-hover/btn:hidden text-lg"
                      style={{ fontVariationSettings: "'FILL' 1" }}
                    >
                      favorite
                    </span>
                    <span className="material-symbols-outlined hidden group-hover/btn:block text-lg">
                      heart_broken
                    </span>
                  </button>

                  {!inStock && (
                    <div className="absolute top-4 left-4 z-10 bg-secondary-container/20 text-on-secondary-container px-3 py-1 rounded-full font-label-md text-label-md backdrop-blur-sm border border-secondary-container/30">
                      Out of Stock
                    </div>
                  )}

                  <Link
                    href={`/products/${p.id}`}
                    className={`aspect-[4/5] bg-surface-container-low relative overflow-hidden block ${!inStock ? "opacity-60" : ""}`}
                  >
                    {p.image_url ? (
                      <img
                        src={p.image_url}
                        alt={p.name}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-on-surface-variant font-body-sm text-body-sm">
                        No image
                      </div>
                    )}
                  </Link>

                  <div className="p-4 flex flex-col flex-grow">
                    <Link href={`/products/${p.id}`}>
                      <h3 className={`font-headline-md text-headline-md text-on-surface mb-1 ${!inStock ? "opacity-70" : ""}`}>
                        {p.name}
                      </h3>
                    </Link>
                    <p className={`font-body-sm text-body-sm text-on-surface-variant mb-4 ${!inStock ? "opacity-70" : ""}`}>
                      {subtitle || p.brand}
                    </p>
                    <div className="mt-auto flex items-center justify-between">
                      <span className={`font-body-lg text-body-lg text-on-surface font-semibold ${!inStock ? "opacity-70" : ""}`}>
                        {price ? `Rs. ${price.toLocaleString()}` : ""}
                      </span>
                      {inStock ? (
                        <button
                          aria-label="Add to Bag"
                          onClick={() => addToBag(p)}
                          className="p-3 bg-primary-container text-on-primary-container rounded-lg hover:opacity-90 transition-opacity"
                        >
                          <span className="material-symbols-outlined">shopping_bag</span>
                        </button>
                      ) : (
                        <button
                          aria-label="Notify me"
                          className="p-3 bg-surface-container-highest text-on-surface-variant rounded-lg cursor-not-allowed"
                        >
                          <span className="material-symbols-outlined">notifications</span>
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>
    </main>
  );
}
