import { useEffect, useRef, useState } from "react";
import { Printer, Download, QrCode, Barcode as BarcodeIcon } from "lucide-react";
import { generateQrPreview, generateBarcodePreview } from "../../utils/codeGenerators";
import Button from "../ui/Button";
import { apiFetch } from "../../services/api";

const LABEL_PRESETS = [
  { label: "25 × 27 mm (standard tag)", w: 25, h: 30 },
  { label: "25 × 20 mm (small tag)", w: 20, h: 25 },
  { label: "20 × 15 mm (x small tag)", w: 15, h: 20 },
];

export default function BarcodeQrPanel({ product, allVariants, selectedIds }) {
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
        const v = allVariants.find((x) => x.id === id);
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
  }, []);

  useEffect(() => {
    if (printerName) localStorage.setItem("preferredPrinter", printerName);
  }, [printerName]);

  useEffect(() => {
    async function buildPreview() {
      const firstVariant =
        allVariants.find((v) => effectiveIds.includes(v.id)) || allVariants[0];
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

      const res = await apiFetch("/api/print-labels", {
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

  const fieldLabel = "type-field-label text-text-secondary mb-2";
  const selectCls =
    "w-full border border-border-default bg-surface-panel rounded-md px-3 py-2 type-body-sm text-text-primary outline-none transition-[border-color,box-shadow] focus:border-brand focus:ring-2 focus:ring-brand/45";

  return (
    <div className="rounded-lg border border-border-default bg-surface-panel p-5 sticky top-2">
      <h3 className="type-section text-text-primary mb-1">Generate Barcode / QR</h3>
      <p className="type-body-sm text-text-secondary mb-4">
        Select variants to generate Barcode or QR codes for easy tagging.
      </p>

      <p className={fieldLabel}>Select Variants</p>
      <div className="space-y-2 mb-4">
        <label className="type-body-sm flex items-center gap-2 cursor-pointer text-text-primary">
          <input type="radio" checked={selectionMode === "all"} onChange={() => setSelectionMode("all")} />
          All Variants ({allVariants.length})
        </label>
        <label className="type-body-sm flex items-center gap-2 cursor-pointer text-text-primary">
          <input type="radio" checked={selectionMode === "custom"} onChange={() => setSelectionMode("custom")} />
          Custom Selection ({selectedIds.length} checked in table)
        </label>
      </div>

      <p className={fieldLabel}>
        Label Quantities <span className="font-normal text-text-muted">(defaults to stock, editable)</span>
      </p>
      <div className="max-h-32 overflow-y-auto space-y-1 mb-2 type-caption pr-1">
        {effectiveIds.map((id) => {
          const v = allVariants.find((x) => x.id === id);
          if (!v) return null;
          return (
            <div key={id} className="flex items-center justify-between gap-2">
              <span className="text-text-primary truncate capitalize">{v.color} / {v.size}</span>
              <input
                type="number"
                min={0}
                value={quantities[id] ?? 0}
                onChange={(e) =>
                  setQuantities((q) => ({ ...q, [id]: parseInt(e.target.value, 10) || 0 }))
                }
                className="w-14 border border-border-default bg-surface-panel rounded px-1 py-0.5 text-right text-text-primary outline-none focus:border-brand"
              />
            </div>
          );
        })}
      </div>
      <p className="type-caption text-text-muted mb-4">
        Total labels: {Object.values(quantities).reduce((a, b) => a + (b || 0), 0)}
      </p>

      <p className={fieldLabel}>Choose Code Type</p>
      <div className="grid grid-cols-2 gap-2 mb-4">
        {[
          ["qr", "QR Code", QrCode],
          ["barcode", "Barcode", BarcodeIcon],
        ].map(([val, label, Icon]) => (
          <button
            key={val}
            onClick={() => setCodeType(val)}
            className={`flex items-center justify-center gap-2 py-2.5 rounded-md type-body-sm font-medium transition-colors ${
              codeType === val
                ? "bg-brand text-text-inverse"
                : "border border-border-default text-text-secondary hover:text-text-primary hover:bg-surface-sunken"
            }`}
          >
            <Icon size={16} /> {label}
          </button>
        ))}
      </div>

      <p className={fieldLabel}>Preview</p>
      <div className="border border-border-default rounded-lg h-40 flex items-center justify-center mb-4 bg-pure-white">
        {previewUrl ? (
          <img src={previewUrl} alt="Code preview" className="max-h-32" />
        ) : (
          <p className="type-caption text-text-muted">Select a variant to preview</p>
        )}
        <canvas ref={canvasRef} className="hidden" />
      </div>

      <p className={fieldLabel}>Label Size</p>
      <select
        value={labelPreset}
        onChange={(e) => setLabelPreset(Number(e.target.value))}
        className={`${selectCls} mb-4`}
      >
        {LABEL_PRESETS.map((p, i) => (
          <option key={p.label} value={i}>{p.label}</option>
        ))}
      </select>

      <p className={fieldLabel}>Printer</p>
      <select
        value={printerName}
        onChange={(e) => setPrinterName(e.target.value)}
        className={`${selectCls} mb-4`}
      >
        <option value="">Select a printer…</option>
        {printers.map((p) => (
          <option key={p.name} value={p.name}>
            {p.name} {/3600/i.test(p.name) ? "(EML-200L (2inch))" : ""}{p.isDefault ? " — default" : ""}
          </option>
        ))}
      </select>

      <Button
        onClick={() => handlePrint(false)}
        disabled={busy || !printerName}
        loading={busy}
        size="lg"
        className="w-full mb-2"
      >
        <Printer size={16} />
        {busy ? "Sending…" : `Print ${codeType === "qr" ? "QR Codes" : "Barcodes"}`}
      </Button>
      <Button
        variant="secondary"
        onClick={() => handlePrint(true)}
        disabled={busy}
        size="lg"
        className="w-full"
      >
        <Download size={16} /> Download PDF
      </Button>

      {message && <p className="type-caption text-text-secondary mt-3 text-center">{message}</p>}

      {!printers.length && (
        <p className="type-caption text-warning-text mt-3">
          No label printer detected. Make sure your label printer's driver is installed and the printer is powered on.
        </p>
      )}
    </div>
  );
}
