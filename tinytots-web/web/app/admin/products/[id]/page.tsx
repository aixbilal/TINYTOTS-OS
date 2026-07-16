"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";

type Variant = { id: number; color: string | null; size: string | null; price: number; stock: number; reorder_level: number };
type Product = {
  id: number; name: string; sku: string; description: string | null; brand: string | null;
  category: string | null; image_url: string | null; gender: string | null; age_bracket: string | null;
  is_active: boolean; variants: Variant[];
};

export default function EditProductPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch(`/api/admin/products/${id}`)
      .then((r) => r.json())
      .then((json) => setProduct(json.data))
      .finally(() => setLoading(false));
  }, [id]);

  function updateField<K extends keyof Product>(field: K, value: Product[K]) {
    setProduct((prev) => (prev ? { ...prev, [field]: value } : prev));
  }

  function updateVariant(vid: number, field: keyof Variant, value: string) {
    setProduct((prev) =>
      prev
        ? {
            ...prev,
            variants: prev.variants.map((v) =>
              v.id === vid ? { ...v, [field]: field === "color" || field === "size" ? value : Number(value) } : v
            ),
          }
        : prev
    );
  }

  async function saveProduct() {
    if (!product) return;
    setSaving(true);
    setError(null);
    try {
      const res = await fetch(`/api/products/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: product.name,
          sku: product.sku,
          description: product.description,
          brand: product.brand,
          category: product.category,
          image_url: product.image_url,
          gender: product.gender,
          age_bracket: product.age_bracket,
        }),
      });
      if (!res.ok) {
        const json = await res.json();
        setError(json.error || "Failed to save product.");
      }
    } finally {
      setSaving(false);
    }
  }

  async function saveVariant(v: Variant) {
    setError(null);
    const res = await fetch(`/api/inventory/${v.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ price: v.price, stock: v.stock, reorder_level: v.reorder_level, color: v.color, size: v.size }),
    });
    if (!res.ok) {
      const json = await res.json();
      setError(json.error || "Failed to save variant.");
    }
  }

  async function deleteProduct() {
    if (!confirm("Deactivate this product? It will disappear from the storefront but stay in past orders.")) return;
    await fetch(`/api/products/${id}`, { method: "DELETE" });
    router.push("/admin/products");
  }

  const inputClass =
    "w-full border rounded-lg px-4 py-2 bg-surface-container-lowest text-on-surface font-body-md text-body-md border-outline-variant focus:border-primary focus:outline-none";

  if (loading) return <p className="font-body-md text-body-md text-on-surface-variant">Loading...</p>;
  if (!product) return <p className="font-body-md text-body-md text-error">Product not found.</p>;

  return (
    <div className="max-w-2xl">
      <div className="flex justify-between items-center mb-stack-md">
        <h1 className="font-display-md text-display-md text-on-surface">Edit Product</h1>
        <button onClick={deleteProduct} className="font-label-md text-label-md text-error hover:underline">
          Deactivate product
        </button>
      </div>

      <div className="flex flex-col gap-4">
        <input value={product.name} onChange={(e) => updateField("name", e.target.value)} className={inputClass} placeholder="Name" />
        <input value={product.sku} onChange={(e) => updateField("sku", e.target.value)} className={inputClass} placeholder="SKU" />
        <textarea value={product.description ?? ""} onChange={(e) => updateField("description", e.target.value)} className={inputClass} rows={3} placeholder="Description" />
        <div className="grid grid-cols-2 gap-4">
          <input value={product.brand ?? ""} onChange={(e) => updateField("brand", e.target.value)} className={inputClass} placeholder="Brand" />
          <input value={product.category ?? ""} onChange={(e) => updateField("category", e.target.value)} className={inputClass} placeholder="Category" />
        </div>
        <input value={product.image_url ?? ""} onChange={(e) => updateField("image_url", e.target.value)} className={inputClass} placeholder="Image URL" />

        <button
          onClick={saveProduct}
          disabled={saving}
          className="self-start px-5 py-2 rounded-xl bg-primary-container text-on-primary font-button text-button hover:bg-primary transition-colors disabled:opacity-50"
        >
          {saving ? "Saving..." : "Save product details"}
        </button>
      </div>

      <div className="border-t border-outline-variant/20 pt-4 mt-6">
        <h2 className="font-headline-md text-headline-md text-on-surface mb-3">Variants</h2>
        {product.variants.map((v) => (
          <div key={v.id} className="grid grid-cols-5 gap-2 mb-2 items-center">
            <input value={v.color ?? ""} onChange={(e) => updateVariant(v.id, "color", e.target.value)} className={inputClass} placeholder="Color" />
            <input value={v.size ?? ""} onChange={(e) => updateVariant(v.id, "size", e.target.value)} className={inputClass} placeholder="Size" />
            <input type="number" value={v.price} onChange={(e) => updateVariant(v.id, "price", e.target.value)} className={inputClass} placeholder="Price" />
            <input type="number" value={v.stock} onChange={(e) => updateVariant(v.id, "stock", e.target.value)} className={inputClass} placeholder="Stock" />
            <button onClick={() => saveVariant(v)} className="font-label-md text-label-md text-primary hover:underline">
              Save
            </button>
          </div>
        ))}
      </div>

      {error && <p className="font-label-md text-label-md text-error mt-4">{error}</p>}
    </div>
  );
}