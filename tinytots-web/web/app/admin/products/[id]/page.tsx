"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import RichTextEditor from "@/components/admin/RichTextEditor";
import ImageUploader from "@/components/admin/ImageUploader";
import CategorySelect from "@/components/admin/CategorySelect";
import RelatedProductPicker, { type RelatedProductLite } from "@/components/admin/RelatedProductPicker";
import { adminFetch } from "@/lib/admin-fetch";
import SignageBadgePicker from "@/components/admin/SignageBadgePicker";
import { type SignageProductBadge } from "@/lib/signage-campaign";

type Variant = { id: number; color: string | null; size: string | null; price: number; stock: number; reorder_level: number; web_price_locked: boolean; web_round_to: number };
type Product = {
  id: number; name: string; sku: string; description: string | null; brand: string | null;
  category: string | null; image_url: string | null; gender: string | null; age_bracket: string | null;
  is_active: boolean; signage_badge: SignageProductBadge | null;
  related_product_ids: number[] | null; variants: Variant[];
};
type ProductImage = { id: number; storage_path: string; is_primary: boolean; sort_order: number; url: string };

function AddVariantForm({ productId, onAdded }: { productId: number; onAdded: (v: Variant) => void }) {
  const [color, setColor] = useState("");
  const [size, setSize] = useState("");
  const [price, setPrice] = useState("");
  const [stock, setStock] = useState("");
  const [saving, setSaving] = useState(false);
  const inputClass =
    "w-full border rounded-lg px-4 py-2 bg-surface-elevated text-text-primary font-body-md text-body-md border-border-default focus:border-brand-primary focus:outline-none";

  async function handleAdd() {
    const parsedPrice = parseFloat(price);
    const parsedStock = parseInt(stock || "0", 10);
    if (!price || Number.isNaN(parsedPrice) || parsedPrice < 0) return;
    if (Number.isNaN(parsedStock) || parsedStock < 0) return;
    setSaving(true);
    const res = await adminFetch("/api/admin/inventory", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        product_id: productId,
        color: color || null,
        size: size || null,
        price: parsedPrice,
        stock: parsedStock,
      }),
    });
    const json = await res.json();
    setSaving(false);
    if (res.ok && json.data?.[0]) {
      onAdded(json.data[0]);
      setColor(""); setSize(""); setPrice(""); setStock("");
    }
  }

  return (
    <div className="grid grid-cols-5 gap-2 mt-3 pt-3 border-t border-border-default items-center">
      <input value={color} onChange={(e) => setColor(e.target.value)} className={inputClass} placeholder="New color" />
      <input value={size} onChange={(e) => setSize(e.target.value)} className={inputClass} placeholder="New size" />
      <input type="number" value={price} onChange={(e) => setPrice(e.target.value)} className={inputClass} placeholder="Price" />
      <input type="number" value={stock} onChange={(e) => setStock(e.target.value)} className={inputClass} placeholder="Stock" />
      <button onClick={handleAdd} disabled={saving} className="font-label-md text-label-md text-brand-primary hover:underline disabled:opacity-50">
        {saving ? "Adding..." : "+ Add variant"}
      </button>
    </div>
  );
}

