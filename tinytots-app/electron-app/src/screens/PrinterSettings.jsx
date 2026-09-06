import { useCallback, useEffect, useState } from "react";
import { Printer, RefreshCw, Check } from "lucide-react";
import Button from "../components/ui/Button";
import Badge from "../components/ui/Badge";
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

  return (
    <div className="mx-auto max-w-[720px] flex flex-col gap-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="type-heading-lg text-text-primary">Printer Settings</h1>
          <p className="type-body-sm text-text-secondary mt-0.5">
            Choose which installed printer prints receipts on this machine.
          </p>
        </div>
        <Button variant="secondary" onClick={refresh}>
          <RefreshCw size={14} /> Rescan
        </Button>
      </div>

      {/* Current selection */}
      <div className="rounded-xl border border-border-default bg-surface-panel p-5">
        <div className="flex items-center gap-2.5 mb-3">
          <span className="w-8 h-8 rounded-lg bg-brand/12 text-brand flex items-center justify-center">
            <Printer size={16} />
          </span>
          <h2 className="type-section text-text-primary">Receipt printer</h2>
        </div>
        {saved ? (
          <p className="type-body-sm text-text-primary">
            {saved}
            <Badge variant="success" className="ml-2">
              configured
            </Badge>
          </p>
        ) : (
          <p className="type-body-sm text-error-text">
            No receipt printer selected. Choose one below — receipt printing is
            disabled until you do.
          </p>
        )}
      </div>

      {/* Installed printers */}
      {loadError ? (
        <div className="rounded-xl border border-border-default bg-surface-panel">
          <ErrorState
            title="Couldn't list printers"
            description="Printer discovery is only available inside the desktop app."
            onRetry={refresh}
          />
        </div>
      ) : printers === null ? (
        <div className="rounded-xl border border-border-default bg-surface-panel">
          <LoadingState label="Scanning for printers…" />
        </div>
      ) : printers.length === 0 ? (
        <div className="rounded-xl border border-border-default bg-surface-panel">
          <EmptyState
            icon={Printer}
            title="No printers found"
            description="Install and power on your receipt printer, then rescan."
          />
        </div>
      ) : (
        <div className="rounded-xl border border-border-default bg-surface-panel divide-y divide-border-default">
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
