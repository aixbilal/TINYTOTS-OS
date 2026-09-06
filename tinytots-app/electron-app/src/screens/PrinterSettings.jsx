import { useCallback, useEffect, useState } from "react";
import { Printer, RefreshCw, Check } from "lucide-react";
import Button from "../components/ui/Button";
import Badge from "../components/ui/Badge";
import { PageHeader } from "../components/ui/Layout";
import { LoadingState, EmptyState, ErrorState } from "../components/ui/States";

/**
 * Machine-local receipt-printer selection. The choice is stored by the
 * Electron main process in userData/printer-config.json (never in Supabase)
 * and is used by both the offline print path and the backend reprint path.
 */
export default function PrinterSettings() {
  const bridge = typeof window !== "undefined" ? window.electron : null;

  const [printers, setPrinters] = useState(null); // null = loading
  const [loadError, setLoadError] = useState(false);
  const [saved, setSaved] = useState(null); // configured printer name | null
  const [selected, setSelected] = useState("");
  const [saving, setSaving] = useState(false);
  const [savedFlash, setSavedFlash] = useState(false);

  const load = useCallback(() => {
    if (!bridge?.listPrinters || !bridge?.getReceiptPrinter) {
      Promise.resolve().then(() => {
        setPrinters([]);
        setLoadError(true);
      });
      return;
    }
    Promise.all([bridge.listPrinters(), bridge.getReceiptPrinter()])
      .then(([listRes, prefRes]) => {
        if (listRes?.success) {
          setPrinters(listRes.printers || []);
          setLoadError(false);
        } else {
          setPrinters([]);
          setLoadError(true);
        }
        if (prefRes?.success) {
          setSaved(prefRes.receiptPrinter || null);
          setSelected(prefRes.receiptPrinter || "");
        }
      })
      .catch(() => setLoadError(true));
  }, [bridge]);

  useEffect(() => {
    load();
  }, [load]);

  function refresh() {
    setPrinters(null);
    setLoadError(false);
    load();
  }

  async function handleSave() {
    if (!bridge?.setReceiptPrinter || !selected) return;
    setSaving(true);
    setSavedFlash(false);
    try {
      const res = await bridge.setReceiptPrinter(selected);
      if (res?.success) {
        setSaved(res.receiptPrinter || null);
        setSavedFlash(true);
        setTimeout(() => setSavedFlash(false), 2500);
      }
    } finally {
      setSaving(false);
    }
  }

  const dirty = selected && selected !== saved;

  // Real discovery only (§44): cross-check the configured printer against the
  // printers actually installed on this machine right now. No fake status,
  // no hardcoded model.
  const canVerify = Array.isArray(printers) && !loadError;
  const savedAvailable = canVerify && saved
    ? printers.some((p) => p.name === saved)
    : null;
  const printerState = !saved
    ? "unconfigured"
    : savedAvailable === false
    ? "unavailable"
    : savedAvailable === true
    ? "ready"
    : "configured"; // configured but availability couldn't be checked

  const STATE_UI = {
    ready: { badge: "success", label: "Configured & available", tint: "bg-success/[0.07]", well: "bg-success/12 text-success-text" },
    unavailable: { badge: "warning", label: "Configured — not detected", tint: "bg-warning/[0.08]", well: "bg-warning/14 text-warning-text" },
    configured: { badge: "neutral", label: "Configured", tint: "bg-surface-elevated/50", well: "bg-brand-soft text-brand" },
    unconfigured: { badge: "error", label: "Not configured", tint: "bg-error/[0.06]", well: "bg-error/10 text-error-text" },
  };
  const ui = STATE_UI[printerState];

  return (
    <div className="mx-auto max-w-[720px] flex flex-col gap-5">
      <PageHeader
        title="Printer Settings"
        description="Choose which installed printer prints receipts on this machine."
      >
        <Button variant="secondary" onClick={refresh}>
          <RefreshCw size={14} /> Rescan
        </Button>
      </PageHeader>

      {/* Current selection — soft semantic tint, no hard outline (§45) */}
      <div className={`rounded-lg p-5 ${ui.tint}`}>
        <div className="flex items-start gap-3">
          <span className={`w-9 h-9 rounded-md flex items-center justify-center shrink-0 ${ui.well}`}>
            <Printer size={17} />
          </span>
          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="type-section text-text-primary">Current receipt printer</h2>
              <Badge variant={ui.badge}>{ui.label}</Badge>
            </div>
            {saved ? (
              <p className="type-body-sm text-text-primary mt-1 truncate">{saved}</p>
            ) : (
              <p className="type-body-sm text-text-secondary mt-1">
                No receipt printer selected — receipt printing is disabled until
                you choose one below.
              </p>
            )}
            {printerState === "unavailable" && (
              <p className="type-caption text-warning-text mt-1">
                This printer isn&apos;t among the printers installed on this PC
                right now. Reconnect it, or pick another below.
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Installed printers */}
      <p className="type-field-label text-text-secondary -mb-1">Installed on this PC</p>
      {loadError ? (
        <ErrorState
          title="Couldn't list printers"
          description="Printer discovery is only available inside the desktop app."
          onRetry={refresh}
        />
      ) : printers === null ? (
        <LoadingState label="Scanning for printers…" />
      ) : printers.length === 0 ? (
        <EmptyState
          icon={Printer}
          title="No printers found"
          description="Install and power on your receipt printer, then rescan."
        />
      ) : (
        <div className="rounded-lg bg-surface-panel shadow-sm divide-y divide-border-default overflow-hidden">
          {printers.map((p) => {
            const isSelected = selected === p.name;
            return (
              <button
                key={p.name}
                onClick={() => setSelected(p.name)}
                className={`w-full flex items-center justify-between gap-3 px-4 py-3 text-left transition-colors ${
                  isSelected
                    ? "bg-surface-elevated"
                    : "hover:bg-surface-elevated/60"
                }`}
              >
                <span className="min-w-0">
                  <span className="type-body-sm font-medium text-text-primary block truncate">
                    {p.name}
                  </span>
                  {p.isDefault && (
                    <span className="type-caption text-text-muted">
                      Windows default
                    </span>
                  )}
                </span>
                {isSelected && <Check size={16} className="text-brand shrink-0" />}
              </button>
            );
          })}
        </div>
      )}

      <div className="flex items-center gap-3">
        <Button onClick={handleSave} disabled={!dirty || saving} loading={saving}>
          {saving ? "Saving…" : "Save receipt printer"}
        </Button>
        {savedFlash && (
          <span className="type-body-sm text-success-text inline-flex items-center gap-1.5">
            <Check size={14} /> Saved
          </span>
        )}
      </div>
    </div>
  );
}
