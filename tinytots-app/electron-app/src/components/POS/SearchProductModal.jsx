// SearchProductModal.jsx
import { useEffect, useState } from "react";
import { X, Search } from "lucide-react";

export default function SearchProductModal({ onClose, onPick }) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!query.trim()) {
      setResults([]);
      return;
    }
    const handle = setTimeout(async () => {
      setLoading(true);
      try {
        const res = await fetch(
          `http://localhost:3000/api/products/search?q=${encodeURIComponent(query)}`
        );
        if (!res.ok) {
          console.error("Product search failed:", res.status);
          setResults([]);
          return;
        }
        const data = await res.json();
        setResults(Array.isArray(data) ? data : []);
      } catch (err) {
        console.error("Product search error:", err);
        setResults([]);
      } finally {
        setLoading(false);
      }
    }, 250); // debounce so we're not hitting the API on every keystroke
    return () => clearTimeout(handle);
  }, [query]);

  return (
    <div className="fixed inset-0 bg-surface-overlay tt-anim-fade flex items-start justify-center pt-24 z-50 px-4">
      <div className="bg-surface-panel border border-border-strong rounded-xl shadow-lg w-full max-w-lg max-h-[70vh] overflow-hidden flex flex-col tt-anim-dialog">
        <div className="flex items-center gap-3 p-4 border-b border-border-default">
          <Search size={18} className="text-text-muted" />
          <input
            autoFocus
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search by product name or SKU…"
            className="flex-1 outline-none bg-transparent type-input text-text-primary placeholder:text-text-muted"
          />
          <button onClick={onClose} className="text-text-muted hover:text-text-primary">
            <X size={18} />
          </button>
        </div>

        <div className="overflow-y-auto">
          {loading && <p className="text-center text-sm text-text-secondary py-6">Searching…</p>}

          {!loading && query.trim() && results.length === 0 && (
            <p className="text-center text-sm text-text-muted py-6">No matching products.</p>
          )}

          {results.map((p) => (
            <button
              key={p.variant_id}
              onClick={() => {
                onPick(p);
                onClose();
              }}
              disabled={p.stock <= 0}
              className="w-full flex items-center gap-3 px-4 py-3 hover:bg-surface-sunken text-left border-b border-border-default last:border-0 disabled:opacity-40 transition-colors"
            >
              <div className="w-10 h-10 rounded-md bg-surface-elevated flex-shrink-0 overflow-hidden">
                {p.image_url && <img src={p.image_url} alt="" className="w-full h-full object-cover" />}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-text-primary truncate">{p.name}</p>
                <p className="text-xs text-text-muted">
                  {p.size} / {p.color} · {p.sku}
                </p>
              </div>
              <div className="text-right flex-shrink-0">
                <p className="text-sm font-semibold text-text-primary">Rs. {p.price}</p>
                <p className={`text-xs ${p.stock <= 5 ? "text-warning-text" : "text-text-muted"}`}>
                  {p.stock <= 0 ? "Out of stock" : `${p.stock} in stock`}
                </p>
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}