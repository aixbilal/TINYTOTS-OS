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
        <p className="font-body-md text-body-md text-text-secondary">Loading...</p>
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
        imageUrl: p.image_url ?? undefined,
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
            <h1 className="font-display-md text-display-md text-text-primary mb-2">My Wishlist</h1>
            <p className="font-body-md text-body-md text-text-secondary">
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
                className="px-4 py-3 border border-border-default rounded-lg font-button text-button text-text-primary hover:bg-surface-secondary transition-colors flex items-center gap-2"
              >
                <span className="material-symbols-outlined text-lg">ios_share</span> Share Wishlist
              </button>
              <button
                onClick={moveAllToBag}
                className="px-6 py-3 bg-brand-primary text-white rounded-lg font-button text-button hover:opacity-90 transition-opacity"
              >
                Add All to Bag
              </button>
            </div>
          )}
        </div>

        {products.length === 0 ? (
          <div className="bg-surface-elevated rounded-2xl border border-border-subtle shadow-sm p-10 flex flex-col items-center text-center gap-3">
            <span className="material-symbols-outlined text-brand-primary text-[40px]">favorite</span>
            <h2 className="font-headline-md text-headline-md text-text-primary">Nothing saved yet</h2>
            <p className="font-body-sm text-body-sm text-text-secondary max-w-sm">
              Tap the heart on any product to save it here for later.
            </p>
            <Link
              href="/products"
              className="mt-2 bg-brand-primary text-white font-button text-button px-6 py-3 rounded-xl hover:opacity-90 transition-opacity"
            >
              Browse Products
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-bento-gap">
            {products.map((p) => {
              const variant = p.variants?.[0];
              const price = variant?.web_price ?? variant?.price;
              const totalStock = p.variants?.reduce((sum, v) => sum + v.stock, 0) ?? 0;
              const inStock = totalStock > 0;
              const subtitle = [variant?.color, variant?.size].filter(Boolean).join(" / ");

              return (
                <div
                  key={p.id}
                  className="group relative flex flex-col bg-surface-elevated rounded-2xl border border-border-subtle overflow-hidden hover:border-border-default transition-colors"
                >
                  <button
                    onClick={() => toggle(p.id)}
                    aria-label="Remove from wishlist"
                    className="absolute top-3 right-3 z-10 p-2 bg-surface-elevated/80 backdrop-blur rounded-full text-red-700 hover:text-text-secondary transition-colors flex items-center justify-center group/btn shadow-sm"
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
                    <div className="absolute top-4 left-4 z-10 bg-surface-elevated/80 text-text-primary px-3 py-1 rounded-full font-label-md text-label-md backdrop-blur-sm border border-border-default">
                      Out of Stock
                    </div>
                  )}

                  <Link
                    href={`/products/${p.id}`}
                    className={`aspect-[4/5] bg-surface-secondary relative overflow-hidden block ${!inStock ? "opacity-60" : ""}`}
                  >
                    {p.image_url ? (
                      <img
                        src={p.image_url}
                        alt={p.name}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-text-secondary font-body-sm text-body-sm">
                        No image
                      </div>
                    )}
                  </Link>

                  <div className="p-4 flex flex-col flex-grow">
                    <Link href={`/products/${p.id}`}>
                      <h3 className={`font-headline-md text-headline-md text-text-primary mb-1 ${!inStock ? "opacity-70" : ""}`}>
                        {p.name}
                      </h3>
                    </Link>
                    <p className={`font-body-sm text-body-sm text-text-secondary mb-1 ${!inStock ? "opacity-70" : ""}`}>
                      {subtitle || p.brand}
                    </p>
                    {inStock && (
                      totalStock <= 3 ? (
                        <p className="font-label-md text-label-md text-[#D9822B] mb-3">Only {totalStock} left</p>
                      ) : (
                        <p className="font-label-md text-label-md text-green-700 mb-3 flex items-center gap-1">
                          <span className="material-symbols-outlined text-[14px]">check</span> In Stock
                        </p>
                      )
                    )}
                    {!inStock && <div className="mb-3" />}
                    <div className="mt-auto flex items-center justify-between">
                      <span className={`font-body-lg text-body-lg text-text-primary font-semibold ${!inStock ? "opacity-70" : ""}`}>
                        {price ? `Rs. ${price.toLocaleString()}` : ""}
                      </span>
                      {inStock ? (
                        <button
                          aria-label="Add to Bag"
                          onClick={() => addToBag(p)}
                          className="p-3 bg-brand-primary text-white rounded-lg hover:opacity-90 transition-opacity"
                        >
                          <span className="material-symbols-outlined">shopping_bag</span>
                        </button>
                      ) : (
                        <button
                          aria-label="Notify me"
                          className="p-3 bg-surface-tertiary text-text-secondary rounded-lg cursor-not-allowed"
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
