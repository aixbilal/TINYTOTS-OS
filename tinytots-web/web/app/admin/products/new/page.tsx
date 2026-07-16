"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type VariantInput = { color: string; size: string; price: string; stock: string; reorder_level: string };

export default function NewProductPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [sku, setSku] = useState("");
  const [description, setDescription] = useState("");
  const [brand, setBrand] = useState("");
  const [category, setCategory] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [gender, setGender] = useState("");
  const [ageBracket, setAgeBracket] = useState("");
  const [variants, setVariants] = useState<VariantInput[]>([
    { color: "", size: "", price: "", stock: "", reorder_level: "5" },
  ]);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function updateVariant(index: number, field: keyof VariantInput, value: string) {
    setVariants((prev) => prev.map((v, i) => (i === index ? { ...v, [field]: value } : v)));
  }

  function addVariant() {
    setVariants((prev) => [...prev, { color: "", size: "", price: "", stock: "", reorder_level: "5" }]);
  }

  function removeVariant(index: number) {
    setVariants((prev) => prev.filter((_, i) => i !== index));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (!name.trim() || !sku.trim()) {
      setError("Name and SKU are required.");
      return;
    }
    if (variants.some((v) => !v.price)) {
      setError("Every variant needs a price.");
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch("/api/products", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          sku,
          description,
          brand,
          category,
          image_url: imageUrl || null,
          gender: gender || null,
          age_bracket: ageBracket || null,
          variants: variants.map((v) => ({
            color: v.color || null,
            size: v.size || null,
            price: parseFloat(v.price),
            stock: parseInt(v.stock || "0", 10),
            reorder_level: parseInt(v.reorder_level || "5", 10),
          })),
        }),
      });
      const json = await res.json();
      if (!res.ok) {
        setError(json.error || "Failed to create product.");
        setSubmitting(false);
        return;
      }
      router.push("/admin/products");
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

      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <input placeholder="Product name" value={name} onChange={(e) => setName(e.target.value)} className={inputClass} />
        <input placeholder="SKU" value={sku} onChange={(e) => setSku(e.target.value)} className={inputClass} />
        <textarea placeholder="Description" value={description} onChange={(e) => setDescription(e.target.value)} className={inputClass} rows={3} />
        <div className="grid grid-cols-2 gap-4">
          <input placeholder="Brand" value={brand} onChange={(e) => setBrand(e.target.value)} className={inputClass} />
          <input placeholder="Category" value={category} onChange={(e) => setCategory(e.target.value)} className={inputClass} />
        </div>
        <input placeholder="Image URL" value={imageUrl} onChange={(e) => setImageUrl(e.target.value)} className={inputClass} />
        <div className="grid grid-cols-2 gap-4">
          <input placeholder="Gender (boy/girl/unisex)" value={gender} onChange={(e) => setGender(e.target.value)} className={inputClass} />
          <input placeholder="Age bracket" value={ageBracket} onChange={(e) => setAgeBracket(e.target.value)} className={inputClass} />
        </div>

        <div className="border-t border-outline-variant/20 pt-4 mt-2">
          <h2 className="font-headline-md text-headline-md text-on-surface mb-3">Variants</h2>
          {variants.map((v, i) => (
            <div key={i} className="grid grid-cols-5 gap-2 mb-2 items-center">
              <input placeholder="Color" value={v.color} onChange={(e) => updateVariant(i, "color", e.target.value)} className={inputClass} />
              <input placeholder="Size" value={v.size} onChange={(e) => updateVariant(i, "size", e.target.value)} className={inputClass} />
              <input placeholder="Price" type="number" value={v.price} onChange={(e) => updateVariant(i, "price", e.target.value)} className={inputClass} />
              <input placeholder="Stock" type="number" value={v.stock} onChange={(e) => updateVariant(i, "stock", e.target.value)} className={inputClass} />
              <button type="button" onClick={() => removeVariant(i)} className="text-error font-label-md text-label-md">
                Remove
              </button>
            </div>
          ))}
          <button type="button" onClick={addVariant} className="font-label-md text-label-md text-primary hover:underline mt-1">
            + Add another variant
          </button>
        </div>

        <button
          type="submit"
          disabled={submitting}
          className="w-full py-4 rounded-xl bg-primary-container text-on-primary font-button text-button hover:bg-primary transition-colors disabled:opacity-50 mt-4"
        >
          {submitting ? "Saving..." : "Create Product"}
        </button>

        {error && <p className="font-label-md text-label-md text-error">{error}</p>}
      </form>
    </div>
  );
}