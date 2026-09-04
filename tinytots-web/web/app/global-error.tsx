"use client";

import { useEffect } from "react";

/**
 * Last-resort boundary for errors thrown in the root layout itself. It
 * replaces the whole document, so it ships its own <html>/<body> and inline
 * styles (globals.css / fonts may not have applied). No error details reach
 * the UI.
 */
export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Global error boundary:", error.digest ?? error.message);
  }, [error]);

  return (
    <html lang="en">
      <body
        style={{
          margin: 0,
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "#f6f1e8",
          color: "#4a4f44",
          fontFamily:
            "Inter, ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, sans-serif",
          padding: "24px",
        }}
      >
        <main style={{ maxWidth: "28rem", textAlign: "center" }}>
          <h1 style={{ fontSize: "2rem", margin: "0 0 0.75rem", color: "#4a4f44" }}>
            Something went wrong
          </h1>
          <p style={{ fontSize: "1rem", lineHeight: 1.6, margin: "0 0 1.5rem", color: "#675949" }}>
            We hit a problem loading TinyTots. Please try again in a moment.
          </p>
          <button
            type="button"
            onClick={reset}
            style={{
              background: "#8f5030",
              color: "#fff",
              border: "none",
              borderRadius: "14px",
              height: "48px",
              padding: "0 24px",
              fontSize: "1rem",
              cursor: "pointer",
            }}
          >
            Try again
          </button>
        </main>
      </body>
    </html>
  );
}
