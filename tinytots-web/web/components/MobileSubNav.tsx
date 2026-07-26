"use client";

import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";

// Small mobile-only sub-bar with a Back and Home button, shown under the
// main header on every page except the homepage (where "back"/"home"
// don't mean anything useful). Desktop already has full nav, so this is
// md:hidden.
export default function MobileSubNav() {
  const router = useRouter();
  const pathname = usePathname();

  if (pathname === "/") return null;

  return (
    <div className="md:hidden flex items-center gap-2 px-margin-mobile py-2 border-b border-outline-variant/20 bg-surface/80 backdrop-blur-md">
      <button
        onClick={() => router.back()}
        aria-label="Go back"
        className="flex items-center gap-1 text-on-surface-variant hover:text-primary px-2 py-1 rounded-lg"
      >
        <span className="material-symbols-outlined text-[20px]">arrow_back</span>
        <span className="font-label-md text-label-md">Back</span>
      </button>
      <Link
        href="/"
        aria-label="Go home"
        className="flex items-center gap-1 text-on-surface-variant hover:text-primary px-2 py-1 rounded-lg"
      >
        <span className="material-symbols-outlined text-[20px]">home</span>
        <span className="font-label-md text-label-md">Home</span>
      </Link>
    </div>
  );
}
