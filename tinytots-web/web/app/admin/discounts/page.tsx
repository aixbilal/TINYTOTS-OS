"use client";

import { useEffect, useState } from "react";
import { adminFetch } from "@/lib/admin-fetch";

type Discount = {
  id: number; name: string; discount_type: string; value: number;
  applies_to: string; product_ids: number[]; category: string | null;
  is_active: boolean; starts_at: string; ends_at: string | null;
};

type Product = { id: number; name: string; category: string | null };

export default function DiscountsPage() {
  const [discounts, setDiscounts] = useState<Discount[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [name, setName] = useState("");
  const [value, setValue] = useState("");
  const [appliesTo, setAppliesTo] = useState("single_product");
  const [selectedProductIds, setSelectedProductIds] = useState<number[]>([]);
  const [category, setCategory] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function loadDiscounts() {
    setLoading(true);
    adminFetch("/api/admin/discounts")
      .then((r) => r.json())
      .then((json) => setDiscounts(json.data || []))
      .finally(() => setLoading(false));
  }

  useEffect(() => {
    loadDiscounts();
    fetch("/api/products")
    .then((r) => r.json())
    .then((json) => setProducts(json.data || []))
    .catch(() => setProducts([]));
  }, []);

  const categories = Array.from(new Set(products.map((p) => p.category).filter(Boolean))) as string[];

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!name.trim() || !value) return setError("Name and value are required.");

    const body: Record<string, unknown> = {
      name,
      discount_type: "percentage",
      value: parseFloat(value),
      applies_to: appliesTo,
    };
    if (appliesTo === "single_product") body.product_ids = selectedProductIds.slice(0, 1);
    if (appliesTo === "product_set") body.product_ids = selectedProductIds;
    if (appliesTo === "category") body.category = category;

    setSubmitting(true);
    const res = await adminFetch("/api/admin/discounts", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    const json = await res.json();
    setSubmitting(false);
    if (!res.ok) { setError(json.error); return; }

    setName(""); setValue(""); setSelectedProductIds([]); setCategory("");
    loadDiscounts();
  }

  async function handleEnd(id: number) {
    if (!confirm("End this discount? Prices will reset to normal on affected products.")) return;
    await adminFetch(`/api/admin/discounts/${id}`, { method: "PUT" });
    loadDiscounts();
  }

  const inputClass =
    "border rounded-lg px-4 py-2 bg-surface-container-lowest text-on-surface font-body-md text-body-md border-outline-variant focus:border-primary focus:outline-none";

  return (
    <div className="max-w-2xl">
      <h1 className="font-display-md text-display-md text-on-surface mb-stack-md">Discounts</h1>

      <form onSubmit={handleCreate} className="border border-outline-variant/30 rounded-lg p-4 flex flex-col gap-3 mb-6">
        <h2 className="font-headline-md text-headline-md text-on-surface">New discount campaign</h2>

        <input placeholder="Campaign name (e.g. Eid Sale)" value={name} onChange={(e) => setName(e.target.value)} className={inputClass} />
        <input placeholder="Percentage off (e.g. 20)" type="number" value={value} onChange={(e) => setValue(e.target.value)} className={inputClass} />

        <select value={appliesTo} onChange={(e) => setAppliesTo(e.target.value)} className={inputClass}>
          <option value="single_product">Single product</option>
          <option value="product_set">Multiple products</option>
          <option value="category">Whole category</option>
        </select>

        {appliesTo === "single_product" && (
          <select
            value={selectedProductIds[0] ?? ""}
            onChange={(e) => setSelectedProductIds(e.target.value ? [Number(e.target.value)] : [])}
            className={inputClass}
          >
            <option value="">Select a product</option>
            {products.map((p) => (
              <option key={p.id} value={p.id}>{p.name}</option>
            ))}
          </select>
        )}

{appliesTo === "product_set" && (
          <div className={`${inputClass} h-40 overflow-y-auto flex flex-col gap-1`}>
            {products.map((p) => {
              const checked = selectedProductIds.includes(p.id);
              return (
                <label key={p.id} className="flex items-center gap-2 font-body-sm text-body-sm text-on-surface cursor-pointer">
                  <input
                    type="checkbox"
                    checked={checked}
                    onChange={() =>
                      setSelectedProductIds((prev) =>
                        checked ? prev.filter((id) => id !== p.id) : [...prev, p.id]
                      )
                    }
                  />
                  {p.name}
                </label>
              );
            })}
          </div>
        )}

        {appliesTo === "category" && (
          <select value={category} onChange={(e) => setCategory(e.target.value)} className={inputClass}>
            <option value="">Select category</option>
            {categories.map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
        )}

        <button type="submit" disabled={submitting} className="self-start px-5 py-2 rounded-xl bg-primary-container text-on-primary font-button text-button hover:bg-primary disabled:opacity-50">
          {submitting ? "Applying..." : "Create & apply"}
        </button>
        {error && <p className="font-label-md text-label-md text-error">{error}</p>}
      </form>

      {loading ? (
        <p className="font-body-md text-body-md text-on-surface-variant">Loading...</p>
      ) : (
        <table className="w-full border-collapse">
          <thead>
            <tr className="text-left border-b border-outline-variant/30">
              <th className="py-2 font-label-md text-label-md text-on-surface-variant">Name</th>
              <th className="py-2 font-label-md text-label-md text-on-surface-variant">Value</th>
              <th className="py-2 font-label-md text-label-md text-on-surface-variant">Scope</th>
              <th className="py-2 font-label-md text-label-md text-on-surface-variant">Status</th>
              <th className="py-2"></th>
            </tr>
          </thead>
          <tbody>
            {discounts.map((d) => (
              <tr key={d.id} className="border-b border-outline-variant/10">
                <td className="py-3 font-body-sm text-body-sm text-on-surface">{d.name}</td>
                <td className="py-3 font-body-sm text-body-sm text-on-surface-variant">{d.value}%</td>
                <td className="py-3 font-body-sm text-body-sm text-on-surface-variant capitalize">
                  {d.applies_to === "category" ? `Category: ${d.category}` : d.applies_to.replace("_", " ")}
                </td>
                <td className={`py-3 font-label-md text-label-md ${d.is_active ? "text-primary" : "text-on-surface-variant"}`}>
                  {d.is_active ? "Active" : "Ended"}
                </td>
                <td className="py-3 text-right">
                  {d.is_active && (
                    <button onClick={() => handleEnd(d.id)} className="font-label-md text-label-md text-error hover:underline">
                      End
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}