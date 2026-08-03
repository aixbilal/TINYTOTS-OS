"use client";

import { useEffect } from "react";

/**
 * If Material Symbols never becomes available (blocked / very slow), hide
 * ligature ASCII so the header doesn't show truncated "ho"/"se"/"sh" junk.
 */
export default function IconFontGuard() {
  useEffect(() => {
    let cancelled = false;
    const root = document.documentElement;

    const markFailed = () => {
      if (!cancelled) root.classList.add("icons-failed");
    };
    const markReady = () => {
      if (!cancelled) root.classList.remove("icons-failed");
    };

    if (!("fonts" in document)) return;

    const timeout = window.setTimeout(markFailed, 4000);

    document.fonts
      .load('24px "Material Symbols Outlined"')
      .then((faces) => {
        window.clearTimeout(timeout);
        if (faces.length > 0 && document.fonts.check('24px "Material Symbols Outlined"')) {
          markReady();
        } else {
          markFailed();
        }
      })
      .catch(() => {
        window.clearTimeout(timeout);
        markFailed();
      });

    return () => {
      cancelled = true;
      window.clearTimeout(timeout);
    };
  }, []);

  return null;
}
