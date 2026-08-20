import Link from "next/link";
import { supabaseAdmin } from "@/lib/supabase-admin";
import InternalTrustStrip from "@/components/InternalTrustStrip";

// Static-generate — category list changes rarely (admin-managed).
export const revalidate = 3600;

export default async function CollectionsPage() {
  const { data } = await supabaseAdmin
    .from("categories")
    .select("id, name, slug")
    .order("display_order", { ascending: true })
    .order("name", { ascending: true });

  const categories = data || [];

  return (
    <>
      <main className="max-w-container-max mx-auto px-margin-mobile md:px-margin-desktop py-stack-lg">
        <nav className="font-body-sm text-body-sm text-text-secondary mb-stack-sm flex items-center gap-2">
          <Link href="/" className="hover:text-brand-primary transition-colors">Home</Link>
          <span className="material-symbols-outlined text-[16px]">chevron_right</span>
          <span className="text-text-primary">Collections</span>
        </nav>

        <div className="mb-stack-lg max-w-2xl">
          <span className="font-label-md text-label-md uppercase tracking-wider text-text-secondary mb-2 block">
            Collections
          </span>
          <h1 className="font-display-xl text-display-md text-text-primary tracking-tight mb-3">
            Shop by collection.
          </h1>
          <p className="font-body-md text-body-md text-text-secondary">
            Browse our pieces grouped by category — find what you&apos;re looking for, faster.
          </p>
        </div>

        {categories.length === 0 ? (
          <p className="font-body-md text-body-md text-text-secondary">No collections available right now.</p>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 gap-x-6 gap-y-8">
            {categories.map((c) => (
              <Link
                key={c.slug}
                href={`/collections/${c.slug}`}
                className="group flex items-center justify-between gap-3 border border-border-default rounded-xl bg-surface-elevated hover:border-brand-primary/40 hover:shadow-sm transition-all px-5 py-6"
              >
                <span className="font-headline-md text-headline-md text-text-primary group-hover:text-brand-primary transition-colors">
                  {c.name}
                </span>
                <span className="material-symbols-outlined text-brand-primary text-[18px] shrink-0">arrow_forward</span>
              </Link>
            ))}
          </div>
        )}
      </main>
      <InternalTrustStrip />
    </>
  );
}
