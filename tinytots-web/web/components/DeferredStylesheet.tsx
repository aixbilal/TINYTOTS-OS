"use client";

import { useEffect } from "react";

/**
 * Loads a stylesheet without blocking first paint.
 * Used for Material Symbols (large Google Fonts CSS).
 */
export default function DeferredStylesheet({ href }: { href: string }) {
  useEffect(() => {
    if (document.querySelector(`link[data-deferred-href="${href}"]`)) return;

    const link = document.createElement("link");
    link.rel = "stylesheet";
    link.href = href;
    link.setAttribute("data-deferred-href", href);
    document.head.appendChild(link);
  }, [href]);

  return (
    <link
      rel="preload"
      as="style"
      href={href}
      // Hint the browser early; actual apply happens after hydration above.
    />
  );
}
