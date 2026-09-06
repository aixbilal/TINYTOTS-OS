"use client";

import Script from "next/script";
import { usePathname } from "next/navigation";

/**
 * Loads GA4 and/or Meta Pixel only when the corresponding env IDs are set.
 * No scripts render (and nothing is claimed as active) when IDs are absent.
 *
 * Required env (public, client-readable):
 * - NEXT_PUBLIC_GA_MEASUREMENT_ID  e.g. G-XXXXXXXXXX
 * - NEXT_PUBLIC_META_PIXEL_ID      e.g. 123456789012345
 */
export default function Analytics() {
  const pathname = usePathname();
  // Admin is an internal operational tool, not a marketing/analytics
  // surface — neither Meta Pixel (K.5C) nor GA4 may initialize or fire
  // there. Same route-boundary check SiteShell uses for the storefront
  // chrome exclusion.
  const isAdmin = pathname === "/admin" || pathname?.startsWith("/admin/");

  const gaId = isAdmin ? undefined : process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID?.trim();
  const pixelId = isAdmin ? undefined : process.env.NEXT_PUBLIC_META_PIXEL_ID?.trim();

  if (!gaId && !pixelId) return null;

  return (
    <>
      {gaId ? (
        <>
          <Script
            src={`https://www.googletagmanager.com/gtag/js?id=${gaId}`}
            strategy="lazyOnload"
          />
          <Script id="ga4-init" strategy="lazyOnload">
            {`
              window.dataLayer = window.dataLayer || [];
              function gtag(){dataLayer.push(arguments);}
              gtag('js', new Date());
              gtag('config', '${gaId}');
            `}
          </Script>
        </>
      ) : null}

      {pixelId ? (
        <Script id="meta-pixel" strategy="lazyOnload">
          {`
            !function(f,b,e,v,n,t,s)
            {if(f.fbq)return;n=f.fbq=function(){n.callMethod?
            n.callMethod.apply(n,arguments):n.queue.push(arguments)};
            if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
            n.queue=[];t=b.createElement(e);t.async=!0;
            t.src=v;s=b.getElementsByTagName(e)[0];
            s.parentNode.insertBefore(t,s)}(window, document,'script',
            'https://connect.facebook.net/en_US/fbevents.js');
            fbq('init', '${pixelId}');
            fbq('track', 'PageView');
          `}
        </Script>
      ) : null}
    </>
  );
}
