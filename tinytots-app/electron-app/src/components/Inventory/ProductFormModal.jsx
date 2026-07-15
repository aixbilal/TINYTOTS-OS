import { useMemo, useState } from "react";
import { X, Plus } from "lucide-react";
import ReactQuill from "react-quill-new";
import "react-quill-new/dist/quill.snow.css";

function TagInput({ label, placeholder, values, onChange }) {
  const [draft, setDraft] = useState("");

  function commit() {
    const cleaned = draft.trim();
    if (cleaned && !values.includes(cleaned)) {
      onChange([...values, cleaned]);
    }
    setDraft("");
  }

  return (
    <div>
      <label className="block text-sm text-ink-700 mb-1.5">{label}</label>
      <div className="flex flex-wrap gap-1.5 p-2 border border-gold-300/50 rounded-lg min-h-[42px]">
        {values.map((v) => (
          <span
            key={v}
            className="inline-flex items-center gap-1 bg-cream-100 text-ink-900 text-xs px-2 py-1 rounded-full"
          >
            {v}
            <button
              type="button"
              onClick={() => onChange(values.filter((x) => x !== v))}
              className="text-ink-700 hover:text-maroon-700"
            >
              <X size={12} />
            </button>
          </span>
        ))}
        <input
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === ",") {
              e.preventDefault();
              commit();
            }
          }}
          onBlur={commit}
          placeholder={values.length ? "" : placeholder}
          className="flex-1 min-w-[80px] text-sm outline-none bg-transparent"
        />
      </div>
      <p className="text-xs text-ink-700/60 mt-1">Press Enter or comma to add</p>
    </div>
  );
}

const emptyForm = {
  name: "", brand: "", category: "", sku: "", hsn_code: "",
  unit: "Pcs", description: "", cost_price: "", selling_price: "",
  discount_percent: "", initialStock: "",
};

