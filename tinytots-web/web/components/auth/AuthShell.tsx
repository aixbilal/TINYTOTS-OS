import Image from "next/image";
import TinyTotsBrand from "@/components/TinyTotsBrand";

/**
 * Dedicated split-screen shell for /login and /signup only — a self-contained
 * account-entry experience, not "storefront page + auth card". SiteShell
 * suppresses the normal header/footer/notice-bar/cart chrome for these two
 * routes and renders this instead; the form column carries the wordmark
 * itself since there's no header to put it in.
 *
 * Desktop split is ~58% form / ~42% visual (58/42 columns below); the visual
 * panel drops out entirely at <lg so mobile is a single, comfortably padded
 * column — no half-height cropped photo competing with the form.
 */
export default function AuthShell({
  children,
  tagline,
}: {
  children: React.ReactNode;
  tagline?: string;
}) {
  return (
    <div className="min-h-dvh flex flex-col lg:flex-row bg-surface-canvas">
      <div className="w-full lg:w-[58%] flex flex-col px-margin-mobile md:px-margin-desktop py-8 lg:py-12">
        <TinyTotsBrand className="mb-8 lg:mb-12" />
        <div className="flex-1 flex items-center justify-center lg:justify-start">
          <div className="w-full max-w-[440px]">{children}</div>
        </div>
      </div>

      <div className="hidden lg:block lg:w-[42%] relative shrink-0">
        <Image
          src="/images/homepage/editorial-story-01.webp"
          alt=""
          fill
          sizes="42vw"
          priority
          className="object-cover object-[38%_center]"
        />
        <div
          className="absolute inset-x-0 bottom-0 h-1/2 pointer-events-none"
          style={{ background: "linear-gradient(to top, rgba(42,38,33,0.55) 0%, rgba(42,38,33,0) 100%)" }}
        />
        <div className="absolute bottom-10 left-10 right-10">
          <p className="font-display-md text-[26px] text-white tracking-tight">TinyTots</p>
          <p className="font-label-md text-label-md uppercase tracking-wider text-white/85 mt-1">
            Timeless for Tiny Hearts
          </p>
          {tagline && <p className="font-body-sm text-body-sm text-white/80 mt-3 max-w-[280px]">{tagline}</p>}
        </div>
      </div>
    </div>
  );
}
