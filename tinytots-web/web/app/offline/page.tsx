import Link from "next/link";

export const metadata = {
  title: "You're offline",
  robots: { index: false, follow: false },
};

/**
 * Shown when a navigation request fails while offline and no usable
 * page cache exists. Also linked from cart/checkout for explicit offline UX.
 */
export default function OfflinePage() {
  return (
    <div className="min-h-[60vh] flex flex-col items-center justify-center text-center px-6 py-16">
      <span
        className="material-symbols-outlined text-primary text-[48px] mb-4"
        aria-hidden
      >
        wifi_off
      </span>
      <h1 className="font-display-md text-display-md text-on-surface mb-3">
        You&apos;re offline
      </h1>
      <p className="font-body-md text-body-md text-on-surface-variant max-w-md mb-2">
        Showing cached content where available. Live features like cart,
        checkout, login, and order status need a connection.
      </p>
      <p className="font-body-sm text-body-sm text-on-surface-variant max-w-md mb-8">
        Reconnect and try again — or browse pages you already visited while
        online.
      </p>
      <div className="flex flex-wrap items-center justify-center gap-3">
        <Link
          href="/"
          className="inline-flex items-center bg-primary-container text-on-primary font-button text-button h-12 px-6 rounded-lg hover:bg-primary transition-colors"
        >
          Go to homepage
        </Link>
        <Link
          href="/products"
          className="inline-flex items-center border border-outline-variant text-on-surface font-button text-button h-12 px-6 rounded-lg hover:bg-surface-container-low transition-colors"
        >
          Shop
        </Link>
      </div>
    </div>
  );
}
