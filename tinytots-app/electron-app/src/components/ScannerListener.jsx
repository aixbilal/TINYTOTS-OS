import { useEffect, useRef } from "react";

// Acts as a keyboard-wedge listener: 2D scanners (like the BPOVO scanners)
// type the decoded value + Enter as fast keystrokes. We buffer characters
// and treat a fast "Enter" as "a scan just finished".
//
// IMPORTANT: this used to import a static local product file and push a
// differently-shaped cart item (`quantity`/`id`) than the rest of the app
// uses (`qty`/`variant_id`) -- meaning a scan would never actually match
// anything real and, even if it did, would silently corrupt the cart.
// Fixed by taking the live `products` list and reusing the exact same
// `onScan` callback the manual "click to add" and search-add paths use.
export default function ScannerListener({ products, onScan }) {
  const scanBuffer = useRef("");
  const lastScan = useRef({ code: "", time: 0 });

  useEffect(() => {
    function handleKeyDown(event) {
      const tag = document.activeElement?.tagName;
      if (tag === "INPUT" || tag === "TEXTAREA") return;

      if (event.key === "Enter") {
        const scannedCode = scanBuffer.current.trim();
        scanBuffer.current = "";

        if (!scannedCode) return;

        const now = Date.now();
        if (scannedCode === lastScan.current.code && now - lastScan.current.time < 500) {
          return;
        }
        lastScan.current = { code: scannedCode, time: now };

        const product = products.find((p) => p.sku === scannedCode);

        if (product) {
          onScan(product);
        } else {
          console.warn(`Scanned code not found in catalog: ${scannedCode}`);
        }
        return;
      }

      if (event.key.length === 1) {
        scanBuffer.current += event.key;
      }
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [products, onScan]);

  return null;
}