export default function EditProductPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const searchParams = useSearchParams();
  const justCreated = searchParams.get("justCreated") === "1";
  const [product, setProduct] = useState<Product | null>(null);
  const [images, setImages] = useState<ProductImage[]>([]);
  const [badgeItems, setBadgeItems] = useState<{ id: number; label: string; is_active: boolean }[]>([]);
  const [allProducts, setAllProducts] = useState<RelatedProductLite[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setError(null);
    adminFetch(`/api/admin/products/${id}`)
      .then(async (r) => {
        const json = await r.json();
        if (!r.ok) {
          setProduct(null);
          setError(json.error || "Failed to load product.");
          return;
        }
        const data = json.data;
        setProduct({
          ...data,
          related_product_ids: Array.isArray(data.related_product_ids)
            ? data.related_product_ids.map(Number)
            : [],
        });
      })
      .catch(() => {
        setProduct(null);
        setError("Failed to load product.");
      })
      .finally(() => setLoading(false));

    adminFetch(`/api/admin/products/${id}/images`)
      .then(async (r) => {
        const json = await r.json();
        if (r.ok) setImages(json.data || []);
        else setImages([]);
      })
      .catch(() => setImages([]));

    adminFetch("/api/admin/badge-items")
      .then(async (r) => {
        const json = await r.json();
        if (r.ok) setBadgeItems(json.items || []);
        else setBadgeItems([]);
      })
      .catch(() => setBadgeItems([]));

    adminFetch("/api/admin/categories/products")
      .then(async (r) => {
        const json = await r.json();
        if (r.ok) setAllProducts(json.products || []);
        else setAllProducts([]);
      })
      .catch(() => setAllProducts([]));
  }, [id]);
  function updateField<K extends keyof Product>(field: K, value: Product[K]) {
    setProduct((prev) => (prev ? { ...prev, [field]: value } : prev));
  }

  function updateVariant(vid: number, field: keyof Variant, value: string | boolean | number) {
    setProduct((prev) =>
      prev
        ? {
            ...prev,
            variants: prev.variants.map((v) => {
              if (v.id !== vid) return v;
              if (field === "web_price_locked") return { ...v, web_price_locked: value as boolean };
              if (field === "web_round_to") return { ...v, web_round_to: value as number };
              if (field === "color" || field === "size") return { ...v, [field]: value as string };
              return { ...v, [field]: Number(value) };
            }),
          }
        : prev
    );
  }
  async function saveProduct() {
    if (!product) return;
    if (!product.name?.trim() || !product.sku?.trim()) {
      setError("Name and SKU are required.");
      return;
    }
    if (!product.category?.trim()) {
      setError("Please select a category.");
      return;
    }
    setSaving(true);
    setError(null);
    try {
      const res = await adminFetch(`/api/products/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: product.name,
          sku: product.sku,
          description: product.description,
          brand: product.brand,
          category: product.category,
          // image_url intentionally omitted — ImageUploader is the sole
          // source of truth for this field now. Sending it here would
          // overwrite it with whatever stale value was in local state when
          // the page loaded, undoing any photo changes made since.
          gender: product.gender,
          age_bracket: product.age_bracket,
          signage_badge: product.signage_badge,
          related_product_ids: product.related_product_ids || [],
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
    if (!Number.isFinite(v.price) || v.price < 0) {
      setError("Price must be a non-negative number.");
      return;
    }
    if (!Number.isFinite(v.stock) || v.stock < 0 || !Number.isInteger(v.stock)) {
      setError("Stock must be a non-negative whole number.");
      return;
    }
    const res = await adminFetch(`/api/admin/inventory/${v.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        price: v.price,
        stock: v.stock,
        reorder_level: v.reorder_level,
        color: v.color,
        size: v.size,
        web_price_locked: v.web_price_locked,
        web_round_to: v.web_round_to,
      }),
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
    "w-full border rounded-lg px-4 py-2 bg-surface-elevated text-text-primary font-body-md text-body-md border-border-default focus:border-brand-primary focus:outline-none";

  if (loading) return <p className="font-body-md text-body-md text-text-secondary">Loading...</p>;
  if (!product) {
    return (
      <p className="font-body-md text-body-md text-red-700">
        {error || "Product not found."}
      </p>
    );
  }

  return (
    <div className="max-w-3xl">
      <div className="flex justify-between items-center mb-stack-md">
        <h1 className="font-display-md text-display-md text-text-primary">Edit Product</h1>
        <button
  onClick={async () => {
    const nextActive = !product.is_active;
    if (
      !confirm(
        nextActive
          ? "Reactivate this product? It will appear on the storefront again."
          : "Deactivate this product? It will disappear from the storefront but stay in past orders."
      )
    ) {
      return;
    }
    setError(null);
    const res = await adminFetch(`/api/products/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ is_active: nextActive }),
    });
    if (res.ok) updateField("is_active", nextActive);
    else {
      const json = await res.json().catch(() => ({}));
      setError(json.error || "Failed to update product status.");
    }
  }}
  className={`font-label-md text-label-md hover:underline ${product.is_active ? "text-red-700" : "text-brand-primary"}`}
>
  {product.is_active ? "Deactivate product" : "Reactivate product"}
</button>
      </div>

      {justCreated && (
        <p className="font-body-sm text-body-sm text-brand-primary bg-brand-primary/20 rounded-lg px-3 py-2 mb-4">
          Product created! Add photos below to finish setting it up.
        </p>
      )}

      <div className="flex flex-col gap-4">
        <input value={product.name} onChange={(e) => updateField("name", e.target.value)} className={inputClass} placeholder="Name" />
        <input value={product.sku} onChange={(e) => updateField("sku", e.target.value)} className={inputClass} placeholder="SKU" />
        <div>
  <label className="block font-label-md text-label-md text-text-secondary mb-1.5">Description</label>
  <RichTextEditor value={product.description ?? ""} onChange={(html) => updateField("description", html)} />
</div>
        <div className="grid grid-cols-2 gap-4">
          <input value={product.brand ?? ""} onChange={(e) => updateField("brand", e.target.value)} className={inputClass} placeholder="Brand" />
          <CategorySelect value={product.category ?? ""} onChange={(v) => updateField("category", v)} className={inputClass} />
        </div>

        <div>
          <label className="block font-label-md text-label-md text-text-secondary mb-1.5">
            Signage card badge
          </label>
          <SignageBadgePicker
            value={product.signage_badge}
            options={badgeItems}
            onChange={(badge) => updateField("signage_badge", badge)}
            className="rounded-lg border border-border-default bg-surface-elevated p-3"
          />
          <p className="font-body-sm text-body-sm text-text-secondary mt-1.5">
            Shown on the digital signage featured product cards when this product is selected. Pick from
            the library or enter custom text.
          </p>
        </div>

        <div>
          <label className="block font-label-md text-label-md text-text-secondary mb-1.5">Photos</label>
          <ImageUploader productId={product.id} images={images} onImagesChange={setImages} variants={product.variants} />
        </div>

        <RelatedProductPicker
          label="You May Also Like"
          helpText="Optional manual picks for this product’s related carousel. If empty, category defaults or same-category products are used."
          productIds={product.related_product_ids || []}
          products={allProducts}
          excludeId={product.id}
          onChange={(ids) => updateField("related_product_ids", ids)}
        />

        <button
          onClick={saveProduct}
          disabled={saving}
          className="self-start px-5 py-2 rounded-xl bg-brand-primary text-white font-button text-button hover:opacity-90 transition-opacity disabled:opacity-50"
        >
          {saving ? "Saving..." : "Save product details"}
        </button>
      </div>

      <div className="border-t border-border-default pt-4 mt-6">
        <h2 className="font-headline-md text-headline-md text-text-primary mb-3">Variants</h2>
        {product.variants.map((v) => (
        <div key={v.id} className="grid grid-cols-6 gap-2 mb-2 items-center">
        <input value={v.color ?? ""} onChange={(e) => updateVariant(v.id, "color", e.target.value)} className={inputClass} placeholder="Color" />
        <input value={v.size ?? ""} onChange={(e) => updateVariant(v.id, "size", e.target.value)} className={inputClass} placeholder="Size" />
        <input type="number" value={v.price} onChange={(e) => updateVariant(v.id, "price", e.target.value)} className={inputClass} placeholder="Price" />
        <input type="number" value={v.stock} onChange={(e) => updateVariant(v.id, "stock", e.target.value)} className={inputClass} placeholder="Stock" />
        <button onClick={() => saveVariant(v)} className="font-label-md text-label-md text-brand-primary hover:underline">
          Save
        </button>
        <button
          onClick={async () => {
            if (!confirm("Delete this variant permanently?")) return;
            const res = await adminFetch(`/api/admin/inventory/${v.id}`, { method: "DELETE" });
            if (res.ok) {
              setProduct((prev) => prev ? { ...prev, variants: prev.variants.filter((x) => x.id !== v.id) } : prev);
            } else {
              const json = await res.json().catch(() => ({}));
              setError(json.error || "Failed to delete variant.");
            }
          }}
          className="font-label-md text-label-md text-red-700 hover:underline"
        >
          Delete
        </button>
        <label className="flex items-center gap-1.5 font-label-md text-label-md text-text-secondary col-span-6 mt-1">
          <input
            type="checkbox"
            checked={v.web_price_locked}
            onChange={(e) => updateVariant(v.id, "web_price_locked", e.target.checked)}
          />
          Lock web price (shop price changes won't affect this variant's web price)
        </label>
      </div>
        ))}

        <AddVariantForm productId={product.id} onAdded={(newVariant) =>
          setProduct((prev) => prev ? { ...prev, variants: [...prev.variants, newVariant] } : prev)
        } />
      </div>

      {error && <p className="font-label-md text-label-md text-red-700 mt-4">{error}</p>}
    </div>
  );
}