import { useEffect, useRef, useState } from "react";
import { Printer, Download, QrCode, Barcode as BarcodeIcon } from "lucide-react";
import { generateQrPreview, generateBarcodePreview } from "../../utils/codeGenerators";

const LABEL_PRESETS = [
  { label: "25 × 27 mm (standard tag)", w: 25, h: 30 },
  { label: "25 × 20 mm (small tag)", w: 20, h: 25 },
  { label: "20 × 15 mm (x small tag)", w: 15, h: 20 },
];

export default function BarcodeQrPanel({ product, allVariants, selectedIds, onSelectAll }) {
  const [selectionMode, setSelectionMode] = useState("all"); // "all" | "custom"
  const [codeType, setCodeType] = useState("qr");
  const [printers, setPrinters] = useState([]);
  const [printerName, setPrinterName] = useState(
    () => localStorage.getItem("preferredPrinter") || ""
  );
  const [labelPreset, setLabelPreset] = useState(0);
  const [quantities, setQuantities] = useState({}); // { [variantId]: qty }
  const [previewUrl, setPreviewUrl] = useState(null);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const canvasRef = useRef(null);

  const effectiveIds = selectionMode === "all" ? allVariants.map((v) => v.id) : selectedIds;

  useEffect(() => {
    setQuantities((prev) => {
      const next = {};
      effectiveIds.forEach((id) => {
        const v = allVariants.find((v) => v.id === id);
        next[id] = prev[id] ?? (v?.stock ?? 0);
      });
      return next;
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [effectiveIds.join(",")]);

  useEffect(() => {
    setQuantities((prev) => {
      const next = {};
      effectiveIds.forEach((id) => {
        const v = allVariants.find((v) => v.id === id);
        next[id] = prev[id] ?? (v?.stock ?? 0);
      });
      return next;
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [effectiveIds.join(",")]);

  useEffect(() => {
    fetch("http://localhost:3000/api/printers")
    .then(async (response) => {
      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
      const text = await response.text();
      if (!text) throw new Error("Empty response from server");
      return JSON.parse(text);
    })
    .then((data) => {
      setPrinters(data.printers || data || []);
    })
    .catch((err) => console.error("Fetch Error:", err));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (printerName) localStorage.setItem("preferredPrinter", printerName);
  }, [printerName]);

  useEffect(() => {
    async function buildPreview() {
      const firstVariant = allVariants.find((v) => effectiveIds.includes(v.id)) || allVariants[0];
      if (!firstVariant) {
        setPreviewUrl(null);
        return;
      }
      // Labels are customer-facing, so they must carry the Public Code (V-{id}),
      // never the confidential internal SKU.
      const code = firstVariant.public_code || `V-${firstVariant.id}`;
      if (codeType === "qr") {
        const url = await generateQrPreview(code);
        setPreviewUrl(url);
      } else if (canvasRef.current) {
        const url = generateBarcodePreview(canvasRef.current, code);
        setPreviewUrl(url);
      }
    }
    buildPreview();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [codeType, effectiveIds.join(","), allVariants.length]);

  async function handlePrint(download = false) {
    if (!effectiveIds.length) {
      setMessage("Select at least one variant first.");
      return;
    }
    setBusy(true);
    setMessage("");
    try {
      const preset = LABEL_PRESETS[labelPreset];
      const body = {
        variantIds: effectiveIds,
        codeType,
        labelWidthMm: preset.w,
        labelHeightMm: preset.h,
        quantities,
        ...(download ? {} : { printerName }),
      };

      const res = await fetch("http://localhost:5173/api/print-labels", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      if (download) {
        const blob = await res.blob();
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `labels-${product?.sku || "product"}.pdf`;
        a.click();
        URL.revokeObjectURL(url);
        setMessage("PDF downloaded.");
      } else {
        const data = await res.json();
        if (!data.success) throw new Error(data.error || data.message);
        setMessage(`Sent ${effectiveIds.length} label(s) to ${printerName}.`);
      }
    } catch (err) {
      setMessage(`Failed: ${err.message}`);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div
      className="rounded-2xl border border-white/40 backdrop-blur-xl p-6 sticky top-6"
      style={{
        background: "linear-gradient(160deg, rgba(255,255,255,0.30) 0%, rgba(255,255,255,0.12) 100%)",
        boxShadow: "inset 0 1px 1px rgba(255,255,255,0.5)",
      }}
    >
      <h3 className="font-display text-xl text-maroon-800 mb-1">Generate Barcode / QR</h3>
      <p className="text-sm text-ink-800 mb-5">
        Select variants to generate Barcode or QR codes for easy tagging.
      </p>

      <p className="text-sm font-medium text-ink-900 mb-2">Select Variants</p>
      <div className="space-y-2 mb-5">
        <label className="flex items-center gap-2 text-sm cursor-pointer text-ink-900">
          <input
            type="radio"
            checked={selectionMode === "all"}
            onChange={() => setSelectionMode("all")}
          />
          All Variants ({allVariants.length})
        </label>
        <label className="flex items-center gap-2 text-sm cursor-pointer text-ink-900">
          <input
            type="radio"
            checked={selectionMode === "custom"}
            onChange={() => setSelectionMode("custom")}
          />
          Custom Selection ({selectedIds.length} checked in table)
        </label>
      </div>
      <p className="text-sm font-medium text-ink-900 mb-2">
        Label Quantities <span className="font-normal text-ink-800/70">(defaults to stock, editable)</span>
      </p>
      <div className="max-h-32 overflow-y-auto space-y-1 mb-2 text-xs pr-1">
        {effectiveIds.map((id) => {
          const v = allVariants.find((v) => v.id === id);
          if (!v) return null;
          return (
            <div key={id} className="flex items-center justify-between gap-2">
              <span className="text-ink-900 truncate">{v.color} / {v.size}</span>
              <input
                type="number"
                min={0}
                value={quantities[id] ?? 0}
                onChange={(e) =>
                  setQuantities((q) => ({ ...q, [id]: parseInt(e.target.value, 10) || 0 }))
                }
                className="w-14 border border-white/40 bg-white/20 rounded px-1 py-0.5 text-right text-ink-900"
              />
            </div>
          );
        })}
      </div>
      <p className="text-xs text-ink-800/70 mb-5">
        Total labels: {Object.values(quantities).reduce((a, b) => a + (b || 0), 0)}
      </p>
      <p className="text-sm font-medium text-ink-900 mb-2">Choose Code Type</p>
      <div className="grid grid-cols-2 gap-2 mb-5">
        <button
          onClick={() => setCodeType("qr")}
          className={`flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-medium transition-colors ${
            codeType === "qr"
              ? "bg-maroon-700 text-cream-50"
              : "border border-white/40 text-ink-900 hover:bg-white/20"
          }`}
        >
          <QrCode size={16} /> QR Code
        </button>
        <button
          onClick={() => setCodeType("barcode")}
          className={`flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-medium transition-colors ${
            codeType === "barcode"
              ? "bg-maroon-700 text-cream-50"
              : "border border-white/40 text-ink-900 hover:bg-white/20"
          }`}
        >
          <BarcodeIcon size={16} /> Barcode
        </button>
      </div>

      <p className="text-sm font-medium text-ink-900 mb-2">Preview</p>
      <div className="border border-white/40 rounded-xl h-40 flex items-center justify-center mb-5 bg-white/20 backdrop-blur-sm">
        {previewUrl ? (
          <img src={previewUrl} alt="Code preview" className="max-h-32" />
        ) : (
          <p className="text-xs text-ink-800/60">Select a variant to preview</p>
        )}
        <canvas ref={canvasRef} className="hidden" />
      </div>

      <p className="text-sm font-medium text-ink-900 mb-2">Label Size</p>
      <select
        value={labelPreset}
        onChange={(e) => setLabelPreset(Number(e.target.value))}
        className="w-full border border-white/40 bg-white/20 rounded-lg px-3 py-2 text-sm mb-4 text-ink-900"
      >
        {LABEL_PRESETS.map((p, i) => (
          <option key={p.label} value={i}>{p.label}</option>
        ))}
      </select>

      <p className="text-sm font-medium text-ink-900 mb-2">Printer</p>
      <select
        value={printerName}
        onChange={(e) => setPrinterName(e.target.value)}
        className="w-full border border-white/40 bg-white/20 rounded-lg px-3 py-2 text-sm mb-5 text-ink-900"
      >
        <option value="">Select a printer…</option>
        {printers.map((p) => (
          <option key={p.name} value={p.name}>
            {p.name} {/3600/i.test(p.name) ? "(EML-200L (2inch))" : ""}{p.isDefault ? " — default" : ""}
          </option>
        ))}
      </select>

      <button
        onClick={() => handlePrint(false)}
        disabled={busy || !printerName}
        className="w-full flex items-center justify-center gap-2 bg-maroon-700 text-cream-50 font-medium py-3 rounded-lg mb-2.5 hover:bg-maroon-800 disabled:opacity-50"
      >
        <Printer size={16} />
        {busy ? "Sending…" : `Print ${codeType === "qr" ? "QR Codes" : "Barcodes"}`}
      </button>
      <button
        onClick={() => handlePrint(true)}
        disabled={busy}
        className="w-full flex items-center justify-center gap-2 border border-white/40 text-ink-900 font-medium py-3 rounded-lg hover:bg-white/20 disabled:opacity-50"
      >
        <Download size={16} /> Download PDF
      </button>

      {message && <p className="text-xs text-ink-800 mt-3 text-center">{message}</p>}

      {!printers.length && (
        <p className="text-xs text-maroon-700 mt-3">
          No printers detected. Make sure the EML-200L (2inch) driver is installed and the printer is powered on.
        </p>
      )}
    </div>
  );
}