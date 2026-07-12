import { useNavigate } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { useEffect, useState, useCallback, useRef } from "react";
import { Search, Calendar, SlidersHorizontal, RotateCcw, FileText, ChevronLeft, ChevronRight, MoreVertical } from "lucide-react";
import FloralFlourish from "../components/FloralFlourish";
import ReceiptDetailPanel from "../components/receipts/ReceiptDetailPanel";
import loginBg from "../assets/login-bg.png";

const glassCard =
  "rounded-2xl border border-white/40 backdrop-blur-xl transition-transform duration-300";
const glassCardStyle = {
  background: "linear-gradient(160deg, rgba(255,255,255,0.30) 0%, rgba(255,255,255,0.12) 100%)",
  boxShadow: "inset 0 1px 1px rgba(255,255,255,0.5)",
};

const PAGE_SIZE = 8;
const PAYMENT_METHODS = ["All", "cash", "card", "online"];

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
  const [openMenuId, setOpenMenuId] = useState(null);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showFilterMenu, setShowFilterMenu] = useState(false);

  const datePickerRef = useRef(null);
  const filterMenuRef = useRef(null);

  const navigate = useNavigate();

  // Close popovers when clicking outside them
  useEffect(() => {
    function handleClickOutside(e) {
      if (datePickerRef.current && !datePickerRef.current.contains(e.target)) {
        setShowDatePicker(false);
      }
      if (filterMenuRef.current && !filterMenuRef.current.contains(e.target)) {
        setShowFilterMenu(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

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
    setShowDatePicker(false);
    setShowFilterMenu(false);
  }

  const totalPages = Math.max(Math.ceil(total / PAGE_SIZE), 1);
  const showingFrom = total === 0 ? 0 : (page - 1) * PAGE_SIZE + 1;
  const showingTo = Math.min(page * PAGE_SIZE, total);

  const dateRangeLabel =
    from && to ? `${from} → ${to}` : from ? `From ${from}` : to ? `Until ${to}` : "Select Date Range";

  return (
    <div
      className="min-h-screen px-8 py-7 flex gap-6 bg-cover bg-center bg-no-repeat"
      style={{ backgroundImage: `url(${loginBg})` }}
    >
      <div className="flex-1 min-w-0">
        {/* Back to Dashboard */}
        <button
          onClick={() => navigate("/dashboard")}
          className="inline-flex items-center gap-2 text-sm text-ink-700 hover:text-maroon-700 mb-4"
        >
          <ArrowLeft size={15} /> Dashboard
        </button>

        <div className="relative mb-6">
          <h1 className="font-display text-4xl text-ink-900">
            Old <span className="text-maroon-700">Receipts</span>
          </h1>
          <p className="text-ink-700 mt-1.5">Search, view and manage all your past receipts.</p>
          <div className="absolute -top-3 right-0 opacity-40 pointer-events-none hidden lg:block">
            <FloralFlourish />
          </div>
        </div>

        {/* Search / filter bar */}
        <div className="flex items-center gap-3 mb-5">
          <div className="flex-1 flex items-center gap-2 border border-white/40 rounded-lg px-4 py-2.5 bg-white/25 backdrop-blur-sm">
            <Search size={16} className="text-ink-700" />
            <input
              value={query}
              onChange={(e) => {
                setQuery(e.target.value);
                setPage(1);
              }}
              placeholder="Search by Receipt ID / Invoice No. / Customer / Cashier"
              className="w-full bg-transparent text-sm outline-none placeholder:text-ink-700/50"
            />
          </div>

          {/* Date range popover */}
          <div className="relative" ref={datePickerRef}>
            <button
              onClick={() => {
                setShowDatePicker((v) => !v);
                setShowFilterMenu(false);
              }}
              className="flex items-center gap-2 border border-white/40 rounded-lg px-4 py-2.5 bg-white/25 backdrop-blur-sm text-sm text-ink-700 whitespace-nowrap"
            >
              <Calendar size={16} />
              {dateRangeLabel}
            </button>
            {showDatePicker && (
              <div className={`absolute right-0 top-11 z-20 p-4 w-64 flex flex-col gap-3 ${glassCard}`} style={glassCardStyle}>
                <div>
                  <label className="block text-xs text-ink-700 mb-1">From</label>
                  <input
                    type="date"
                    value={from}
                    onChange={(e) => {
                      setFrom(e.target.value);
                      setPage(1);
                    }}
                    className="w-full border border-white/40 bg-white/20 rounded-md px-2 py-1.5 text-sm outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs text-ink-700 mb-1">To</label>
                  <input
                    type="date"
                    value={to}
                    onChange={(e) => {
                      setTo(e.target.value);
                      setPage(1);
                    }}
                    className="w-full border border-white/40 bg-white/20 rounded-md px-2 py-1.5 text-sm outline-none"
                  />
                </div>
                <button
                  onClick={() => setShowDatePicker(false)}
                  className="bg-maroon-700 text-cream-50 rounded-md px-3 py-1.5 text-sm font-medium hover:bg-maroon-800"
                >
                  Apply
                </button>
              </div>
            )}
          </div>

          {/* Filter popover */}
          <div className="relative" ref={filterMenuRef}>
            <button
              onClick={() => {
                setShowFilterMenu((v) => !v);
                setShowDatePicker(false);
              }}
              className="flex items-center gap-2 border border-white/40 rounded-lg px-4 py-2.5 bg-white/25 backdrop-blur-sm text-sm text-ink-700"
            >
              <SlidersHorizontal size={16} /> Filter
            </button>
            {showFilterMenu && (
              <div className={`absolute right-0 top-11 z-20 p-3 w-48 ${glassCard}`} style={glassCardStyle}>
                <p className="text-xs text-ink-700 mb-2 px-1">Payment Method</p>
                {PAYMENT_METHODS.map((method) => (
                  <button
                    key={method}
                    onClick={() => {
                      setPaymentFilter(method);
                      setPage(1);
                      setShowFilterMenu(false);
                    }}
                    className={`w-full text-left px-3 py-2 rounded-md text-sm capitalize hover:bg-white/30 ${
                      paymentFilter === method ? "bg-white/30 text-maroon-700 font-medium" : "text-ink-900"
                    }`}
                  >
                    {method}
                  </button>
                ))}
              </div>
            )}
          </div>

          <button
            onClick={handleReset}
            className="flex items-center gap-2 border border-white/40 rounded-lg px-4 py-2.5 bg-white/25 backdrop-blur-sm text-sm text-ink-700"
          >
            <RotateCcw size={16} /> Reset
          </button>
        </div>

        {/* Table */}
        <div className={`overflow-hidden ${glassCard}`} style={glassCardStyle}>
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-white/30 text-left text-ink-700">
                <th className="px-5 py-3.5 font-medium">Receipt ID</th>
                <th className="px-5 py-3.5 font-medium">Date &amp; Time</th>
                <th className="px-5 py-3.5 font-medium">Cashier</th>
                <th className="px-5 py-3.5 font-medium">Items</th>
                <th className="px-5 py-3.5 font-medium">Total Amount</th>
                <th className="px-5 py-3.5 font-medium">Payment Method</th>
                <th className="px-5 py-3.5 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {receipts.map((r) => (
                <tr
                  key={r.id}
                  onClick={() => setSelectedId(r.id)}
                  className={`border-b border-white/15 last:border-0 cursor-pointer hover:bg-white/20 ${
                    selectedId === r.id ? "bg-white/20" : ""
                  }`}
                >
                  <td className="px-5 py-3.5 flex items-center gap-2 text-ink-900 font-medium">
                    <FileText size={15} className="text-maroon-700" /> {r.receiptId}
                  </td>
                  <td className="px-5 py-3.5 text-ink-700">
                    {new Date(r.dateTime).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" })}
                    <br />
                    <span className="text-xs">
                      {new Date(r.dateTime).toLocaleTimeString("en-GB", { hour: "numeric", minute: "2-digit" })}
                    </span>
                  </td>
                  <td className="px-5 py-3.5 text-ink-900">{r.cashier}</td>
                  <td className="px-5 py-3.5 text-ink-900">{r.items}</td>
                  <td className="px-5 py-3.5 text-ink-900 font-medium">Rs. {r.totalAmount.toLocaleString("en-PK")}</td>
                  <td className="px-5 py-3.5 text-ink-700">{r.paymentMethod}</td>
                  <td className="px-5 py-3.5 relative" onClick={(e) => e.stopPropagation()}>
                    <button
                      onClick={() => setOpenMenuId(openMenuId === r.id ? null : r.id)}
                      className="text-ink-700 hover:text-ink-900"
                    >
                      <MoreVertical size={16} />
                    </button>
                    {openMenuId === r.id && (
                      <div className={`absolute right-5 top-9 z-10 text-sm w-40 ${glassCard}`} style={glassCardStyle}>
                        <button
                          onClick={() => {
                            setSelectedId(r.id);
                            setOpenMenuId(null);
                          }}
                          className="w-full text-left px-3.5 py-2.5 hover:bg-white/30"
                        >
                          View Details
                        </button>
                        <button
                          onClick={() => {
                            window.open(`http://localhost:3000/api/receipts/${r.id}/download`, "_blank");
                            setOpenMenuId(null);
                          }}
                          className="w-full text-left px-3.5 py-2.5 hover:bg-white/30"
                        >
                          Download PDF
                        </button>
                        <button
                          onClick={async () => {
                            await fetch(`http://localhost:3000/api/receipts/${r.id}/reprint`, { method: "POST" });
                            setOpenMenuId(null);
                          }}
                          className="w-full text-left px-3.5 py-2.5 hover:bg-white/30"
                        >
                          Print Receipt
                        </button>
                      </div>
                    )}
                  </td>
                </tr>
              ))}
              {!loading && receipts.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-5 py-10 text-center text-ink-700 text-sm">
                    No receipts found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="flex items-center justify-between mt-4 text-sm text-ink-700">
          <span>
            Showing {showingFrom} to {showingTo} of {total} receipts
          </span>
          <div className="flex items-center gap-1.5">
            <button
              onClick={() => setPage((p) => Math.max(p - 1, 1))}
              disabled={page === 1}
              className="w-8 h-8 flex items-center justify-center rounded-lg border border-white/40 bg-white/20 disabled:opacity-40"
            >
              <ChevronLeft size={15} />
            </button>
            {Array.from({ length: Math.min(totalPages, 3) }, (_, i) => i + 1).map((p) => (
              <button
                key={p}
                onClick={() => setPage(p)}
                className={`w-8 h-8 flex items-center justify-center rounded-lg text-sm ${
                  page === p ? "bg-maroon-700 text-cream-50" : "border border-white/40 bg-white/20 text-ink-700"
                }`}
              >
                {p}
              </button>
            ))}
            {totalPages > 3 && <span className="px-1">…</span>}
            {totalPages > 3 && (
              <button
                onClick={() => setPage(totalPages)}
                className={`w-8 h-8 flex items-center justify-center rounded-lg text-sm ${
                  page === totalPages ? "bg-maroon-700 text-cream-50" : "border border-white/40 bg-white/20 text-ink-700"
                }`}
              >
                {totalPages}
              </button>
            )}
            <button
              onClick={() => setPage((p) => Math.min(p + 1, totalPages))}
              disabled={page === totalPages}
              className="w-8 h-8 flex items-center justify-center rounded-lg border border-white/40 bg-white/20 disabled:opacity-40"
            >
              <ChevronRight size={15} />
            </button>
          </div>
        </div>
      </div>

      {selectedId && <ReceiptDetailPanel receiptId={selectedId} onClose={() => setSelectedId(null)} />}
    </div>
  );
}