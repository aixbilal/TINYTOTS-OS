import { useEffect, useState, useCallback } from "react";
import {
  RotateCcw,
  FileText,
  ChevronLeft,
  ChevronRight,
  Download,
  Printer,
} from "lucide-react";
import ReceiptDetailPanel from "../components/receipts/ReceiptDetailPanel";
import Button from "../components/ui/Button";
import SearchField from "../components/ui/SearchField";
import { PageHeader } from "../components/ui/Layout";
import { LoadingState, EmptyState } from "../components/ui/States";
import { Table, THead, TBody, TR, TH, TD } from "../components/ui/Table";
import { apiFetch } from "../services/api";

const PAGE_SIZE = 10;
const PAYMENT_METHODS = ["All", "cash", "card", "upi", "wallet", "online"];

export default function OldReceipts() {
  const [query, setQuery] = useState("");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [paymentFilter, setPaymentFilter] = useState("All");
  const [page, setPage] = useState(1);
  const [receipts, setReceipts] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [selectedId, setSelectedId] = useState(null);

  const load = useCallback(() => {
    setLoading(true);
    const params = new URLSearchParams({ query, page, pageSize: PAGE_SIZE });
    if (from) params.set("from", from);
    if (to) params.set("to", to);
    if (paymentFilter && paymentFilter !== "All") params.set("paymentMethod", paymentFilter);

    fetch(`http://localhost:3000/api/receipts?${params.toString()}`)
      .then((r) => r.json())
      .then((data) => {
        if (data.success) {
          setReceipts(data.receipts);
          setTotal(data.total);
        }
      })
      .catch((err) => console.error("receipts fetch failed:", err))
      .finally(() => setLoading(false));
  }, [query, from, to, paymentFilter, page]);

  useEffect(() => {
    const t = setTimeout(load, 300); // debounce search typing
    return () => clearTimeout(t);
  }, [load]);

  function handleReset() {
    setQuery("");
    setFrom("");
    setTo("");
    setPaymentFilter("All");
    setPage(1);
  }

  async function reprint(id) {
    await apiFetch(`/api/receipts/${id}/reprint`, { method: "POST" });
  }

  const totalPages = Math.max(Math.ceil(total / PAGE_SIZE), 1);
  const showingFrom = total === 0 ? 0 : (page - 1) * PAGE_SIZE + 1;
  const showingTo = Math.min(page * PAGE_SIZE, total);

  const inputCls =
    "type-input h-9 rounded-md border border-border-default bg-surface-panel px-3 text-text-primary outline-none transition-[border-color,box-shadow] focus:border-brand focus:ring-2 focus:ring-brand/45";

  return (
    <div className="mx-auto max-w-[1600px] flex gap-4">
      <div className="flex-1 min-w-0 flex flex-col gap-5">
        <PageHeader
          title="Receipts"
          description="Search, view and reprint past sales receipts."
        />

        {/* Toolbar */}
        <div className="flex flex-wrap items-center gap-2">
          <SearchField
            value={query}
            onChange={(v) => {
              setQuery(v);
              setPage(1);
            }}
            placeholder="Search by receipt ID, invoice, customer or cashier…"
            className="flex-1 min-w-[220px]"
          />
          <input
            type="date"
            value={from}
            onChange={(e) => {
              setFrom(e.target.value);
              setPage(1);
            }}
            className={inputCls}
            aria-label="From date"
          />
          <span className="text-text-muted">–</span>
          <input
            type="date"
            value={to}
            onChange={(e) => {
              setTo(e.target.value);
              setPage(1);
            }}
            className={inputCls}
            aria-label="To date"
          />
          <select
            value={paymentFilter}
            onChange={(e) => {
              setPaymentFilter(e.target.value);
              setPage(1);
            }}
            className={`${inputCls} capitalize`}
          >
            {PAYMENT_METHODS.map((m) => (
              <option key={m} value={m}>
                {m === "All" ? "All payments" : m}
              </option>
            ))}
          </select>
          <Button variant="secondary" onClick={handleReset}>
            <RotateCcw size={14} /> Reset
          </Button>
        </div>

        {/* Table — open rows on the canvas, no enclosing box (§39) */}
        {loading && receipts.length === 0 ? (
          <LoadingState label="Loading receipts…" />
        ) : receipts.length === 0 ? (
          <EmptyState
            icon={FileText}
            title="No receipts found"
            description="Try adjusting the search, date range or payment filter."
          />
        ) : (
          <>
            <Table bare>
              <THead>
                <TR>
                  <TH>Receipt ID</TH>
                  <TH>Date &amp; Time</TH>
                  <TH>Cashier</TH>
                  <TH align="right">Items</TH>
                  <TH align="right">Total</TH>
                  <TH>Payment</TH>
                  <TH align="right">Actions</TH>
                </TR>
              </THead>
              <TBody>
                {receipts.map((r) => (
                  <TR
                    key={r.id}
                    onClick={() => setSelectedId(r.id)}
                    selected={selectedId === r.id}
                  >
                    <TD className="font-medium">
                      <span className="inline-flex items-center gap-2">
                        <FileText size={14} className="text-brand" />
                        {r.receiptId}
                      </span>
                    </TD>
                    <TD className="text-text-secondary">
                      {new Date(r.dateTime).toLocaleDateString("en-GB", {
                        day: "2-digit",
                        month: "short",
                        year: "numeric",
                      })}{" "}
                      <span className="text-text-muted">
                        {new Date(r.dateTime).toLocaleTimeString("en-GB", {
                          hour: "numeric",
                          minute: "2-digit",
                        })}
                      </span>
                    </TD>
                    <TD>{r.cashier}</TD>
                    <TD align="right">{r.items}</TD>
                    <TD align="right" className="font-medium">
                      Rs. {Number(r.totalAmount).toLocaleString("en-PK")}
                    </TD>
                    <TD className="text-text-secondary capitalize">{r.paymentMethod}</TD>
                    <TD align="right" onClick={(e) => e.stopPropagation()}>
                      <div className="inline-flex items-center gap-1">
                        <button
                          onClick={() =>
                            window.open(
                              `http://localhost:3000/api/receipts/${r.id}/download`,
                              "_blank"
                            )
                          }
                          className="p-1 text-text-muted hover:text-text-primary"
                          aria-label="Download PDF"
                        >
                          <Download size={15} />
                        </button>
                        <button
                          onClick={() => reprint(r.id)}
                          className="p-1 text-text-muted hover:text-text-primary"
                          aria-label="Reprint receipt"
                        >
                          <Printer size={15} />
                        </button>
                      </div>
                    </TD>
                  </TR>
                ))}
              </TBody>
            </Table>

            {/* Pagination */}
            <div className="flex items-center justify-between type-body-sm text-text-secondary">
              <span>
                Showing {showingFrom}–{showingTo} of {total} receipts
              </span>
              <div className="flex items-center gap-1.5">
                <button
                  onClick={() => setPage((p) => Math.max(p - 1, 1))}
                  disabled={page === 1}
                  className="w-8 h-8 flex items-center justify-center rounded-md border border-border-default text-text-secondary hover:text-text-primary hover:bg-surface-sunken disabled:opacity-40 transition-colors"
                >
                  <ChevronLeft size={15} />
                </button>
                <span className="px-2">
                  Page {page} / {totalPages}
                </span>
                <button
                  onClick={() => setPage((p) => Math.min(p + 1, totalPages))}
                  disabled={page >= totalPages}
                  className="w-8 h-8 flex items-center justify-center rounded-md border border-border-default text-text-secondary hover:text-text-primary hover:bg-surface-sunken disabled:opacity-40 transition-colors"
                >
                  <ChevronRight size={15} />
                </button>
              </div>
            </div>
          </>
        )}
      </div>

      {selectedId && (
        <ReceiptDetailPanel receiptId={selectedId} onClose={() => setSelectedId(null)} />
      )}
    </div>
  );
}
