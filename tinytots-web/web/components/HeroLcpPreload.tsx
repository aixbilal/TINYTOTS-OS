import type { ReactNode } from "react";
import { getImageProps } from "next/image";

/**
 * Media-scoped LCP preloads so desktop and mobile each get their own high-priority
 * hero image without the other viewport stealing the bandwidth.
 */
export default function HeroLcpPreload({
  desktopUrl,
  mobileUrl,
}: {
  desktopUrl?: string | null;
  mobileUrl?: string | null;
}) {
  const desktop = (desktopUrl || mobileUrl || "").trim();
  const mobile = (mobileUrl || desktopUrl || "").trim();
  if (!desktop && !mobile) return null;

  const links: ReactNode[] = [];

  if (mobile) {
    const { props } = getImageProps({
      src: mobile,
      alt: "",
      width: 828,
      height: 720,
      quality: 75,
      sizes: "100vw",
    });
    links.push(
      <link
        key="hero-lcp-mobile"
        rel="preload"
        as="image"
        imageSrcSet={props.srcSet}
        imageSizes={props.sizes}
        media="(max-width: 767px)"
        fetchPriority="high"
      />
    );
  }

  if (desktop) {
    const { props } = getImageProps({
      src: desktop,
      alt: "",
      width: 1920,
      height: 1080,
      quality: 75,
      sizes: "100vw",
    });
    links.push(
      <link
        key="hero-lcp-desktop"
        rel="preload"
        as="image"
        imageSrcSet={props.srcSet}
        imageSizes={props.sizes}
        media="(min-width: 768px)"
        fetchPriority="high"
      />
    );
  }

  return <>{links}</>;
}
