import { useState } from "react";
import { MoreVertical, Trash2, Check, X } from "lucide-react";

const COLOR_SWATCH = {
  maroon: "#7A0F1F", black: "#111111", white: "#f5f5f5", olive: "#556B2F",
  sand: "#C2A878", navy: "#1B2A4A", grey: "#888888", gray: "#888888",
  red: "#c0392b", blue: "#2c3e93", green: "#2e6b3e", beige: "#d8c3a5", brown: "#5b3a29",
};

function swatch(color) {
  return COLOR_SWATCH[(color || "").toLowerCase()] || "#B08D57";
}

// public_code is DB-derived as V-{id}. If the backend hasn't backfilled it yet,
// fall back to computing it from the real id so the UI never shows a blank/wrong code.
function publicCode(v) {
  return v.public_code || (v.id != null ? `V-${v.id}` : "—");
}

export default function VariantsTable({ variants, selectedIds, onToggleSelect, onSelectAll, onChanged }) {
  const [editingId, setEditingId] = useState(null);
  const [draft, setDraft] = useState({ stock: "", price: "", cost_price: "", discount_percent: "" });
  const [openMenuId, setOpenMenuId] = useState(null);

  const allSelected = variants.length > 0 && selectedIds.length === variants.length;

  function startEdit(v) {
    setEditingId(v.id);
    setDraft({
      stock: v.stock,
      price: v.price,
      cost_price: v.cost_price ?? "",
      discount_percent: v.discount_percent ?? "",
    });
  }
  async function saveEdit(id) {
    await fetch(`http://localhost:3000/api/variants/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        stock: Number(draft.stock),
        price: Number(draft.price),
        cost_price: Number(draft.cost_price) || 0,
        discount_percent: Math.min(100, Math.max(0, Number(draft.discount_percent) || 0)),
      }),
    });
    setEditingId(null);
    onChanged();
  }

  async function toggleStatus(v) {
    const newStatus = v.status === "inactive" ? "active" : "inactive";
    await fetch(`http://localhost:3000/api/variants/${v.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: newStatus }),
    });
    onChanged();
  }

  async function bulkSetStatus(newStatus) {
    if (!selectedIds.length) return;
    await Promise.all(
      selectedIds.map((id) =>
        fetch(`http://localhost:3000/api/variants/${id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ status: newStatus }),
        })
      )
    );
    onSelectAll(false);
    onChanged();
  }
  
  async function deleteVariant(id) {
    if (!confirm("Delete this variant? This can't be undone.")) return;
    await fetch(`http://localhost:3000/api/variants/${id}`, { method: "DELETE" });
    setOpenMenuId(null);
    onChanged();
  }
  function discountedPrice(v) {
    const pct = Number(v.discount_percent) || 0;
    if (!pct) return null;
    return (Number(v.price) * (1 - pct / 100)).toFixed(0);
  }
  return (
    <div className="overflow-x-auto">
      {selectedIds.length > 0 && (
        <div className="flex items-center justify-between bg-maroon-50 border border-maroon-200 rounded-lg px-4 py-2 mb-3">
          <span className="text-sm text-ink-900 font-medium">
            {selectedIds.length} variant{selectedIds.length > 1 ? "s" : ""} selected
          </span>
          <div className="flex gap-2">
            <button
              onClick={() => bulkSetStatus("active")}
              className="text-xs px-3 py-1.5 rounded-lg bg-green-100 text-green-800 hover:bg-green-200 font-medium"
            >
              Activate Selected
            </button>
            <button
              onClick={() => bulkSetStatus("inactive")}
              className="text-xs px-3 py-1.5 rounded-lg bg-white/60 text-ink-900 hover:bg-white/80 font-medium"
            >
              Deactivate Selected
            </button>
            <button
              onClick={() => onSelectAll(false)}
              className="text-xs px-3 py-1.5 rounded-lg text-ink-700 hover:bg-white/40"
            >
              Clear
            </button>
          </div>
        </div>
      )}
      <table className="w-full text-sm">
        <thead>
          <tr className="bg-maroon-700 text-cream-50 text-left">
            <th className="p-3 rounded-l-lg w-10">
              <input type="checkbox" checked={allSelected} onChange={(e) => onSelectAll(e.target.checked)} />
            </th>
            <th className="p-3">Color</th>
            <th className="p-3">Size</th>
            <th className="p-3">SKU ID</th>
            <th className="p-3">Public Code</th>
            <th className="p-3">Cost Price (Rs)</th>
            <th className="p-3">Stock</th>
            <th className="p-3">Selling Price (Rs)</th>
            <th className="p-3">Discount</th>
            <th className="p-3">Status</th>
            <th className="p-3 rounded-r-lg w-10"></th>
          </tr>
        </thead>
        <tbody>
          {variants.map((v) => {
            const isEditing = editingId === v.id;
            const lowStock = v.stock <= 5;
            return (
              <tr key={v.id} className="border-b border-white/30 hover:bg-white/20">
                <td className="p-3">
                  <input
                    type="checkbox"
                    checked={selectedIds.includes(v.id)}
                    onChange={() => onToggleSelect(v.id)}
                  />
                </td>
                <td className="p-3">
                  <span className="inline-flex items-center gap-2 text-ink-900">
                    <span
                      className="w-3 h-3 rounded-full border border-ink-900/10"
                      style={{ backgroundColor: swatch(v.color) }}
                    />
                    {v.color}
                  </span>
                </td>
                <td className="p-3 text-ink-900">{v.size}</td>
                <td className="p-3 font-mono text-xs text-ink-800">{v.sku}</td>
                <td className="p-3 font-mono text-xs text-maroon-800 font-semibold">{publicCode(v)}</td>
                <td className="p-3 text-ink-900">
                  {isEditing ? (
                    <input
                      type="number"
                      value={draft.cost_price}
                      onChange={(e) => setDraft((d) => ({ ...d, cost_price: e.target.value }))}
                      className="w-20 border border-gold-400 rounded px-1.5 py-0.5 bg-white/60"
                    />
                  ) : (
                    v.cost_price ?? "—"
                  )}
                </td>
                <td className="p-3">
                  {isEditing ? (
                    <input
                      type="number"
                      value={draft.stock}
                      onChange={(e) => setDraft((d) => ({ ...d, stock: e.target.value }))}
                      className="w-16 border border-gold-400 rounded px-1.5 py-0.5 bg-white/60"
                      autoFocus
                    />
                  ) : (
                    <span className={lowStock ? "text-maroon-700 font-semibold" : "text-ink-900"}>
                      {v.stock}
                      {lowStock && " ⚠"}
                    </span>
                  )}
                </td>
                <td className="p-3 text-ink-900">
                  {isEditing ? (
                    <input
                      type="number"
                      value={draft.price}
                      onChange={(e) => setDraft((d) => ({ ...d, price: e.target.value }))}
                      className="w-20 border border-gold-400 rounded px-1.5 py-0.5 bg-white/60"
                    />
                  ) : (
                    v.price
                  )}
                </td>
                <td className="p-3 text-ink-900">
                  {isEditing ? (
                    <div className="flex items-center gap-1">
                      <input
                        type="number"
                        min={0}
                        max={100}
                        value={draft.discount_percent}
                        onChange={(e) => setDraft((d) => ({ ...d, discount_percent: e.target.value }))}
                        className="w-14 border border-gold-400 rounded px-1.5 py-0.5 bg-white/60"
                      />
                      <span className="text-xs text-ink-700">%</span>
                    </div>
                  ) : Number(v.discount_percent) > 0 ? (
                    <div>
                      <span className="text-maroon-700 font-semibold">{v.discount_percent}% off</span>
                      <div className="text-xs text-ink-700/60 line-through">Rs. {v.price}</div>
                      <div className="text-xs text-ink-900 font-medium">Rs. {discountedPrice(v)}</div>
                    </div>
                  ) : (
                    <span className="text-ink-700/50 text-xs">—</span>
                  )}
                </td>
                <td className="p-3">
                  <button
                    onClick={() => toggleStatus(v)}
                    className={`text-xs px-2 py-1 rounded-full capitalize transition-colors ${
                      (v.status || "active") === "active"
                        ? "bg-green-100 text-green-800 hover:bg-green-200"
                        : "bg-white/30 text-ink-800 hover:bg-white/50"
                    }`}
                    title="Tap to toggle Active/Inactive"
                  >
                    {v.status || "active"}
                  </button>
                </td>
                <td className="p-3 relative">
                  {isEditing ? (
                    <div className="flex gap-1">
                      <button onClick={() => saveEdit(v.id)} className="text-green-700 hover:bg-green-50/60 p-1 rounded">
                        <Check size={14} />
                      </button>
                      <button onClick={() => setEditingId(null)} className="text-ink-800 hover:bg-white/30 p-1 rounded">
                        <X size={14} />
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => setOpenMenuId(openMenuId === v.id ? null : v.id)}
                      className="p-1 rounded hover:bg-white/30 text-ink-800"
                    >
                      <MoreVertical size={16} />
                    </button>
                  )}

                  {openMenuId === v.id && (
                    <div className="absolute right-3 top-9 bg-white shadow-lg rounded-lg border border-cream-100 z-10 w-32 overflow-hidden">
                      <button
                        onClick={() => {
                          startEdit(v);
                          setOpenMenuId(null);
                        }}
                        className="w-full text-left px-3 py-2 text-sm hover:bg-cream-50"
                      >
                        Edit stock/price
                      </button>
                      <button
                        onClick={() => deleteVariant(v.id)}
                        className="w-full text-left px-3 py-2 text-sm text-maroon-700 hover:bg-cream-50 flex items-center gap-1.5"
                      >
                        <Trash2 size={13} /> Delete
                      </button>
                    </div>
                  )}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>

      {variants.length === 0 && (
        <p className="text-center text-ink-800/60 py-10 text-sm">
          No variants yet. Add a product with colors and sizes to generate them.
        </p>
      )}
    </div>
  );
}