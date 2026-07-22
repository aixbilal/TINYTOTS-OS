import { useState } from "react";
import { MoreVertical, Trash2, Check, X, Plus } from "lucide-react";

const COLOR_SWATCH = {
  maroon: "#7A0F1F", black: "#111111", white: "#f5f5f5", olive: "#556B2F",
  sand: "#C2A878", navy: "#1B2A4A", grey: "#888888", gray: "#888888",
  red: "#c0392b", blue: "#2c3e93", green: "#2e6b3e", beige: "#d8c3a5", brown: "#5b3a29",
};

function swatch(color) {
  return COLOR_SWATCH[(color || "").toLowerCase()] || "#B08D57";
}

function publicCode(v) {
  return v.public_code || (v.id != null ? `V-${v.id}` : "—");
}

export default function VariantsTable({ variants, selectedIds, onToggleSelect, onSelectAll, onChanged, productId }) {
  const [editingId, setEditingId] = useState(null);
  const [draft, setDraft] = useState({ stock: "", base_price: "", discount_percent: "" });
  const [openMenuId, setOpenMenuId] = useState(null);
  const [addOpen, setAddOpen] = useState(false);

  const allSelected = variants.length > 0 && selectedIds.length === variants.length;

  function startEdit(v) {
    setEditingId(v.id);
    setDraft({
      stock: v.stock,
      base_price: v.base_price ?? v.price,
      discount_percent: v.discount_percent ?? 0,
    });
  }

  async function saveEdit(id) {
    await fetch(`http://localhost:3000/api/variants/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        stock: Number(draft.stock),
        base_price: Number(draft.base_price),
        discount_percent: Number(draft.discount_percent) || 0,
      }),
    });
    setEditingId(null);
    onChanged();
  }

  async function deleteVariant(id) {
    if (!confirm("Delete this variant? This can't be undone.")) return;
    await fetch(`http://localhost:3000/api/variants/${id}`, { method: "DELETE" });
    setOpenMenuId(null);
    onChanged();
  }

  return (
    <div>
      <div className="flex justify-end mb-3">
        <button
          onClick={() => setAddOpen(true)}
          className="inline-flex items-center gap-1.5 text-sm px-3 py-1.5 rounded-lg border border-maroon-700 text-maroon-700 hover:bg-maroon-50"
        >
          <Plus size={14} /> Add Variant
        </button>
      </div>

      <div className="overflow-x-auto">
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
              <th className="p-3">Stock</th>
              <th className="p-3">Discount %</th>
              <th className="p-3">Price (Rs)</th>
              <th className="p-3">Status</th>
              <th className="p-3 rounded-r-lg w-10"></th>
            </tr>
          </thead>
          <tbody>
            {variants.map((v) => {
              const isEditing = editingId === v.id;
              const lowStock = v.stock <= 5;
              const hasDiscount = Number(v.discount_percent) > 0;
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
                  <td className="p-3">
                    {isEditing ? (
                      <input
                        type="number"
                        min="0"
                        max="100"
                        value={draft.discount_percent}
                        onChange={(e) => setDraft((d) => ({ ...d, discount_percent: e.target.value }))}
                        className="w-16 border border-gold-400 rounded px-1.5 py-0.5 bg-white/60"
                      />
                    ) : (
                      <span className={hasDiscount ? "text-green-700 font-semibold" : "text-ink-800/50"}>
                        {v.discount_percent || 0}%
                      </span>
                    )}
                  </td>
                  <td className="p-3 text-ink-900">
                    {isEditing ? (
                      <input
                        type="number"
                        value={draft.base_price}
                        onChange={(e) => setDraft((d) => ({ ...d, base_price: e.target.value }))}
                        className="w-20 border border-gold-400 rounded px-1.5 py-0.5 bg-white/60"
                        title="Base price (before discount)"
                      />
                    ) : hasDiscount ? (
                      <span>
                        <span className="line-through text-ink-800/40 mr-1.5">{v.base_price}</span>
                        {v.price}
                      </span>
                    ) : (
                      v.price
                    )}
                  </td>
                  <td className="p-3">
                    <span className="text-xs px-2 py-1 rounded-full bg-white/30 text-ink-800 capitalize">
                      {v.status || "active"}
                    </span>
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
                      <div className="absolute right-3 top-9 bg-white shadow-lg rounded-lg border border-cream-100 z-10 w-40 overflow-hidden">
                        <button
                          onClick={() => {
                            startEdit(v);
                            setOpenMenuId(null);
                          }}
                          className="w-full text-left px-3 py-2 text-sm hover:bg-cream-50"
                        >
                          Edit stock/price/discount
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

      {addOpen && (
        <AddVariantModal
          productId={productId}
          onClose={() => setAddOpen(false)}
          onAdded={() => {
            setAddOpen(false);
            onChanged();
          }}
        />
      )}
    </div>
  );
}

function AddVariantModal({ productId, onClose, onAdded }) {
  const [colors, setColors] = useState("");
  const [sizes, setSizes] = useState("");
  const [price, setPrice] = useState("");
  const [costPrice, setCostPrice] = useState("");
  const [discountPercent, setDiscountPercent] = useState("");
  const [stock, setStock] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    const colorList = colors.split(",").map((c) => c.trim()).filter(Boolean);
    const sizeList = sizes.split(",").map((s) => s.trim()).filter(Boolean);

    if (!colorList.length || !sizeList.length) {
      setError("Enter at least one color and one size.");
      return;
    }

    setSaving(true);
    try {
      const res = await fetch(`http://localhost:3000/api/products/${productId}/variants`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          colors: colorList,
          sizes: sizeList,
          price: Number(price),
          cost_price: Number(costPrice),
          discount_percent: Number(discountPercent) || 0,
          initialStock: Number(stock),
        }),
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.message || data.error);
      onAdded();
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 bg-ink-900/40 flex items-center justify-center z-50 p-4">
      <form onSubmit={handleSubmit} className="bg-cream-50 rounded-2xl w-full max-w-md p-6 space-y-3">
        <div className="flex items-center justify-between mb-2">
          <h3 className="font-display text-xl text-ink-900">Add Variant(s)</h3>
          <button type="button" onClick={onClose} className="text-ink-700 hover:text-maroon-700">
            <X size={18} />
          </button>
        </div>
        <p className="text-xs text-ink-700/60">
          Adds new color/size combinations to this existing product. Any combo that
          already exists will be rejected — edit that variant directly instead.
        </p>
        <div>
          <label className="block text-sm text-ink-700 mb-1">Colors (comma-separated)</label>
          <input value={colors} onChange={(e) => setColors(e.target.value)} placeholder="Maroon, Navy"
            className="w-full border border-gold-300/50 rounded-lg px-3 py-2 text-sm" />
        </div>
        <div>
          <label className="block text-sm text-ink-700 mb-1">Sizes (comma-separated)</label>
          <input value={sizes} onChange={(e) => setSizes(e.target.value)} placeholder="2-3, 4-5"
            className="w-full border border-gold-300/50 rounded-lg px-3 py-2 text-sm" />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-sm text-ink-700 mb-1">Cost Price</label>
            <input type="number" value={costPrice} onChange={(e) => setCostPrice(e.target.value)}
              className="w-full border border-gold-300/50 rounded-lg px-3 py-2 text-sm" required />
          </div>
          <div>
            <label className="block text-sm text-ink-700 mb-1">Selling Price</label>
            <input type="number" value={price} onChange={(e) => setPrice(e.target.value)}
              className="w-full border border-gold-300/50 rounded-lg px-3 py-2 text-sm" required />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-sm text-ink-700 mb-1">Discount %</label>
            <input type="number" min="0" max="100" value={discountPercent} onChange={(e) => setDiscountPercent(e.target.value)}
              className="w-full border border-gold-300/50 rounded-lg px-3 py-2 text-sm" />
          </div>
          <div>
            <label className="block text-sm text-ink-700 mb-1">Initial Stock</label>
            <input type="number" value={stock} onChange={(e) => setStock(e.target.value)}
              className="w-full border border-gold-300/50 rounded-lg px-3 py-2 text-sm" required />
          </div>
        </div>
        {error && <p className="text-sm text-maroon-700">{error}</p>}
        <div className="flex justify-end gap-3 pt-1">
          <button type="button" onClick={onClose} className="px-4 py-2 rounded-lg text-ink-900 hover:bg-cream-100">Cancel</button>
          <button type="submit" disabled={saving}
            className="px-5 py-2 rounded-lg bg-maroon-700 text-cream-50 font-medium hover:bg-maroon-800 disabled:opacity-60">
            {saving ? "Adding…" : "Add Variant(s)"}
          </button>
        </div>
      </form>
    </div>
  );
}