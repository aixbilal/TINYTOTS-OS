import ReactQuill from "react-quill-new";
import "react-quill-new/dist/quill.snow.css";
import { useState } from "react";
import { X, Plus } from "lucide-react";

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

// NOTE: public_code lives on `variants`, not `products` — it's DB-derived as
// V-{variant id} after each variant row is inserted, so it is never a form field.
const emptyForm = {
  name: "", brand: "", category: "", sku: "", hsn_code: "",
  unit: "Pcs", description: "", cost_price: "", selling_price: "", initialStock: "",
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
          initialStock: "",
        }
      : emptyForm
  );
  const [colors, setColors] = useState([]);
  const [sizes, setSizes] = useState([]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  function field(key) {
    return {
      value: form[key],
      onChange: (e) => setForm((f) => ({ ...f, [key]: e.target.value })),
    };
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
          ? { ...form, colors, sizes }
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
              }}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
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
          </div>

          {mode === "create" && (
            <>
              <LabeledInput
                label="Initial Stock (per variant)"
                type="number"
                required
                {...field("initialStock")}
              />

              <div className="grid grid-cols-2 gap-4">
                <TagInput label="Colors" placeholder="Maroon, Black…" values={colors} onChange={setColors} />
                <TagInput label="Sizes" placeholder="S, M, L, XL…" values={sizes} onChange={setSizes} />
              </div>

              {colors.length > 0 && sizes.length > 0 && (
                <p className="text-sm text-maroon-700 bg-maroon-100 rounded-lg px-3 py-2">
                  This will generate <strong>{colors.length * sizes.length}</strong> variants
                  ({colors.length} colors × {sizes.length} sizes). Each variant will get its own
                  auto-generated Public Code (e.g. <code>V-246</code>) once saved.
                </p>
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