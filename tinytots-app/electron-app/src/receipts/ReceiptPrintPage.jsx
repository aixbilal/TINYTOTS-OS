// Receipt Print Page.jsx
import { useEffect, useState } from "react";
import ReceiptTemplate from "./ReceiptTemplate";

export default function ReceiptPrintPage() {
  const [sale, setSale] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let mounted = true;

    async function loadReceipt() {
      try {
        if (!window.electron?.getReceipt) {
          throw new Error("Electron receipt API is unavailable.");
        }

        const receipt = await window.electron.getReceipt();

        if (mounted) {
          setSale(receipt || null);
        }
      } catch (err) {
        console.error("Failed to load receipt:", err);

        if (mounted) {
          setError(err.message);
          setSale(null);
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    }

    loadReceipt();

    return () => {
      mounted = false;
    };
  }, []);

  // Tell Electron it's safe to print, but only once the receipt has
  // actually loaded and painted to the screen. If there's no sale
  // (error case), we deliberately don't call ready — main.js's
  // 10s timeout will surface that failure back to the checkout flow
  // instead of printing a blank page.
  useEffect(() => {
    if (loading || !sale) return;

    if (!window.electron?.receiptReady) {
      console.error("receiptReady API is unavailable.");
      return;
    }

    // Wait two animation frames so the browser has actually painted
    // the DOM before telling Electron it's safe to print.
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        window.electron.receiptReady();
      });
    });
  }, [loading, sale]);

  if (loading) {
    return (
      <div
        style={{
          padding: "20px",
          fontFamily: "Arial, sans-serif",
          textAlign: "center",
        }}
      >
        Loading receipt...
      </div>
    );
  }

  if (!sale) {
    return (
      <div
        style={{
          padding: "20px",
          fontFamily: "Arial, sans-serif",
          textAlign: "center",
        }}
      >
        {error ? `Error: ${error}` : "No receipt available."}
      </div>
    );
  }

  return <ReceiptTemplate sale={sale} />;
}
