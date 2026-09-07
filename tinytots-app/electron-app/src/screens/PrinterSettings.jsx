import { useCallback, useEffect, useState } from "react";
import { Printer, RefreshCw, Check } from "lucide-react";
import Button from "../components/ui/Button";
import Badge from "../components/ui/Badge";
import { PageHeader } from "../components/ui/Layout";
import { LoadingState, EmptyState, ErrorState } from "../components/ui/States";
import { apiFetch } from "../services/api";

/**
 * Machine-local printer ROLE assignment. Two application-level roles:
 *
 *   1. Receipt printer          — receipts + cash-drawer kick
 *   2. Barcode / Label printer  — product / variant labels
 *
 * The owner picks which discovered installed printer fulfils each role.
 * Nothing here reads the device's brand / model / queue name — a printer
 * called "XP-365B", "ZDesigner", "POS58" or "Some USB Printer" is equally
 * eligible for either role. The same physical printer may be chosen for
 * both. Choices are stored by the Electron main process in
 * userData/printer-config.json (never Supabase) and read by the backend
 * (resolveReceiptPrinter / resolveBarcodePrinter).
 */

const STATE_UI = {
  ready: {
    badge: "success",
    label: "Configured & available",
    tint: "bg-success/[0.07]",
    well: "bg-success/12 text-success-text",
  },
  unavailable: {
    badge: "warning",
    label: "Configured — not detected",
    tint: "bg-warning/[0.08]",
    well: "bg-warning/14 text-warning-text",
  },
  configured: {
    badge: "neutral",
    label: "Configured",
    tint: "bg-surface-elevated/50",
    well: "bg-brand-soft text-brand",
  },
  unconfigured: {
    badge: "error",
    label: "Not configured",
    tint: "bg-error/[0.06]",
    well: "bg-error/10 text-error-text",
  },
};

/**
 * One printer role: current-selection summary + the installed-printer
 * picker + Save. `printers` / `loadError` are shared from the parent so
 * both roles reflect a single discovery pass.
 */