export default function ProductFormModal({ mode = "create", initialProduct, onClose, onSaved }) {
  const [form, setForm] = useState(
    mode === "edit" && initialProduct
      ? {
          name: initialProduct.name || "", brand: initialProduct.brand || "",
          category: initialProduct.category || "", sku: initialProduct.sku || "",
          hsn_code: initialProduct.hsn_code || "", unit: initialProduct.unit || "Pcs",
          description: initialProduct.description || "",
          cost_price: initialProduct.cost_price ?? "",
          selling_price: initialProduct.selling_price ?? "",
          discount_percent: "",
          initialStock: "",
        }
      : emptyForm
  );
  const [colors, setColors] = useState([]);
  const [sizes, setSizes] = useState([]);
  // Per-variant stock overrides, keyed as "color__size" — lets the admin
  // adjust one specific combo's stock without changing the default for others.
  const [stockOverrides, setStockOverrides] = useState({});
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  function field(key) {
    return {
      value: form[key],
      onChange: (e) => setForm((f) => ({ ...f, [key]: e.target.value })),
    };
  }

  const variantCombos = useMemo(() => {
    const combos = [];
    for (const color of colors) {
      for (const size of sizes) {
        combos.push({ key: `${color}__${size}`, color, size });
      }
    }
    return combos;
  }, [colors, sizes]);

  const discountedPreviewPrice = useMemo(() => {
    const base = Number(form.selling_price) || 0;
    const pct = Number(form.discount_percent) || 0;
    if (!pct) return null;
    return Math.round(base * (1 - pct / 100) * 100) / 100;
  }, [form.selling_price, form.discount_percent]);

  function stockFor(key) {
    return stockOverrides[key] ?? form.initialStock ?? "";
  }

  function setStockFor(key, value) {
    setStockOverrides((prev) => ({ ...prev, [key]: value }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");

    if (mode === "create" && (!colors.length || !sizes.length)) {
      setError("Add at least one color and one size to generate variants.");
      return;
    }

    setSaving(true);
    try {
      const url =
        mode === "create"
          ? "http://localhost:3000/api/products"
          : `http://localhost:3000/api/products/${initialProduct.id}`;
      const method = mode === "create" ? "POST" : "PUT";

      const body =
        mode === "create"
          ? { ...form, colors, sizes, variantStocks: stockOverrides }
          : form;

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.message || data.error);

      onSaved();
      onClose();
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 bg-ink-900/40 flex items-center justify-center z-50 p-4">
      <div className="bg-cream-50 rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto p-7">
        <div className="flex items-center justify-between mb-5">
          <h2 className="font-display text-2xl text-ink-900">
            {mode === "create" ? "Add New Product" : "Edit Product"}
          </h2>
          <button onClick={onClose} className="text-ink-700 hover:text-maroon-700">
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <LabeledInput label="Product Name" required {...field("name")} />
            <LabeledInput label="Brand" {...field("brand")} />
            <LabeledInput label="Category" {...field("category")} placeholder="Shirts, Pants…" />
            <LabeledInput
              label="Base SKU"
              required
              disabled={mode === "edit"}
              {...field("sku")}
              placeholder="EGSHIRT"
            />
            <LabeledInput label="HSN Code" {...field("hsn_code")} />
            <LabeledInput label="Unit" {...field("unit")} />
          </div>

          <div>
            <label className="block text-sm text-ink-700 mb-1.5">Description</label>
            <ReactQuill
              theme="snow"
              value={form.description}
              onChange={(html) => setForm((f) => ({ ...f, description: html }))}
              modules={{
                toolbar: [
                  ["bold", "italic", "underline"],
                  [{ header: [2, 3, false] }],
                  [{ list: "ordered" }, { list: "bullet" }],
                  ["clean"],
                ],
                clipboard: {
                  matchVisual: false,
                  matchers: [
                    [
                      Node.ELEMENT_NODE,
                      (node, delta) => {
                        delta.ops.forEach((op) => {
                          if (op.attributes) {
                            delete op.attributes.color;
                            delete op.attributes.background;
                            delete op.attributes.font;
                          }
                        });
                        return delta;
                      },
                    ],
                  ],
                },
              }}
            />
          </div>

          <div className="grid grid-cols-3 gap-4">
            <LabeledInput
              label="Cost Price (Rs)"
              type="number"
              required
              {...field("cost_price")}
            />
            <LabeledInput
              label="Selling Price (Rs)"
              type="number"
              required
              {...field("selling_price")}
            />
            <LabeledInput
              label="Discount (%)"
              type="number"
              min="0"
              max="100"
              placeholder="0"
              {...field("discount_percent")}
            />
          </div>

          {discountedPreviewPrice !== null && (
            <p className="text-sm text-maroon-700 bg-maroon-100 rounded-lg px-3 py-2">
              With a {form.discount_percent}% discount, each variant will sell at{" "}
              <strong>Rs. {discountedPreviewPrice}</strong> instead of Rs. {form.selling_price}.
            </p>
          )}

          {mode === "create" && (
            <>
              <LabeledInput
                label="Initial Stock (default for all variants)"
                type="number"
                required
                {...field("initialStock")}
              />

              <div className="grid grid-cols-2 gap-4">
                <TagInput label="Colors" placeholder="Maroon, Black…" values={colors} onChange={setColors} />
                <TagInput label="Sizes" placeholder="S, M, L, XL…" values={sizes} onChange={setSizes} />
              </div>

              {variantCombos.length > 0 && (
                <div>
                  <p className="text-sm text-maroon-700 bg-maroon-100 rounded-lg px-3 py-2 mb-2">
                    This will generate <strong>{variantCombos.length}</strong> variants
                    ({colors.length} colors × {sizes.length} sizes). Adjust stock per
                    variant below if any combo needs a different starting count.
                  </p>
                  <div className="border border-gold-300/50 rounded-lg max-h-56 overflow-y-auto">
                    <table className="w-full text-sm">
                      <thead className="bg-cream-100 sticky top-0">
                        <tr>
                          <th className="text-left px-3 py-2 font-medium text-ink-700">Color</th>
                          <th className="text-left px-3 py-2 font-medium text-ink-700">Size</th>
                          <th className="text-left px-3 py-2 font-medium text-ink-700">Stock</th>
                        </tr>
                      </thead>
                      <tbody>
                        {variantCombos.map(({ key, color, size }) => (
                          <tr key={key} className="border-t border-gold-300/30">
                            <td className="px-3 py-1.5">{color}</td>
                            <td className="px-3 py-1.5">{size}</td>
                            <td className="px-3 py-1.5">
                              <input
                                type="number"
                                value={stockFor(key)}
                                onChange={(e) => setStockFor(key, e.target.value)}
                                className="w-20 border border-gold-300/50 rounded px-2 py-1 text-sm"
                              />
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </>
          )}

          {error && <p className="text-sm text-maroon-700">{error}</p>}

          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-lg text-ink-900 hover:bg-cream-100"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="px-5 py-2 rounded-lg bg-maroon-700 text-cream-50 font-medium hover:bg-maroon-800 disabled:opacity-60 inline-flex items-center gap-2"
            >
              <Plus size={16} />
              {saving ? "Saving…" : mode === "create" ? "Create Product" : "Save Changes"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function LabeledInput({ label, required, ...props }) {
  return (
    <div>
      <label className="block text-sm text-ink-700 mb-1.5">
        {label} {required && <span className="text-maroon-700">*</span>}
      </label>
      <input
        {...props}
        required={required}
        className="w-full border border-gold-300/50 rounded-lg px-3 py-2 text-sm outline-none focus:border-maroon-700 disabled:bg-cream-100 disabled:text-ink-700"
      />
    </div>
  );
}