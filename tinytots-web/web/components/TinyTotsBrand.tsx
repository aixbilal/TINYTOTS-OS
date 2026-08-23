import Link from "next/link";

// Single source of truth for the TinyTots wordmark + tagline so the
// Homepage and Internal headers render an identical brand identity —
// only their position in the header grid differs, never the mark itself.
export default function TinyTotsBrand({ className = "" }: { className?: string }) {
  return (
    <Link href="/" className={`flex flex-col items-center leading-none ${className}`}>
      <span className="font-display-md text-display-md text-text-primary tracking-[0.08em] uppercase">TinyTots</span>
      <span className="hidden md:block font-label-md text-label-md text-text-secondary uppercase tracking-wider mt-0.5">
        Timeless for tiny hearts
      </span>
    </Link>
  );
}
