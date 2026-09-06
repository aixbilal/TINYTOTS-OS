import type { Metadata } from "next";
import Link from "next/link";
import { pageMetadata, NOINDEX_FOLLOW } from "@/lib/seo";
import { getPublicLocations } from "@/lib/locations/get-public-locations";

export const dynamic = "force-dynamic";

const PAGE_DESCRIPTION =
  "Find TinyTots physical store locations across Pakistan.";

export async function generateMetadata(): Promise<Metadata> {
  return pageMetadata({
    title: "Store Locator",
    description: PAGE_DESCRIPTION,
    path: "/stores",
    // No verified store data with a full address/directions link exists yet —
    // keep this out of search results until an admin adds a real location
    // (see lib/locations/get-public-locations.ts). Remove once populated.
    robots: NOINDEX_FOLLOW,
  });
}

export default async function StoresPage() {
  const locations = await getPublicLocations();

  return (
    <main className="max-w-container-max mx-auto w-full px-margin-mobile md:px-margin-desktop py-stack-lg">
      <nav className="font-body-sm text-body-sm text-text-secondary mb-stack-sm flex items-center gap-2">
        <Link href="/" className="hover:text-brand-primary transition-colors">Home</Link>
        <span className="material-symbols-outlined text-[16px]">chevron_right</span>
        <span className="text-text-primary">Store Locator</span>
      </nav>

      <div className="mb-stack-lg text-center">
        <span className="font-label-md text-label-md uppercase tracking-wider text-text-secondary mb-2 block">
          Visit Us
        </span>
        <h1 className="font-display-xl text-display-md text-text-primary tracking-tight mb-3">
          Find a TinyTots store near you.
        </h1>
        <p className="font-body-md text-body-md text-text-secondary max-w-xl mx-auto">
          {PAGE_DESCRIPTION}
        </p>
      </div>

      {locations.length === 0 ? (
        <div className="border border-border-default rounded-2xl p-10 bg-surface-elevated flex flex-col items-center text-center gap-3 max-w-lg mx-auto">
          <span className="flex items-center justify-center w-12 h-12 rounded-full bg-brand-primary/10 text-brand-primary">
            <span className="material-symbols-outlined text-[24px]">storefront</span>
          </span>
          <p className="font-headline-md text-headline-md text-text-primary">
            Store details coming soon
          </p>
          <p className="font-body-sm text-body-sm text-text-secondary">
            We&apos;re preparing our store location details. In the meantime, reach out
            and our team will help you directly.
          </p>
          <Link
            href="/contact"
            className="mt-2 px-5 py-3 rounded-xl bg-brand-primary text-white font-button text-button hover:opacity-90 transition-opacity"
          >
            Contact Us
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-bento-gap">
          {locations.map((loc) => (
            <div
              key={loc.id}
              className="border border-border-default rounded-2xl p-6 bg-surface-elevated flex flex-col gap-2"
            >
              <span className="flex items-center justify-center w-12 h-12 rounded-full bg-brand-primary/10 text-brand-primary mb-1">
                <span className="material-symbols-outlined text-[24px]">storefront</span>
              </span>
              <p className="font-headline-md text-headline-md text-text-primary">{loc.name}</p>
              {(loc.address || loc.city || loc.region) && (
                <p className="font-body-sm text-body-sm text-text-secondary">
                  {[loc.address, loc.city, loc.region, loc.country].filter(Boolean).join(", ")}
                </p>
              )}
              {loc.directionsUrl && (
                <a
                  href={loc.directionsUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-2 inline-flex items-center gap-2 font-body-sm text-body-sm text-brand-primary hover:underline"
                >
                  <span className="material-symbols-outlined text-[18px]">directions</span>
                  Get Directions
                </a>
              )}
            </div>
          ))}
        </div>
      )}
    </main>
  );
}