function PrinterRoleSection({
  title,
  description,
  printers,
  loadError,
  onRetry,
  saved,
  onSave,
  extraAction,
}) {
  const [selected, setSelected] = useState(saved || "");
  const [saving, setSaving] = useState(false);
  const [savedFlash, setSavedFlash] = useState(false);

  // Keep the local selection in sync when the saved value loads/changes.
  useEffect(() => {
    setSelected(saved || "");
  }, [saved]);

  const canVerify = Array.isArray(printers) && !loadError;
  const savedAvailable =
    canVerify && saved ? printers.some((p) => p.name === saved) : null;
  const printerState = !saved
    ? "unconfigured"
    : savedAvailable === false
    ? "unavailable"
    : savedAvailable === true
    ? "ready"
    : "configured";
  const ui = STATE_UI[printerState];

  const dirty = selected !== (saved || "");

  async function handleSave() {
    setSaving(true);
    setSavedFlash(false);
    try {
      const ok = await onSave(selected);
      if (ok) {
        setSavedFlash(true);
        setTimeout(() => setSavedFlash(false), 2500);
      }
    } finally {
      setSaving(false);
    }
  }

  return (
    <section className="flex flex-col gap-4">
      <div>
        <h2 className="type-section text-text-primary">{title}</h2>
        <p className="type-body-sm text-text-secondary mt-0.5">{description}</p>
      </div>

      <div className={`rounded-lg p-5 ${ui.tint}`}>
        <div className="flex items-start gap-3">
          <span
            className={`w-9 h-9 rounded-md flex items-center justify-center shrink-0 ${ui.well}`}
          >
            <Printer size={17} />
          </span>
          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="type-body-sm font-medium text-text-primary">
                Current selection
              </h3>
              <Badge variant={ui.badge}>{ui.label}</Badge>
            </div>
            {saved ? (
              <p className="type-body-sm text-text-primary mt-1 truncate">{saved}</p>
            ) : (
              <p className="type-body-sm text-text-secondary mt-1">
                Not configured — this role is disabled until you choose a
                printer below.
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

      <p className="type-field-label text-text-secondary -mb-1">Installed on this PC</p>
      {loadError ? (
        <ErrorState
          title="Couldn't list printers"
          description="Printer discovery is only available inside the desktop app."
          onRetry={onRetry}
        />
      ) : printers === null ? (
        <LoadingState label="Scanning for printers…" />
      ) : printers.length === 0 ? (
        <EmptyState
          icon={Printer}
          title="No printers found"
          description="Install and power on your printer, then rescan."
        />
      ) : (
        <div className="rounded-lg bg-surface-panel shadow-sm divide-y divide-border-default overflow-hidden">
          <button
            onClick={() => setSelected("")}
            className={`w-full flex items-center justify-between gap-3 px-4 py-3 text-left transition-colors ${
              selected === "" ? "bg-surface-elevated" : "hover:bg-surface-elevated/60"
            }`}
          >
            <span className="type-body-sm text-text-secondary">Not configured</span>
            {selected === "" && <Check size={16} className="text-brand shrink-0" />}
          </button>
          {printers.map((p) => {
            const isSelected = selected === p.name;
            return (
              <button
                key={p.name}
                onClick={() => setSelected(p.name)}
                className={`w-full flex items-center justify-between gap-3 px-4 py-3 text-left transition-colors ${
                  isSelected ? "bg-surface-elevated" : "hover:bg-surface-elevated/60"
                }`}
              >
                <span className="min-w-0">
                  <span className="type-body-sm font-medium text-text-primary block truncate">
                    {p.name}
                  </span>
                  {p.isDefault && (
                    <span className="type-caption text-text-muted">Windows default</span>
                  )}
                </span>
                {isSelected && <Check size={16} className="text-brand shrink-0" />}
              </button>
            );
          })}
        </div>
      )}

      <div className="flex items-center gap-3 flex-wrap">
        <Button onClick={handleSave} disabled={!dirty || saving} loading={saving}>
          {saving ? "Saving…" : "Save"}
        </Button>
        {extraAction}
        {savedFlash && (
          <span className="type-body-sm text-success-text inline-flex items-center gap-1.5">
            <Check size={14} /> Saved
          </span>
        )}
      </div>
    </section>
  );
}

export default function PrinterSettings() {
  const bridge = typeof window !== "undefined" ? window.electron : null;

  const [printers, setPrinters] = useState(null); // null = loading
  const [loadError, setLoadError] = useState(false);
  const [receiptSaved, setReceiptSaved] = useState(null);
  const [barcodeSaved, setBarcodeSaved] = useState(null);
  const [testMsg, setTestMsg] = useState("");
  const [testing, setTesting] = useState(false);

  const load = useCallback(() => {
    if (
      !bridge?.listPrinters ||
      !bridge?.getReceiptPrinter ||
      !bridge?.getBarcodePrinter
    ) {
      Promise.resolve().then(() => {
        setPrinters([]);
        setLoadError(true);
      });
      return;
    }
    Promise.all([
      bridge.listPrinters(),
      bridge.getReceiptPrinter(),
      bridge.getBarcodePrinter(),
    ])
      .then(([listRes, receiptRes, barcodeRes]) => {
        if (listRes?.success) {
          setPrinters(listRes.printers || []);
          setLoadError(false);
        } else {
          setPrinters([]);
          setLoadError(true);
        }
        if (receiptRes?.success) setReceiptSaved(receiptRes.receiptPrinter || null);
        if (barcodeRes?.success) setBarcodeSaved(barcodeRes.barcodePrinter || null);
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

  async function saveReceipt(name) {
    if (!bridge?.setReceiptPrinter) return false;
    const res = await bridge.setReceiptPrinter(name);
    if (res?.success) {
      setReceiptSaved(res.receiptPrinter || null);
      return true;
    }
    return false;
  }

  async function saveBarcode(name) {
    if (!bridge?.setBarcodePrinter) return false;
    const res = await bridge.setBarcodePrinter(name);
    if (res?.success) {
      setBarcodeSaved(res.barcodePrinter || null);
      return true;
    }
    return false;
  }

  async function testBarcodePrinter() {
    setTesting(true);
    setTestMsg("");
    try {
      const res = await apiFetch("/api/print-labels/test", { method: "POST" });
      const data = await res.json().catch(() => ({}));
      if (data.success) {
        setTestMsg(`Test label sent to ${data.printer}.`);
      } else {
        setTestMsg(data.message || data.error || "Test print failed.");
      }
    } catch (err) {
      setTestMsg(`Test print failed: ${err.message}`);
    } finally {
      setTesting(false);
    }
  }

  return (
    <div className="mx-auto max-w-[720px] flex flex-col gap-8">
      <PageHeader
        title="Printer Settings"
        description="Assign an installed printer to each role on this machine. Roles are an app concept — any discovered printer can fill either one."
      >
        <Button variant="secondary" onClick={refresh}>
          <RefreshCw size={14} /> Rescan
        </Button>
      </PageHeader>

      <PrinterRoleSection
        title="Receipt printer"
        description="Prints customer receipts and kicks the cash drawer."
        printers={printers}
        loadError={loadError}
        onRetry={refresh}
        saved={receiptSaved}
        onSave={saveReceipt}
      />

      <div className="h-px bg-border-default" />

      <PrinterRoleSection
        title="Barcode / Label printer"
        description="Prints product and variant barcode / QR labels."
        printers={printers}
        loadError={loadError}
        onRetry={refresh}
        saved={barcodeSaved}
        onSave={saveBarcode}
        extraAction={
          <Button
            variant="secondary"
            onClick={testBarcodePrinter}
            disabled={testing || !barcodeSaved}
            loading={testing}
          >
            {testing ? "Printing…" : "Test barcode printer"}
          </Button>
        }
      />
      {testMsg && (
        <p className="type-body-sm text-text-secondary -mt-4">{testMsg}</p>
      )}
    </div>
  );
}
