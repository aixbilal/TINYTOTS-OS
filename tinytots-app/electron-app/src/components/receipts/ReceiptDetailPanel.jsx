import { useEffect, useState } from "react";
import { X, Download, Printer, FileText, Calendar, User, CreditCard, Banknote, Package } from "lucide-react";

export default function ReceiptDetailPanel({ receiptId, onClose }) {
  const [receipt, setReceipt] = useState(null);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    if (!receiptId) return;
    fetch(`http://localhost:3000/api/receipts/${receiptId}`)
      .then((r) => r.json())
      .then((data) => {
        if (data.success) setReceipt(data.receipt);
      })
      .catch((err) => console.error("receipt detail fetch failed:", err));
  }, [receiptId]);

  async function handlePrint() {
    setBusy(true);
    setMessage("");
    try {
      const res = await fetch(`http://localhost:3000/api/receipts/${receiptId}/reprint`, { method: "POST" });
      const data = await res.json();
      setMessage(data.success ? "Sent to printer." : `Failed: ${data.error}`);
    } catch (err) {
      setMessage(`Failed: ${err.message}`);
    } finally {
      setBusy(false);
    }
  }

  function handleDownload() {
    window.open(`http://localhost:3000/api/receipts/${receiptId}/download`, "_blank");
  }

  if (!receiptId) return null;

  return (
    <div className="w-[380px] bg-cream-50 border border-gold-300/40 rounded-2xl p-6 h-fit sticky top-7 hover:shadow-md transition-shadow duration-200">
      <div className="flex items-center justify-between mb-5">
        <h3 className="font-display text-xl text-ink-900">Receipt Details</h3>
        <button onClick={onClose} className="text-ink-700 hover:text-ink-900">
          <X size={18} />
        </button>
      </div>

      {!receipt ? (
        <p className="text-sm text-ink-700">Loading…</p>
      ) : (
        <>
          <div className="space-y-3 mb-5 text-sm">
            <DetailRow icon={FileText} label="Receipt ID" value={receipt.receiptId} />
            <DetailRow
              icon={Calendar}
              label="Date & Time"
              value={new Date(receipt.dateTime).toLocaleString("en-GB", {
                day: "2-digit",
                month: "short",
                year: "numeric",
                hour: "numeric",
                minute: "2-digit",
              })}
            />
            <DetailRow icon={User} label="Cashier" value={receipt.cashier} />
            <DetailRow icon={CreditCard} label="Payment Method" value={receipt.paymentMethod} />
            <DetailRow icon={Banknote} label="Total Amount" value={`Rs. ${receipt.total.toLocaleString("en-PK")}`} />
            <DetailRow icon={Package} label="Total Items" value={receipt.items.length} />
          </div>

          <p className="text-sm font-medium text-ink-900 mb-2">Receipt Preview</p>
          <div className="flex gap-2.5 mb-5">
            <button
              onClick={handleDownload}
              className="flex-1 flex items-center justify-center gap-2 border border-gold-300/50 rounded-lg py-2.5 text-sm text-ink-900 hover:bg-cream-100"
            >
              <Download size={15} /> Download PDF
            </button>
            <button
              onClick={handlePrint}
              disabled={busy}
              className="flex-1 flex items-center justify-center gap-2 bg-maroon-700 text-cream-50 rounded-lg py-2.5 text-sm font-medium hover:bg-maroon-800 disabled:opacity-50"
            >
              <Printer size={15} /> {busy ? "Sending…" : "Print Receipt"}
            </button>
          </div>

          <div className="border border-gold-300/40 rounded-xl p-4 bg-white font-mono text-[11px] text-ink-900">
            <p className="text-center font-display text-base mb-0.5">RETAIL EDGE</p>
            <p className="text-center text-[10px] text-ink-700 mb-2">ELEVATE EVERY SALE</p>
            <div className="border-t border-dashed border-ink-700/30 my-2" />
            <p>Receipt ID : {receipt.receiptId}</p>
            <p>Date : {new Date(receipt.dateTime).toLocaleString("en-GB")}</p>
            <p>Cashier : {receipt.cashier}</p>
            <div className="border-t border-dashed border-ink-700/30 my-2" />
            <div className="flex justify-between font-medium mb-1">
              <span>Item</span>
              <span>Total</span>
            </div>
            {receipt.items.map((it, i) => (
              <div key={i} className="flex justify-between py-0.5">
                <span className="truncate pr-2">
                  {it.name} x{it.qty}
                </span>
                <span>Rs. {it.total.toLocaleString("en-PK")}</span>
              </div>
            ))}
            <div className="border-t border-dashed border-ink-700/30 my-2" />
            <div className="flex justify-between">
              <span>Subtotal</span>
              <span>Rs. {receipt.subtotal.toLocaleString("en-PK")}</span>
            </div>
            <div className="flex justify-between">
              <span>Discount</span>
              <span>- Rs. {receipt.discount.toLocaleString("en-PK")}</span>
            </div>
            <div className="flex justify-between">
              <span>Tax</span>
              <span>Rs. {receipt.tax.toLocaleString("en-PK")}</span>
            </div>
            <div className="border-t border-dashed border-ink-700/30 my-2" />
            <div className="flex justify-between font-display text-sm">
              <span>Total</span>
              <span>Rs. {receipt.total.toLocaleString("en-PK")}</span>
            </div>
            <p className="text-center mt-3 text-[10px] text-ink-700">Thank you for shopping with us!<br />Visit again!</p>
          </div>

          {message && <p className="text-xs text-ink-700 mt-3 text-center">{message}</p>}
        </>
      )}
    </div>
  );
}

function DetailRow({ icon: Icon, label, value }) {
  return (
    <div className="flex items-center justify-between">
      <span className="flex items-center gap-2 text-ink-700">
        <Icon size={14} /> {label}
      </span>
      <span className="text-ink-900 font-medium">{value}</span>
    </div>
  );
}