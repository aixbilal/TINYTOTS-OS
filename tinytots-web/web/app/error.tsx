"use client";

import { useEffect } from "react";
import Link from "next/link";

/**
 * Route-level error boundary. Catches render/data errors in Server and Client
 * Components below the root layout (more likely now that the storefront pages
 * render dynamically against Supabase) and shows a branded recovery screen
 * instead of a raw Next error page. No error details are shown to the user.
 */
export default function RouteError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Surface to the platform log without leaking anything to the UI.
    console.error("Route error boundary:", error.digest ?? error.message);
  }, [error]);

  return (
    <main className="max-w-container-max mx-auto w-full px-margin-mobile md:px-margin-desktop py-stack-lg min-h-[60vh] flex flex-col items-center justify-center text-center gap-6">
      <span className="material-symbols-outlined text-brand-primary text-[64px]">error</span>
      <div>
        <h1 className="font-display-lg text-display-lg text-text-primary mb-3">
          Something went wrong
        </h1>
        <p className="font-body-md text-body-md text-text-secondary max-w-md mx-auto">
          We hit a problem loading this page. This is usually temporary — please try again,
          or head back to the homepage.
        </p>
      </div>
      <div className="flex flex-wrap gap-4 justify-center">
        <button
          type="button"
          onClick={reset}
          className="bg-brand-primary text-white font-button text-button h-12 px-6 rounded-xl hover:opacity-90 transition-opacity flex items-center gap-2"
        >
          <span className="material-symbols-outlined text-[18px]">refresh</span> Try again
        </button>
        <Link
          href="/"
          className="border border-border-strong font-button text-button h-12 px-6 rounded-xl hover:bg-surface-tertiary transition-colors flex items-center gap-2 text-text-primary"
        >
          <span className="material-symbols-outlined text-[18px]">home</span> Back to Home
        </Link>
      </div>
    </main>
  );
}
