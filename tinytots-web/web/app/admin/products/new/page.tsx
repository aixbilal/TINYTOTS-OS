"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import RichTextEditor from "@/components/admin/RichTextEditor";
import TagInput from "@/components/admin/TagInput";
import CategorySelect from "@/components/admin/CategorySelect";
import ImageUploader from "@/components/admin/ImageUploader";
import { adminFetch } from "@/lib/admin-fetch";
import { computeWebPrice, formatRs } from "@/lib/web-pricing";

type ProductImage = { id: number; storage_path: string; is_primary: boolean; sort_order: number; url: string };

const GENDERS = [
  { value: "", label: "Not specified" },
  { value: "boy", label: "Boy" },
  { value: "girl", label: "Girl" },
  { value: "unisex", label: "Unisex" },
];
const AGE_BRACKETS = ["0-1", "1-3", "3-5", "5-8", "8-14"];

const STEPS = ["Product", "Variants & pricing", "Description", "Photos", "Review"] as const;

const inputClass =
  "w-full border rounded-lg px-4 py-2 bg-surface-elevated text-text-primary font-body-md text-body-md border-border-default focus:border-brand-primary focus:outline-none";

export default function NewProductPage() {
  const router = useRouter();

  // ---- step state ---------------------------------------------------
  const [step, setStep] = useState(0);
  const [createdId, setCreatedId] = useState<number | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // ---- step 1: product -------------------------------------------------
  const [name, setName] = useState("");
  const [sku, setSku] = useState("");
  const [brand, setBrand] = useState("");
  const [category, setCategory] = useState("");
  const [gender, setGender] = useState("");
  const [ageBracket, setAgeBracket] = useState("");

  // ---- step 2: variants & pricing -----------------------------------
  const [costPrice, setCostPrice] = useState("");
  const [shopBasePrice, setShopBasePrice] = useState("");
  const [shopDiscountPercent, setShopDiscountPercent] = useState("0");
  const [webDiscountPercent, setWebDiscountPercent] = useState("0");
  const [initialStock, setInitialStock] = useState("");
  const [colors, setColors] = useState<string[]>([]);
  const [sizes, setSizes] = useState<string[]>([]);
  const [stockOverrides, setStockOverrides] = useState<Record<string, string>>({});

  // global online-pricing defaults (mirror of the DB trigger)
  const [markupPercent, setMarkupPercent] = useState(25);
  const [roundTo, setRoundTo] = useState(50);

  // ---- step 3: description -----------------------------------------
  const [description, setDescription] = useState("");
  const [highlights, setHighlights] = useState<string[]>([]);
  const [genLoading, setGenLoading] = useState(false);
  const [genNote, setGenNote] = useState<string | null>(null);

  // ---- step 4: photos --------------------------------------------
  const [images, setImages] = useState<ProductImage[]>([]);

  const genderLabel = GENDERS.find((g) => g.value === gender)?.label ?? "Not specified";

  useEffect(() => {
    adminFetch("/api/admin/pricing-defaults")
      .then((r) => (r.ok ? r.json() : null))
      .then((j) => {
        if (!j) return;
        if (Number.isFinite(j.markupPercent)) setMarkupPercent(j.markupPercent);
        if (j.roundTo === 100 || j.roundTo === 50) setRoundTo(j.roundTo);
      })
      .catch(() => {});
  }, []);

  const shopBaseNum = parseFloat(shopBasePrice);
  const shopDiscNum = parseFloat(shopDiscountPercent || "0");
  const webDiscNum = parseFloat(webDiscountPercent || "0");
  const shopFinal =
    Number.isFinite(shopBaseNum) && shopBaseNum >= 0
      ? Math.round(shopBaseNum * (1 - (Number.isFinite(shopDiscNum) ? shopDiscNum : 0) / 100) * 100) / 100
      : null;

  const webPreview = useMemo(() => {
    if (shopFinal == null) return null;
    return computeWebPrice({
      shopBasePrice: Number.isFinite(shopBaseNum) ? shopBaseNum : 0,
      markupPercent,
      webDiscountPercent: Number.isFinite(webDiscNum) ? webDiscNum : 0,
      roundTo,
    });
  }, [shopFinal, shopBaseNum, markupPercent, webDiscNum, roundTo]);

  const variantCombos = useMemo(() => {
    const combos: { key: string; color: string; size: string }[] = [];
    for (const color of colors) for (const size of sizes) combos.push({ key: `${color}__${size}`, color, size });
    return combos;
  }, [colors, sizes]);

  function stockFor(key: string) {
    return stockOverrides[key] ?? initialStock ?? "";
  }
  function setStockFor(key: string, value: string) {
    setStockOverrides((prev) => ({ ...prev, [key]: value }));
  }

  // ---- validation per step ----------------------------------------
  function validateStep(s: number): string | null {
    if (s === 0) {
      if (!name.trim()) return "Product name is required.";
      if (!sku.trim()) return "SKU is required.";
      if (!category.trim()) return "Please select a category.";
      return null;
    }
    if (s === 1) {
      const cost = costPrice === "" ? 0 : parseFloat(costPrice);
      if (!Number.isFinite(cost) || cost < 0) return "Cost price must be zero or more.";
      if (shopFinal == null || shopFinal < 0) return "Enter a valid shop selling price.";
      if (!colors.length || !sizes.length) return "Add at least one colour and one size.";
      for (const c of variantCombos) {
        const n = parseInt(stockFor(c.key) || "0", 10);
        if (!Number.isInteger(n) || n < 0) return "Stock must be a whole number of zero or more.";
      }
      return null;
    }
    return null;
  }

  function goNext() {
    setError(null);
    const v = validateStep(step);
    if (v) return setError(v);

    // Leaving the Description step for the first time = create the product.
    if (step === 2 && createdId == null) {
      void createProduct();
      return;
    }
    setStep((s) => Math.min(s + 1, STEPS.length - 1));
  }

  function goBack() {
    setError(null);
    // Once the product exists, steps 1-3 are locked (see note on those steps).
    setStep((s) => Math.max(s - 1, createdId != null ? 3 : 0));
  }

  async function createProduct() {
    setSubmitting(true);
    setError(null);
    try {
      const shopPriceNum = shopFinal ?? 0;
      const webPriceNum = webPreview?.webPrice ?? shopPriceNum;
      const variants = variantCombos.map((c) => ({
        color: c.color,
        size: c.size,
        cost_price: costPrice ? parseFloat(costPrice) : 0,
        base_price: Number.isFinite(shopBaseNum) ? shopBaseNum : shopPriceNum,
        discount_percent: Number.isFinite(shopDiscNum) ? shopDiscNum : 0,
        price: shopPriceNum,
        web_discount_percent: Number.isFinite(webDiscNum) ? webDiscNum : 0,
        web_price: webPriceNum,
        stock: parseInt(stockFor(c.key) || "0", 10),
        reorder_level: 5,
      }));

      const res = await adminFetch("/api/products", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          sku: sku.trim(),
          description,
          brand: brand.trim() || null,
          category,
          image_url: null,
          gender: gender || null,
          age_bracket: ageBracket || null,
          cost_price: costPrice ? parseFloat(costPrice) : 0,
          selling_price: shopPriceNum,
          variants,
        }),
      });
      const json = await res.json();
      if (!res.ok) {
        setError(json.error || "Failed to create product.");
        // Send the operator back to the field most likely at fault.
        if (res.status === 409) setStep(0);
        setSubmitting(false);
        return;
      }
      setCreatedId(json.data.id);
      setStep(3); // Photos
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  async function generateDescription() {
    setGenLoading(true);
    setGenNote(null);
    try {
      const res = await adminFetch("/api/admin/products/generate-description", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          brand: brand.trim(),
          category,
          gender,
          age_bracket: ageBracket,
          colors,
          sizes,
          highlights,
        }),
      });
      const json = await res.json();
      if (!res.ok) {
        setGenNote(
          json.error ||
            "Description generation is temporarily unavailable. You can write the description manually."
        );
        return;
      }
      setDescription(json.description || "");
      setGenNote("Draft inserted below — edit it before saving.");
    } catch {
      setGenNote(
        "Description generation is temporarily unavailable. You can write the description manually."
      );
    } finally {
      setGenLoading(false);
    }
  }

  function finish() {
    if (createdId == null) return;
    router.push(`/admin/products/${createdId}?justCreated=1`);
  }

  const locked = createdId != null; // steps 1-3 frozen after creation

  return (
    <div className="max-w-2xl">
      <h1 className="font-display-md text-display-md text-text-primary mb-2">Add Product</h1>
      <p className="font-body-sm text-body-sm text-text-secondary mb-5">
        A guided five-step flow. The product is created after the description step so photos can be attached.
      </p>

      {/* progress */}
      <ol className="flex flex-wrap gap-x-2 gap-y-1 mb-6 font-label-md text-label-md">
        {STEPS.map((label, i) => (
          <li
            key={label}
            className={`flex items-center gap-2 ${
              i === step ? "text-brand-primary font-semibold" : i < step ? "text-text-primary" : "text-text-secondary"
            }`}
          >
            <span
              className={`inline-flex h-5 w-5 items-center justify-center rounded-full text-[11px] ${
                i === step
                  ? "bg-brand-primary text-white"
                  : i < step
                    ? "bg-brand-primary/20 text-brand-primary"
                    : "bg-surface-secondary text-text-secondary"
              }`}
            >
              {i < step ? "✓" : i + 1}
            </span>
            {label}
            {i < STEPS.length - 1 && <span className="text-text-secondary/40">›</span>}
          </li>
        ))}
      </ol>

      {locked && step < 3 && (
        <p className="font-body-sm text-body-sm text-brand-primary bg-brand-primary/10 rounded-lg px-3 py-2 mb-4">
          Product created. These details are now locked here — change them on the product page after you finish.
        </p>
      )}

      {/* ---- STEP 1: PRODUCT ---- */}
      {step === 0 && (
        <div className="flex flex-col gap-4">
          <div className="grid grid-cols-2 gap-4">
            <label className="flex flex-col gap-1 font-label-md text-label-md text-text-secondary">
              Product name
              <input value={name} onChange={(e) => setName(e.target.value)} className={inputClass} disabled={locked} />
            </label>
            <label className="flex flex-col gap-1 font-label-md text-label-md text-text-secondary">
              SKU
              <input value={sku} onChange={(e) => setSku(e.target.value)} className={inputClass} disabled={locked} />
            </label>
            <label className="flex flex-col gap-1 font-label-md text-label-md text-text-secondary">
              Brand <span className="text-text-secondary/60">(optional)</span>
              <input value={brand} onChange={(e) => setBrand(e.target.value)} className={inputClass} disabled={locked} />
            </label>
            <label className="flex flex-col gap-1 font-label-md text-label-md text-text-secondary">
              Category
              <CategorySelect value={category} onChange={setCategory} className={inputClass} />
            </label>
            <label className="flex flex-col gap-1 font-label-md text-label-md text-text-secondary">
              Gender <span className="text-text-secondary/60">(optional)</span>
              <select value={gender} onChange={(e) => setGender(e.target.value)} className={inputClass} disabled={locked}>
                {GENDERS.map((g) => (
                  <option key={g.value} value={g.value}>{g.label}</option>
                ))}
              </select>
            </label>
            <label className="flex flex-col gap-1 font-label-md text-label-md text-text-secondary">
              Age bracket <span className="text-text-secondary/60">(optional)</span>
              <select value={ageBracket} onChange={(e) => setAgeBracket(e.target.value)} className={inputClass} disabled={locked}>
                <option value="">Not specified</option>
                {AGE_BRACKETS.map((a) => (
                  <option key={a} value={a}>{a} yrs</option>
                ))}
              </select>
            </label>
          </div>
        </div>
      )}

      {/* ---- STEP 2: VARIANTS & PRICING ---- */}
      {step === 1 && (
        <div className="flex flex-col gap-5">
          <div className="grid grid-cols-3 gap-4">
            <label className="flex flex-col gap-1 font-label-md text-label-md text-text-secondary">
              Cost price (Rs)
              <input type="number" min="0" value={costPrice} onChange={(e) => setCostPrice(e.target.value)} className={inputClass} disabled={locked} />
            </label>
            <label className="flex flex-col gap-1 font-label-md text-label-md text-text-secondary">
              Shop selling price (Rs)
              <input type="number" min="0" value={shopBasePrice} onChange={(e) => setShopBasePrice(e.target.value)} className={inputClass} disabled={locked} />
            </label>
            <label className="flex flex-col gap-1 font-label-md text-label-md text-text-secondary">
              Shop discount %
              <input type="number" min="0" max="100" value={shopDiscountPercent} onChange={(e) => setShopDiscountPercent(e.target.value)} className={inputClass} disabled={locked} />
            </label>
          </div>

          {/* channel preview */}
          <div className="rounded-lg border border-border-default p-4 flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <span className="font-headline-md text-headline-md text-text-primary">Physical shop</span>
              <span className="font-body-md text-body-md text-text-primary font-semibold">{formatRs(shopFinal)}</span>
            </div>
            <div className="border-t border-border-default pt-3">
              <div className="flex items-center justify-between mb-2">
                <span className="font-headline-md text-headline-md text-text-primary">Website</span>
                <span className="font-body-md text-body-md text-text-primary font-semibold">{formatRs(webPreview?.webPrice)}</span>
              </div>
              <dl className="grid grid-cols-2 gap-y-1 font-body-sm text-body-sm text-text-secondary">
                <dt>Base after {markupPercent}% markup</dt>
                <dd className="text-right">{formatRs(webPreview?.webBasePrice)}</dd>
                <dt className="flex items-center gap-2">
                  Web discount %
                  <input
                    type="number"
                    min="0"
                    max="100"
                    value={webDiscountPercent}
                    onChange={(e) => setWebDiscountPercent(e.target.value)}
                    className="w-16 border border-border-default rounded px-2 py-0.5 bg-surface-elevated"
                    disabled={locked}
                  />
                </dt>
                <dd className="text-right">{webDiscNum > 0 ? `−${webDiscNum}%` : "—"}</dd>
                <dt>Final website price</dt>
                <dd className="text-right font-semibold text-text-primary">{formatRs(webPreview?.webPrice)}</dd>
              </dl>
              <p className="font-label-md text-label-md text-text-secondary/80 mt-2">
                The website price is set by the system: shop price + {markupPercent}% markup, rounded up to the
                nearest Rs. {roundTo}. This preview matches what will be stored. To set a website price by hand,
                lock the variant on the product page after creating it.
              </p>
            </div>
          </div>

          <div className="border-t border-border-default pt-4">
            <h2 className="font-headline-md text-headline-md text-text-primary mb-3">Variants</h2>
            <div className="grid grid-cols-2 gap-4 mb-3">
              <TagInput label="Colours" placeholder="Maroon, Black..." values={colors} onChange={setColors} />
              <TagInput label="Sizes" placeholder="S, M, L, XL..." values={sizes} onChange={setSizes} />
            </div>
            <label className="flex flex-col gap-1 font-label-md text-label-md text-text-secondary mb-3 max-w-[240px]">
              Default stock per variant
              <input type="number" min="0" value={initialStock} onChange={(e) => setInitialStock(e.target.value)} className={inputClass} disabled={locked} />
            </label>

            {variantCombos.length > 0 && (
              <div>
                <p className="font-body-sm text-body-sm text-brand-primary bg-brand-primary/10 rounded-lg px-3 py-2 mb-2">
                  This will generate <strong>{variantCombos.length}</strong> variants
                  ({colors.length} colours × {sizes.length} sizes). Adjust stock per combo below if needed.
                </p>
                <div className="border border-border-default rounded-lg max-h-56 overflow-y-auto">
                  <table className="w-full font-body-sm text-body-sm">
                    <thead className="bg-surface-secondary sticky top-0">
                      <tr>
                        <th className="text-left px-3 py-2 text-text-secondary">Colour</th>
                        <th className="text-left px-3 py-2 text-text-secondary">Size</th>
                        <th className="text-left px-3 py-2 text-text-secondary">Stock</th>
                      </tr>
                    </thead>
                    <tbody>
                      {variantCombos.map(({ key, color, size }) => (
                        <tr key={key} className="border-t border-border-default">
                          <td className="px-3 py-1.5">{color}</td>
                          <td className="px-3 py-1.5">{size}</td>
                          <td className="px-3 py-1.5">
                            <input
                              type="number"
                              min="0"
                              value={stockFor(key)}
                              onChange={(e) => setStockFor(key, e.target.value)}
                              className="w-20 border border-border-default rounded px-2 py-1 bg-surface-elevated"
                              disabled={locked}
                            />
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ---- STEP 3: DESCRIPTION ---- */}
      {step === 2 && (
        <div className="flex flex-col gap-4">
          <div>
            <TagInput
              label="Product highlights for the description (optional)"
              placeholder="e.g. elasticated waist, ribbed cuffs"
              values={highlights}
              onChange={setHighlights}
            />
            <p className="font-label-md text-label-md text-text-secondary/70 mt-1">
              Only add facts you know are true. These are the only extra details sent to the description assistant.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={generateDescription}
              disabled={genLoading || !name.trim() || !category}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-brand-primary text-brand-primary font-button text-button hover:bg-brand-primary/10 disabled:opacity-50"
            >
              {genLoading ? "Generating…" : "Generate description ✨"}
            </button>
            {genNote && <span className="font-label-md text-label-md text-text-secondary">{genNote}</span>}
          </div>

          <div>
            <label className="block font-label-md text-label-md text-text-secondary mb-1.5">Description</label>
            <RichTextEditor value={description} onChange={setDescription} />
          </div>
        </div>
      )}

      {/* ---- STEP 4: PHOTOS ---- */}
      {step === 3 && (
        <div className="flex flex-col gap-3">
          {createdId == null ? (
            <p className="font-body-sm text-body-sm text-red-700">Product not created yet — go back a step.</p>
          ) : (
            <>
              <p className="font-body-sm text-body-sm text-text-secondary">
                Add one or more photos. The first becomes the primary image; drag to reorder. Square photos on a
                plain background work best.
              </p>
              <ImageUploader productId={createdId} images={images} onImagesChange={setImages} />
            </>
          )}
        </div>
      )}

      {/* ---- STEP 5: REVIEW ---- */}
      {step === 4 && (
        <div className="flex flex-col gap-4 font-body-sm text-body-sm">
          <div className="rounded-lg border border-border-default p-4">
            <h2 className="font-headline-md text-headline-md text-text-primary mb-2">{name}</h2>
            <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-1 text-text-secondary">
              <dt>SKU</dt><dd className="text-text-primary">{sku}</dd>
              <dt>Category</dt><dd className="text-text-primary">{category}</dd>
              <dt>Brand</dt><dd className="text-text-primary">{brand || "—"}</dd>
              <dt>Gender / age</dt><dd className="text-text-primary">{genderLabel}{ageBracket ? ` · ${ageBracket} yrs` : ""}</dd>
              <dt>Physical price</dt><dd className="text-text-primary">{formatRs(shopFinal)}</dd>
              <dt>Website price</dt><dd className="text-text-primary">{formatRs(webPreview?.webPrice)}</dd>
              <dt>Variants</dt><dd className="text-text-primary">{variantCombos.length} ({colors.join(", ")} × {sizes.join(", ")})</dd>
              <dt>Photos</dt><dd className="text-text-primary">{images.length}</dd>
            </dl>
          </div>
          <div className="rounded-lg border border-border-default p-4">
            <p className="font-label-md text-label-md text-text-secondary mb-1">Description</p>
            <div
              className="prose prose-sm max-w-none text-text-primary"
              dangerouslySetInnerHTML={{ __html: description || "<em>No description</em>" }}
            />
          </div>
          <p className="font-label-md text-label-md text-text-secondary">
            The product is already saved and live. Finishing takes you to its page for any further edits.
          </p>
        </div>
      )}

      {error && <p className="font-label-md text-label-md text-red-700 mt-4">{error}</p>}

      {/* ---- nav ---- */}
      <div className="flex items-center justify-between mt-6 pt-4 border-t border-border-default">
        <button
          type="button"
          onClick={goBack}
          disabled={step === 0 || (locked && step === 3) || submitting}
          className="px-4 py-2 rounded-lg font-button text-button text-text-secondary hover:text-text-primary disabled:opacity-40"
        >
          Back
        </button>
        {step < STEPS.length - 1 ? (
          <button
            type="button"
            onClick={goNext}
            disabled={submitting}
            className="px-5 py-2 rounded-xl bg-brand-primary text-white font-button text-button hover:opacity-90 disabled:opacity-50"
          >
            {step === 2 && createdId == null ? (submitting ? "Creating…" : "Create product & add photos") : "Next"}
          </button>
        ) : (
          <button
            type="button"
            onClick={finish}
            className="px-5 py-2 rounded-xl bg-brand-primary text-white font-button text-button hover:opacity-90"
          >
            Finish
          </button>
        )}
      </div>
    </div>
  );
}
