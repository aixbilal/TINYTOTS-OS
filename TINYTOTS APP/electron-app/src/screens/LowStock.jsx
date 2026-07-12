import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Boxes, AlertTriangle } from "lucide-react";
import Header from "../components/Header";

export default function LowStock() {
  const navigate = useNavigate();
  const [items, setItems] = useState(null);
  const [loadError, setLoadError] = useState(false);

  useEffect(() => {
    async function loadLowStock() {
      try {
        const res = await fetch("http://localhost:3000/api/low-stock");
        const data = await res.json();
        if (data.success) setItems(data.items);
        else setLoadError(true);
      } catch {
        setLoadError(true);
      }
    }
    loadLowStock();
  }, []);

  return (
    <div className="min-h-screen bg-cream px-10 py-6">
      <Header onMenuClick={() => {}} />

      <div className="mb-8">
        <button
          onClick={() => navigate("/")}
          className="inline-flex items-center gap-2 text-sm text-maroon-700 hover:underline mb-4"
        >
          <ArrowLeft size={16} />
          Back to Dashboard
        </button>

        <h1 className="font-display font-semibold text-3xl md:text-4xl text-ink-900 leading-tight">
          Low Stock Items
        </h1>
        <p className="mt-2 text-ink-700 flex items-center gap-2">
          <span className="inline-block w-6 h-px bg-gold-600" />
          Items at or below the reorder threshold — restock these soon.
        </p>
      </div>

      {loadError && (
        <p className="text-ink-700">Couldn't load low stock items right now.</p>
      )}

      {!loadError && items === null && (
        <p className="text-ink-700">Loading…</p>
      )}

      {!loadError && items?.length === 0 && (
        <p className="text-ink-700">Nothing is low on stock right now — you're all good.</p>
      )}

      {!loadError && items?.length > 0 && (
        <div className="bg-cream-50 border border-gold-300/40 rounded-2xl overflow-hidden">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-gold-300/40 text-xs text-ink-700 uppercase tracking-wide">
                <th className="px-6 py-4 font-semibold">Item</th>
                <th className="px-6 py-4 font-semibold">Size / Color</th>
                <th className="px-6 py-4 font-semibold">Code</th>
                <th className="px-6 py-4 font-semibold">Stock Left</th>
                <th className="px-6 py-4 font-semibold">Supplier ID</th>
              </tr>
            </thead>
            <tbody>
              {items.map((item) => (
                <tr
                  key={item.variantId}
                  className="border-b border-gold-300/20 last:border-0 hover:bg-cream-100/60 transition-colors"
                >
                  <td className="px-6 py-4 font-medium text-ink-900">{item.name}</td>
                  <td className="px-6 py-4 text-ink-700">
                    {[item.size, item.color].filter(Boolean).join(" / ") || "—"}
                  </td>
                  <td className="px-6 py-4 text-ink-700">{item.publicCode || "—"}</td>
                  <td className="px-6 py-4">
                    <span
                      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${
                        item.stock <= 0
                          ? "bg-maroon-100 text-maroon-800"
                          : "bg-gold-100 text-gold-800"
                      }`}
                    >
                      {item.stock <= 0 && <AlertTriangle size={12} />}
                      {item.stock <= 0 ? "Out of stock" : `${item.stock} left`}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-ink-700">
                    {item.supplierId || <span className="text-ink-400 italic">Not set</span>}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}