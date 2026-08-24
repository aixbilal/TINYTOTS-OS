import type { Metadata } from "next";
import Link from "next/link";
import { supabaseAdmin } from "@/lib/supabase-admin";
import InternalTrustStrip from "@/components/InternalTrustStrip";

// Static-generate — category list changes rarely (admin-managed).
export const revalidate = 3600;

export const metadata: Metadata = {
  title: "Collections",
  description: "Browse TinyTots pieces grouped by collection — find what you're looking for, faster.",
};

const SHOP_BY = [
  { label: "New In", icon: "auto_awesome", href: "/products?sort=newest" },
  { label: "Girls", icon: "checkroom", href: "/products?gender=girl" },
  { label: "Boys", icon: "checkroom", href: "/products?gender=boy" },
];

export default async function CollectionsPage() {
  // Two lightweight queries (not one per category) — categories, then a
  // single pass over active products' category column to derive real counts.
  const [{ data: categoryRows }, { data: productRows }] = await Promise.all([
    supabaseAdmin
      .from("categories")
      .select("id, name, slug")
      .order("display_order", { ascending: true })
      .order("name", { ascending: true }),
    supabaseAdmin.from("products").select("category").eq("is_active", true),
  ]);

  const categories = categoryRows || [];
  const countByName = new Map<string, number>();
  (productRows || []).forEach((p) => {
    if (p.category) countByName.set(p.category, (countByName.get(p.category) || 0) + 1);
  });

  return (
    <>
      <main className="max-w-container-max mx-auto w-full px-margin-mobile md:px-margin-desktop py-stack-lg">
        <nav className="font-body-sm text-body-sm text-text-secondary mb-stack-sm flex items-center gap-2">
          <Link href="/" className="hover:text-brand-primary transition-colors">Home</Link>
          <span className="material-symbols-outlined text-[16px]">chevron_right</span>
          <span className="text-text-primary">Collections</span>
        </nav>

        {/* Hero — no dedicated Collections hero image exists yet, so this is a
            typographic band using existing brand tokens rather than a photo
            borrowed from another page or a fabricated asset. */}
        <section className="relative w-screen left-1/2 -translate-x-1/2 bg-surface-secondary mb-stack-lg">
          <div className="max-w-container-max mx-auto px-margin-mobile md:px-margin-desktop py-16 md:py-20 text-center">
            <span className="font-label-md text-label-md uppercase tracking-wider text-brand-primary mb-3 block">
              Collections
            </span>
            <h1 className="font-display-xl text-display-md text-text-primary tracking-tight mb-4 max-w-2xl mx-auto">
              Made for every little moment.
            </h1>
            <p className="font-body-md text-body-md text-text-secondary max-w-xl mx-auto">
              Browse our pieces grouped by collection — find what you&apos;re looking for, faster.
            </p>
          </div>
        </section>

        {categories.length === 0 ? (
          <div className="border border-dashed border-border-default rounded-2xl p-12 flex flex-col items-center text-center gap-3 mb-stack-lg">
            <span className="material-symbols-outlined text-[40px] text-text-secondary">category</span>
            <h2 className="font-headline-lg text-headline-lg text-text-primary">No collections available right now</h2>
            <p className="font-body-sm text-body-sm text-text-secondary max-w-sm">
              Check back soon, or browse everything we currently have in stock.
            </p>
            <Link
              href="/products"
              className="mt-2 bg-brand-primary text-white font-button text-button px-6 py-3 rounded-xl hover:opacity-90 transition-opacity"
            >
              Browse All Products
            </Link>
          </div>
        ) : (
          <section className="mb-stack-lg">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-bento-gap">
              {categories.map((c) => {
                const count = countByName.get(c.name) || 0;
                return (
                  <Link
                    key={c.slug}
                    href={`/collections/${c.slug}`}
                    className="group flex flex-col rounded-2xl border border-border-default bg-surface-elevated overflow-hidden hover:border-brand-primary/40 hover:shadow-sm transition-all"
                  >
                    {/* No per-collection image field exists yet — a consistent
                        neutral placeholder, not a borrowed or fabricated photo. */}
                    <div className="relative aspect-[4/3] bg-surface-secondary flex items-center justify-center overflow-hidden">
                      <span className="material-symbols-outlined text-brand-primary/40 text-[56px] transition-transform duration-500 group-hover:scale-110">
                        checkroom
                      </span>
                    </div>
                    <div className="p-5 flex items-center justify-between gap-3">
                      <div className="min-w-0">
                        <h3 className="font-headline-md text-headline-md text-text-primary group-hover:text-brand-primary transition-colors truncate">
                          {c.name}
                        </h3>
                        <p className="font-label-md text-label-md text-text-secondary mt-0.5">
                          {count} {count === 1 ? "product" : "products"}
                        </p>
                      </div>
                      <span className="material-symbols-outlined text-brand-primary text-[20px] shrink-0">
                        arrow_forward
                      </span>
                    </div>
                  </Link>
                );
              })}
            </div>
          </section>
        )}

        {/* Shop by gender/newest — real, already-established routes, not a
            duplicate of the Shop All filter sidebar. */}
        <section className="mb-stack-lg">
          <h2 className="font-headline-lg text-headline-lg text-text-primary mb-stack-sm text-center">Shop By</h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-bento-gap">
            {SHOP_BY.map((s) => (
              <Link
                key={s.href}
                href={s.href}
                className="group flex items-center gap-4 rounded-2xl border border-border-default bg-surface-elevated p-6 hover:border-brand-primary/40 hover:shadow-sm transition-all"
              >
                <span className="flex items-center justify-center w-12 h-12 rounded-full bg-brand-primary/10 text-brand-primary shrink-0">
                  <span className="material-symbols-outlined text-[24px]">{s.icon}</span>
                </span>
                <span className="font-headline-md text-headline-md text-text-primary group-hover:text-brand-primary transition-colors">
                  {s.label}
                </span>
              </Link>
            ))}
          </div>
        </section>

        {/* Editorial closing CTA — real route, no promotional claims. */}
        <section className="border border-border-default rounded-2xl bg-surface-secondary p-8 md:p-10 flex flex-col md:flex-row items-center justify-between gap-6 text-center md:text-left">
          <div>
            <p className="font-headline-lg text-headline-lg text-text-primary mb-1">Not sure where to start?</p>
            <p className="font-body-sm text-body-sm text-text-secondary">Browse everything we currently have in stock.</p>
          </div>
          <Link
            href="/products"
            className="bg-brand-primary text-white font-button text-button h-12 px-6 rounded-xl hover:opacity-90 transition-opacity flex items-center gap-2 whitespace-nowrap shrink-0"
          >
            Shop All
            <span className="material-symbols-outlined text-[18px]">arrow_forward</span>
          </Link>
        </section>
      </main>
      <InternalTrustStrip />
    </>
  );
}
