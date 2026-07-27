import Link from "next/link";

export default function NotFound() {
  return (
    <main className="max-w-container-max mx-auto w-full px-margin-mobile md:px-margin-desktop py-stack-lg min-h-[60vh] flex flex-col items-center justify-center text-center gap-6">
      <span className="material-symbols-outlined text-primary text-[64px]">search_off</span>
      <div>
        <h1 className="font-display-lg text-display-lg text-on-surface mb-3">404</h1>
        <p className="font-headline-md text-headline-md text-on-surface mb-2">
          We couldn't find that page.
        </p>
        <p className="font-body-md text-body-md text-on-surface-variant max-w-md mx-auto">
          The page you're looking for may have moved or no longer exists. Let's get you back on track.
        </p>
      </div>
      <div className="flex flex-wrap gap-4 justify-center">
        <Link
          href="/"
          className="bg-primary-container text-on-primary font-button text-button h-12 px-6 rounded-xl hover:opacity-90 transition-opacity flex items-center gap-2"
        >
          <span className="material-symbols-outlined text-[18px]">home</span> Back to Home
        </Link>
        <Link
          href="/products"
          className="border border-outline font-button text-button h-12 px-6 rounded-xl hover:bg-surface-container-high transition-colors flex items-center gap-2 text-on-surface"
        >
          Shop All
        </Link>
      </div>
    </main>
  );
}
