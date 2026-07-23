"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import RichTextEditor from "@/components/admin/RichTextEditor";
import TagInput from "@/components/admin/TagInput";
import MarkupCalculator from "@/components/admin/MarkupCalculator";

export default function NewProductPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [sku, setSku] = useState("");
  const [description, setDescription] = useState("");
  const [brand, setBrand] = useState("");
  const [category, setCategory] = useState("");
  const [gender, setGender] = useState("");
  const [ageBracket, setAgeBracket] = useState("");

  const [costPrice, setCostPrice] = useState("");
  const [shopBasePrice, setShopBasePrice] = useState("");
  const [shopDiscountPercent, setShopDiscountPercent] = useState("0");
  const [shopFinalPrice, setShopFinalPrice] = useState("");
  const [webBasePrice, setWebBasePrice] = useState("");
  const [webDiscountPercent, setWebDiscountPercent] = useState("0");
  const [webFinalPrice, setWebFinalPrice] = useState("");

  const [initialStock, setInitialStock] = useState("");
  const [colors, setColors] = useState<string[]>([]);
  const [sizes, setSizes] = useState<string[]>([]);
  const [stockOverrides, setStockOverrides] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

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

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (!name.trim() || !sku.trim()) return setError("Name and SKU are required.");
    if (!shopFinalPrice || !webFinalPrice) return setError("Fill in cost price and shop selling price so both prices can be calculated.");
    if (!colors.length || !sizes.length) return setError("Add at least one color and one size to generate variants.");

    setSubmitting(true);
    try {
      const variants = variantCombos.map((c) => ({
        color: c.color,
        size: c.size,
        cost_price: costPrice ? parseFloat(costPrice) : 0,
        base_price: shopBasePrice ? parseFloat(shopBasePrice) : null,
        discount_percent: shopDiscountPercent ? parseFloat(shopDiscountPercent) : 0,
        price: parseFloat(shopFinalPrice),
        web_base_price: webBasePrice ? parseFloat(webBasePrice) : null,
        web_discount_percent: webDiscountPercent ? parseFloat(webDiscountPercent) : 0,
        web_price: parseFloat(webFinalPrice),
        stock: parseInt(stockFor(c.key) || "0", 10),
        reorder_level: 5,
      }));

      const res = await fetch("/api/products", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name, sku, description, brand, category,
          image_url: null, // images are added on the edit page after creation, via ImageUploader
          gender: gender || null,
          age_bracket: ageBracket || null,
          cost_price: costPrice ? parseFloat(costPrice) : 0,
          selling_price: shopFinalPrice ? parseFloat(shopFinalPrice) : 0,
          variants,
        }),
      });
      const json = await res.json();
      if (!res.ok) { setError(json.error || "Failed to create product."); setSubmitting(false); return; }

      // Redirect straight to the edit page (not the list) so photos can be
      // added immediately — image upload needs a real product id, which
      // only exists after this point.
      router.push(`/admin/products/${json.data.id}?justCreated=1`);
    } catch {
      setError("Network error. Please try again.");
      setSubmitting(false);
    }
  }

  const inputClass =
    "w-full border rounded-lg px-4 py-2 bg-surface-container-lowest text-on-surface font-body-md text-body-md border-outline-variant focus:border-primary focus:outline-none";

  return (
    <div className="max-w-2xl">
      <h1 className="font-display-md text-display-md text-on-surface mb-stack-md">Add Product</h1>
      <p className="font-body-sm text-body-sm text-on-surface-variant mb-4">
        Fill in the details below, then add photos on the next screen once the product is created.
      </p>

      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <div className="grid grid-cols-2 gap-4">
          <input placeholder="Product name" value={name} onChange={(e) => setName(e.target.value)} className={inputClass} />
          <input placeholder="SKU" value={sku} onChange={(e) => setSku(e.target.value)} className={inputClass} />
          <input placeholder="Brand" value={brand} onChange={(e) => setBrand(e.target.value)} className={inputClass} />
          <input placeholder="Category (Shirts, Pants...)" value={category} onChange={(e) => setCategory(e.target.value)} className={inputClass} />
        </div>

        <div>
          <label className="block font-label-md text-label-md text-on-surface-variant mb-1.5">Description</label>
          <RichTextEditor value={description} onChange={setDescription} />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <input placeholder="Gender (boy/girl/unisex) — optional" value={gender} onChange={(e) => setGender(e.target.value)} className={inputClass} />
          <input placeholder="Age bracket — optional" value={ageBracket} onChange={(e) => setAgeBracket(e.target.value)} className={inputClass} />
        </div>

        <MarkupCalculator
          costPrice={costPrice}
          shopBasePrice={shopBasePrice} shopDiscountPercent={shopDiscountPercent} shopFinalPrice={shopFinalPrice}
          webBasePrice={webBasePrice} webDiscountPercent={webDiscountPercent} webFinalPrice={webFinalPrice}
          onCostChange={setCostPrice}
          onShopBaseChange={setShopBasePrice} onShopDiscountChange={setShopDiscountPercent} onShopFinalChange={setShopFinalPrice}
          onWebBaseChange={setWebBasePrice} onWebDiscountChange={setWebDiscountPercent} onWebFinalChange={setWebFinalPrice}
        />

        <input placeholder="Default stock per variant" type="number" value={initialStock} onChange={(e) => setInitialStock(e.target.value)} className={inputClass} />

        <div className="border-t border-outline-variant/20 pt-4 mt-2">
          <h2 className="font-headline-md text-headline-md text-on-surface mb-3">Variants</h2>
          <div className="grid grid-cols-2 gap-4 mb-3">
            <TagInput label="Colors" placeholder="Maroon, Black..." values={colors} onChange={setColors} />
            <TagInput label="Sizes" placeholder="S, M, L, XL..." values={sizes} onChange={setSizes} />
          </div>

          {variantCombos.length > 0 && (
            <div>
              <p className="font-body-sm text-body-sm text-primary bg-primary-container/20 rounded-lg px-3 py-2 mb-2">
                This will generate <strong>{variantCombos.length}</strong> variants ({colors.length} colors × {sizes.length} sizes). Adjust stock per combo below if needed.
              </p>
              <div className="border border-outline-variant/30 rounded-lg max-h-56 overflow-y-auto">
                <table className="w-full font-body-sm text-body-sm">
                  <thead className="bg-surface-container-low sticky top-0">
                    <tr>
                      <th className="text-left px-3 py-2 text-on-surface-variant">Color</th>
                      <th className="text-left px-3 py-2 text-on-surface-variant">Size</th>
                      <th className="text-left px-3 py-2 text-on-surface-variant">Stock</th>
                    </tr>
                  </thead>
                  <tbody>
                    {variantCombos.map(({ key, color, size }) => (
                      <tr key={key} className="border-t border-outline-variant/10">
                        <td className="px-3 py-1.5">{color}</td>
                        <td className="px-3 py-1.5">{size}</td>
                        <td className="px-3 py-1.5">
                          <input type="number" value={stockFor(key)} onChange={(e) => setStockFor(key, e.target.value)} className="w-20 border border-outline-variant/50 rounded px-2 py-1" />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>

        <button type="submit" disabled={submitting} className="w-full py-4 rounded-xl bg-primary-container text-on-primary font-button text-button hover:bg-primary transition-colors disabled:opacity-50 mt-4">
          {submitting ? "Saving..." : "Create Product — Add Photos Next"}
        </button>

        {error && <p className="font-label-md text-label-md text-error">{error}</p>}
      </form>
    </div>
  );
}