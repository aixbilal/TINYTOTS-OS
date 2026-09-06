import { useMemo, useState, useEffect } from "react";
import { X, Plus, Sparkles } from "lucide-react";
import ReactQuill from "react-quill-new";
import "react-quill-new/dist/quill.snow.css";
import ImageUploader from "./ImageUploader";
import Button from "../ui/Button";
import { apiFetch } from "../../services/api";

/** True when the ReactQuill HTML carries real text, not just empty markup. */
function hasRealText(html) {
  return !!String(html || "")
    .replace(/<[^>]*>/g, "")
    .replace(/&nbsp;/gi, " ")
    .trim();
}

const FIELD =
  "w-full rounded-md border border-border-default bg-surface-panel px-3 py-2 type-input text-text-primary outline-none transition-[border-color,box-shadow] focus:border-brand focus:ring-2 focus:ring-brand/45 disabled:opacity-60 placeholder:text-text-muted";

/** A quiet titled group inside the form (DESIGN.md §54). */
function Group({ title, children, className = "" }) {
  return (
    <section className={className}>
      <h3 className="type-label uppercase tracking-wide text-text-muted mb-3">{title}</h3>
      {children}
    </section>
  );
}

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
      <label className="block type-field-label text-text-secondary mb-1.5">{label}</label>
      <div className="flex flex-wrap gap-1.5 p-2 border border-border-default rounded-md min-h-[42px] bg-surface-panel focus-within:border-brand focus-within:ring-2 focus-within:ring-brand/45 transition-[border-color,box-shadow]">
        {values.map((v) => (
          <span
            key={v}
            className="inline-flex items-center gap-1 bg-surface-elevated text-text-primary type-caption px-2 py-1 rounded-full"
          >
            {v}
            <button
              type="button"
              onClick={() => onChange(values.filter((x) => x !== v))}
              className="text-text-muted hover:text-text-primary"
              aria-label={`Remove ${v}`}
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
          className="flex-1 min-w-[80px] type-input outline-none bg-transparent text-text-primary placeholder:text-text-muted"
        />
      </div>
      <p className="type-caption text-text-muted mt-1">Press Enter or comma to add</p>
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
  // AI description assistant
  const [highlights, setHighlights] = useState([]);
  const [genLoading, setGenLoading] = useState(false);
  const [genNote, setGenNote] = useState("");
  // Per-variant stock overrides, keyed as "color__size" — lets the admin
  // adjust one specific combo's stock without changing the default for others.
  const [stockOverrides, setStockOverrides] = useState({});
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  // Photos: for "edit" mode we already have a real product id, so fetch its
  // images right away. For "create" mode there's no id until after the
  // product is saved — createdProductId gets set once that happens, which
  // flips the modal into a "photos" step instead of closing immediately.
  const [images, setImages] = useState([]);
  const [createdProductId, setCreatedProductId] = useState(
    mode === "edit" && initialProduct ? initialProduct.id : null
  );

  // Store Assignment — optional catalog metadata (which verified store(s)
  // carry this product). Real active public.locations only; never stock.
  const [locations, setLocations] = useState([]);
  const [locationIds, setLocationIds] = useState(
    mode === "edit" && Array.isArray(initialProduct?.location_ids)
      ? initialProduct.location_ids.map(Number)
      : []
  );

  useEffect(() => {
    fetch("http://localhost:3000/api/locations")
      .then((r) => r.json())
      .then((json) => setLocations(json.success ? json.locations : []))
      .catch(() => setLocations([]));
  }, []);

  function toggleLocation(id) {
    setLocationIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  }

  useEffect(() => {
    if (!createdProductId) return;
    fetch(`http://localhost:3000/api/products/${createdProductId}/images`)
      .then((r) => r.json())
      .then((json) => setImages(json.data || []))
      .catch(() => setImages([]));
  }, [createdProductId]);

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

  const canGenerate = !!form.name.trim() && !!form.category.trim();

  async function generateDescription() {
    if (!canGenerate || genLoading) return;
    if (hasRealText(form.description)) {
      const ok = window.confirm(
        "Replace the current description with an AI-generated draft? Your current text will be lost."
      );
      if (!ok) return;
    }
    setGenLoading(true);
    setGenNote("");
    try {
      const res = await apiFetch("/api/products/generate-description", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: form.name.trim(),
          brand: form.brand.trim(),
          category: form.category.trim(),
          colors,
          sizes,
          highlights,
        }),
      });
      const data = await res.json();
      if (!data.success || !data.description) {
        setGenNote(
          data.message ||
            "Description generation is temporarily unavailable. You can write it manually."
        );
        return;
      }
      setForm((f) => ({ ...f, description: data.description }));
      setGenNote("Draft inserted — edit it before saving.");
    } catch {
      setGenNote(
        "Couldn't reach the server for description generation. You can write it manually."
      );
    } finally {
      setGenLoading(false);
    }
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
          ? "/api/products"
          : `/api/products/${initialProduct.id}`;
      const method = mode === "create" ? "POST" : "PUT";

      const body =
        mode === "create"
          ? { ...form, colors, sizes, variantStocks: stockOverrides, location_ids: locationIds }
          : { ...form, location_ids: locationIds };

      const res = await apiFetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.message || data.error);

      if (data.location_warning) {
        window.alert(data.location_warning);
      }

      onSaved();

      if (mode === "create" && data.product?.id) {
        // Don't close yet — switch straight into the photos step so the
        // product isn't left with no image, same flow as the web admin.
        setCreatedProductId(data.product.id);
      } else {
        onClose();
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }

  // Photos step: shown either because we're editing an existing product,
  // or because a brand-new product was just created in this same session.
  const showPhotosStep = mode === "create" && createdProductId;

  if (showPhotosStep) {
    return (
      <div className="fixed inset-0 bg-surface-overlay tt-anim-fade flex items-center justify-center z-50 p-4">
        <div className="bg-surface-panel border border-border-strong rounded-xl shadow-lg w-full max-w-md p-6 tt-anim-dialog">
          <h2 className="type-heading-sm text-text-primary mb-1">Product created</h2>
          <p className="type-body-sm text-text-secondary mb-4">Add photos now, or skip and add them later.</p>

          <ImageUploader productId={createdProductId} images={images} onImagesChange={setImages} />

          <div className="flex justify-end pt-5">
            <Button onClick={onClose}>Done</Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-surface-overlay tt-anim-fade flex items-center justify-center z-50 p-4">
      <div className="bg-surface-panel border border-border-strong rounded-xl shadow-lg w-full max-w-2xl max-h-[90vh] overflow-y-auto p-6 tt-anim-dialog">
        <div className="flex items-center justify-between mb-5">
          <h2 className="type-heading-sm text-text-primary">
            {mode === "create" ? "Add New Product" : "Edit Product"}
          </h2>
          <button
            onClick={onClose}
            className="text-text-muted hover:text-text-primary rounded-md p-1 hover:bg-surface-elevated transition-colors"
            aria-label="Close"
          >
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <Group title="Identity">
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
          </Group>

          <Group title="Store Assignment">
            <p className="type-caption text-text-muted mb-2">
              Which verified store(s) carry this product. Optional — this is catalogue
              information, not stock.
            </p>
            {locations.length === 0 ? (
              <p className="type-body-sm text-text-secondary">
                No active store locations yet.
              </p>
            ) : (
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => setLocationIds([])}
                  className={`type-caption px-3 py-1.5 rounded-full border transition-colors ${
                    locationIds.length === 0
                      ? "bg-brand border-brand text-pure-white"
                      : "border-border-default text-text-secondary hover:border-brand hover:text-brand"
                  }`}
                >
                  No store assignment
                </button>
                {locations.map((loc) => {
                  const active = locationIds.includes(loc.id);
                  return (
                    <button
                      key={loc.id}
                      type="button"
                      onClick={() => toggleLocation(loc.id)}
                      className={`type-caption px-3 py-1.5 rounded-full border transition-colors ${
                        active
                          ? "bg-brand border-brand text-pure-white"
                          : "border-border-default text-text-secondary hover:border-brand hover:text-brand"
                      }`}
                    >
                      {loc.label}
                    </button>
                  );
                })}
              </div>
            )}
          </Group>

          {mode === "edit" && (
            <Group title="Photos">
              <ImageUploader productId={initialProduct.id} images={images} onImagesChange={setImages} />
            </Group>
          )}

          <Group title="Description">
            <div className="flex items-center justify-between mb-1.5 gap-3">
              <label className="block type-field-label text-text-secondary">Description</label>
              <button
                type="button"
                onClick={generateDescription}
                disabled={!canGenerate || genLoading}
                title={
                  canGenerate
                    ? "Draft a description from the product name, category and details"
                    : "Add a product name and category first"
                }
                className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md border border-border-default text-text-secondary type-caption font-medium hover:border-brand hover:text-brand disabled:opacity-45 disabled:cursor-not-allowed transition-colors"
              >
                <Sparkles size={13} />
                {genLoading ? "Generating…" : "Generate description"}
              </button>
            </div>
            <input
              value={highlights.join(", ")}
              onChange={(e) =>
                setHighlights(
                  e.target.value
                    .split(",")
                    .map((s) => s.trim())
                    .filter(Boolean)
                )
              }
              placeholder="Optional details for the assistant — e.g. elasticated waist, ribbed cuffs"
              className={`${FIELD} mb-2 !py-1.5 type-caption`}
            />
            {genNote && <p className="type-caption text-text-secondary mb-2">{genNote}</p>}
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
          </Group>

          <Group title="Pricing">
            <div className="grid grid-cols-3 gap-4">
              <LabeledInput label="Cost Price (Rs)" type="number" required {...field("cost_price")} />
              <LabeledInput label="Selling Price (Rs)" type="number" required {...field("selling_price")} />
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
              <p className="type-body-sm text-brand bg-brand-soft rounded-md px-3 py-2 mt-3">
                With a {form.discount_percent}% discount, each variant will sell at{" "}
                <strong>Rs. {discountedPreviewPrice}</strong> instead of Rs. {form.selling_price}.
              </p>
            )}
          </Group>

          {mode === "create" && (
            <Group title="Variants">
              <LabeledInput
                label="Initial Stock (default for all variants)"
                type="number"
                required
                {...field("initialStock")}
              />

              <div className="grid grid-cols-2 gap-4 mt-4">
                <TagInput label="Colors" placeholder="Maroon, Black…" values={colors} onChange={setColors} />
                <TagInput label="Sizes" placeholder="S, M, L, XL…" values={sizes} onChange={setSizes} />
              </div>

              {variantCombos.length > 0 && (
                <div className="mt-4">
                  <p className="type-body-sm text-brand bg-brand-soft rounded-md px-3 py-2 mb-2">
                    This will generate <strong>{variantCombos.length}</strong> variants
                    ({colors.length} colors × {sizes.length} sizes). Adjust stock per
                    variant below if any combo needs a different starting count.
                  </p>
                  <div className="border border-border-default rounded-md max-h-56 overflow-y-auto">
                    <table className="w-full type-table">
                      <thead className="bg-surface-sunken sticky top-0">
                        <tr>
                          <th className="text-left px-3 py-2 type-table-head text-text-secondary">Color</th>
                          <th className="text-left px-3 py-2 type-table-head text-text-secondary">Size</th>
                          <th className="text-left px-3 py-2 type-table-head text-text-secondary">Stock</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-border-default">
                        {variantCombos.map(({ key, color, size }) => (
                          <tr key={key}>
                            <td className="px-3 py-1.5">{color}</td>
                            <td className="px-3 py-1.5">{size}</td>
                            <td className="px-3 py-1.5">
                              <input
                                type="number"
                                value={stockFor(key)}
                                onChange={(e) => setStockFor(key, e.target.value)}
                                className="w-20 border border-border-default bg-surface-panel rounded px-2 py-1 type-table text-text-primary outline-none focus:border-brand"
                              />
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </Group>
          )}

          {error && <p className="type-body-sm text-error-text">{error}</p>}

          <div className="flex justify-end gap-3 border-t border-border-default -mx-6 px-6 pt-4">
            <Button type="button" variant="ghost" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={saving} loading={saving}>
              <Plus size={16} />
              {saving ? "Saving…" : mode === "create" ? "Create Product" : "Save Changes"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}

function LabeledInput({ label, required, ...props }) {
  return (
    <div>
      <label className="block type-field-label text-text-secondary mb-1.5">
        {label} {required && <span className="text-brand">*</span>}
      </label>
      <input
        {...props}
        required={required}
        className="w-full rounded-md border border-border-default bg-surface-panel px-3 py-2 type-input text-text-primary outline-none transition-[border-color,box-shadow] focus:border-brand focus:ring-2 focus:ring-brand/45 disabled:opacity-60 placeholder:text-text-muted"
      />
    </div>
  );
}
