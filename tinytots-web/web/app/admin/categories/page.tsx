"use client";

import { Fragment, useEffect, useMemo, useState } from "react";
import { adminFetch } from "@/lib/admin-fetch";
import RelatedProductPicker from "@/components/admin/RelatedProductPicker";
import AspectImageUploader from "@/components/admin/AspectImageUploader";

interface Category {
  id: number;
  name: string;
  slug: string;
  display_order: number;
  related_product_ids?: number[] | null;
  image_url?: string | null;
  description?: string | null;
  is_active?: boolean;
}

interface Product {
  id: number;
  name: string;
  sku: string;
  category: string | null;
  image_url?: string | null;
}

export default function AdminCategoriesPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [newName, setNewName] = useState("");
  const [adding, setAdding] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editName, setEditName] = useState("");
  const [editOrder, setEditOrder] = useState("0");
  const [editImageUrl, setEditImageUrl] = useState("");
  const [editDescription, setEditDescription] = useState("");
  const [editActive, setEditActive] = useState(true);
  const [savingEdit, setSavingEdit] = useState(false);

  // Which category's product-assignment panel is currently open
  const [expandedId, setExpandedId] = useState<number | null>(null);
  const [relatedExpandedId, setRelatedExpandedId] = useState<number | null>(null);
  const [relatedIds, setRelatedIds] = useState<number[]>([]);
  const [savingRelated, setSavingRelated] = useState(false);
  const [search, setSearch] = useState("");
  const [pendingIds, setPendingIds] = useState<Set<number>>(new Set());
  const [saving, setSaving] = useState(false);

  async function load() {
    setLoading(true);
    const [catRes, prodRes] = await Promise.all([
      adminFetch("/api/admin/categories"),
      adminFetch("/api/admin/categories/products"),
    ]);
    const catData = await catRes.json();
    const prodData = await prodRes.json();

    if (catRes.ok) setCategories(catData.categories || []);
    else setErrorMsg(catData.error || "Failed to load categories");

    if (prodRes.ok) setProducts(prodData.products || []);
    else setErrorMsg((prev) => prev || prodData.error || "Failed to load products");

    setLoading(false);
  }

  useEffect(() => {
    load();
  }, []);

  // product counts per category name (products.category stores the name, not the id)
  const countsByName = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const p of products) {
      if (p.category) counts[p.category] = (counts[p.category] || 0) + 1;
    }
    return counts;
  }, [products]);

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    if (!newName.trim()) return;
    setAdding(true);
    setErrorMsg("");
    const res = await adminFetch("/api/admin/categories", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: newName.trim(), display_order: categories.length }),
    });
    const data = await res.json();
    if (!res.ok) {
      setErrorMsg(data.error || "Failed to add category");
    } else {
      setNewName("");
      load();
    }
    setAdding(false);
  }

  function startEdit(c: Category) {
    setEditingId(c.id);
    setEditName(c.name);
    setEditOrder(String(c.display_order));
    setEditImageUrl(c.image_url || "");
    setEditDescription(c.description || "");
    setEditActive(c.is_active !== false);
    setExpandedId(null);
    setRelatedExpandedId(null);
  }

  async function saveEdit() {
    if (!editingId) return;
    setSavingEdit(true);
    setErrorMsg("");
    const res = await adminFetch(`/api/admin/categories/${editingId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: editName.trim(),
        display_order: editOrder,
        image_url: editImageUrl,
        description: editDescription,
        is_active: editActive,
      }),
    });
    const data = await res.json();
    setSavingEdit(false);
    if (!res.ok) {
      setErrorMsg(data.error || "Failed to update category");
      return;
    }
    setEditingId(null);
    load();
  }

  async function handleDelete(id: number) {
    if (!confirm("Delete this category?")) return;
    const res = await adminFetch(`/api/admin/categories/${id}`, { method: "DELETE" });
    const data = await res.json();
    if (!res.ok) {
      setErrorMsg(data.error || "Failed to delete category");
      return;
    }
    load();
  }

  function openAssigner(c: Category) {
    if (expandedId === c.id) {
      setExpandedId(null);
      return;
    }
    setExpandedId(c.id);
    setRelatedExpandedId(null);
    setEditingId(null);
    setSearch("");
    // Pre-check whichever products are currently assigned to this category
    const current = new Set(
      products.filter((p) => p.category === c.name).map((p) => p.id)
    );
    setPendingIds(current);
  }

  function openRelatedPicker(c: Category) {
    if (relatedExpandedId === c.id) {
      setRelatedExpandedId(null);
      return;
    }
    setRelatedExpandedId(c.id);
    setExpandedId(null);
    setEditingId(null);
    setRelatedIds(
      Array.isArray(c.related_product_ids)
        ? c.related_product_ids.map(Number).filter((id) => Number.isFinite(id))
        : []
    );
  }

  async function saveRelatedDefaults(c: Category) {
    setSavingRelated(true);
    setErrorMsg("");
    const res = await adminFetch(`/api/admin/categories/${c.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ related_product_ids: relatedIds }),
    });
    const data = await res.json();
    if (!res.ok) {
      setErrorMsg(data.error || "Failed to save related products");
      setSavingRelated(false);
      return;
    }
    setRelatedExpandedId(null);
    await load();
    setSavingRelated(false);
  }

  function toggleProduct(id: number) {
    setPendingIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  async function saveAssignments(c: Category) {
    setSaving(true);
    setErrorMsg("");

    const currentlyAssigned = new Set(
      products.filter((p) => p.category === c.name).map((p) => p.id)
    );
    const toAssign = [...pendingIds].filter((id) => !currentlyAssigned.has(id));
    const toUnassign = [...currentlyAssigned].filter((id) => !pendingIds.has(id));

    try {
      if (toAssign.length > 0) {
        const res = await adminFetch("/api/admin/categories/products", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ productIds: toAssign, category: c.name }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Failed to assign products");
      }
      if (toUnassign.length > 0) {
        const res = await adminFetch("/api/admin/categories/products", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ productIds: toUnassign, category: null }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Failed to unassign products");
      }
      setExpandedId(null);
      await load();
    } catch (err: any) {
      setErrorMsg(err.message || "Failed to save product assignments");
    } finally {
      setSaving(false);
    }
  }

  const filteredProducts = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return products;
    return products.filter(
      (p) => p.name.toLowerCase().includes(q) || p.sku.toLowerCase().includes(q)
    );
  }, [products, search]);

  return (
    <div className="max-w-5xl mx-auto">
      <h1 className="text-2xl font-bold text-gray-900 mb-1">Categories</h1>
      <p className="text-sm text-gray-500 mb-6">
        Manage the categories available when adding or editing products, and assign
        products to a category directly from here. Lower "Order" values show first.
        These are also the Collections shown on the customer-facing /collections page.
      </p>

      {errorMsg && (
        <div className="mb-4 p-3 bg-red-50 text-red-700 text-sm rounded">{errorMsg}</div>
      )}

      <form onSubmit={handleAdd} className="flex gap-3 mb-6">
        <input
          type="text"
          value={newName}
          onChange={(e) => setNewName(e.target.value)}
          placeholder="New category name (e.g. Boys, Girls, Newborn)"
          className="flex-1 border rounded-md px-3 py-2 text-sm"
        />
        <button
          type="submit"
          disabled={adding}
          className="bg-indigo-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-indigo-700 disabled:opacity-50"
        >
          {adding ? "Adding..." : "+ Add"}
        </button>
      </form>

      {loading ? (
        <div className="text-center py-12 text-gray-500">Loading...</div>
      ) : categories.length === 0 ? (
        <div className="bg-white rounded-lg border border-dashed border-gray-300 p-12 text-center text-gray-500">
          No categories yet.
        </div>
      ) : (
        <div className="bg-white rounded-lg border border-gray-200 overflow-hidden shadow-sm">
          <table className="w-full text-left text-sm text-gray-600">
            <thead className="bg-gray-50 text-xs text-gray-500 uppercase border-b">
              <tr>
                <th className="px-6 py-3">Image</th>
                <th className="px-6 py-3">Name</th>
                <th className="px-6 py-3">Order</th>
                <th className="px-6 py-3">Status</th>
                <th className="px-6 py-3">Products</th>
                <th className="px-6 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {categories.map((c) => (
                <Fragment key={c.id}>
                  <tr className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <div className="w-12 h-12 rounded-md overflow-hidden bg-gray-100 border border-gray-200 flex items-center justify-center">
                        {c.image_url ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={c.image_url} alt={c.name} className="w-full h-full object-cover" />
                        ) : (
                          <span className="text-gray-300 text-xs">—</span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 font-medium text-gray-900">
                      {c.name}
                      <div className="text-xs text-gray-400 font-normal">/{c.slug}</div>
                    </td>
                    <td className="px-6 py-4">{c.display_order}</td>
                    <td className="px-6 py-4">
                      <span
                        className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                          c.is_active !== false ? "bg-green-50 text-green-700" : "bg-gray-100 text-gray-500"
                        }`}
                      >
                        {c.is_active !== false ? "Active" : "Hidden"}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <button
                        onClick={() => openAssigner(c)}
                        className="inline-flex items-center gap-1 text-xs font-medium text-indigo-600 hover:underline"
                      >
                        {countsByName[c.name] || 0} product{(countsByName[c.name] || 0) === 1 ? "" : "s"}
                        <span className="text-gray-400">{expandedId === c.id ? "▲" : "▼"}</span>
                      </button>
                    </td>
                    <td className="px-6 py-4 text-right space-x-3">
                      <button
                        onClick={() => openRelatedPicker(c)}
                        className="text-xs font-medium text-indigo-600 hover:underline"
                      >
                        Related{relatedExpandedId === c.id ? " ▲" : ""}
                      </button>
                      <button
                        onClick={() => (editingId === c.id ? setEditingId(null) : startEdit(c))}
                        className="text-xs font-medium text-indigo-600 hover:underline"
                      >
                        Edit{editingId === c.id ? " ▲" : ""}
                      </button>
                      <button onClick={() => handleDelete(c.id)} className="text-xs font-medium text-red-600 hover:underline">
                        Delete
                      </button>
                    </td>
                  </tr>
                  {editingId === c.id && (
                    <tr>
                      <td colSpan={6} className="px-6 py-4 bg-gray-50">
                        <div className="flex flex-col gap-4 max-w-lg">
                          <AspectImageUploader
                            label="Collection image (shown on the /collections card)"
                            value={editImageUrl}
                            onChange={setEditImageUrl}
                            aspect={4 / 3}
                            aspectLabel="4:3"
                            previewClassName="aspect-[4/3] max-w-[220px]"
                            outputWidth={900}
                            outputHeight={675}
                            variant="desktop"
                          />
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
                            <input
                              value={editName}
                              onChange={(e) => setEditName(e.target.value)}
                              className="border border-gray-300 rounded-md px-3 py-2 text-sm w-full"
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              Description (shown on the /collections card, optional)
                            </label>
                            <textarea
                              value={editDescription}
                              onChange={(e) => setEditDescription(e.target.value)}
                              rows={2}
                              className="border border-gray-300 rounded-md px-3 py-2 text-sm w-full"
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Order</label>
                            <input
                              type="number"
                              value={editOrder}
                              onChange={(e) => setEditOrder(e.target.value)}
                              className="border border-gray-300 rounded-md px-3 py-2 text-sm w-24"
                            />
                          </div>
                          <label className="flex items-center gap-2 text-sm text-gray-700">
                            <input
                              type="checkbox"
                              checked={editActive}
                              onChange={(e) => setEditActive(e.target.checked)}
                              className="h-4 w-4"
                            />
                            Active (visible on /collections and /collections/{"{slug}"})
                          </label>
                          <div className="flex justify-end gap-3">
                            <button
                              onClick={() => setEditingId(null)}
                              disabled={savingEdit}
                              className="text-xs font-medium text-gray-500 hover:underline"
                            >
                              Cancel
                            </button>
                            <button
                              onClick={saveEdit}
                              disabled={savingEdit}
                              className="bg-indigo-600 text-white px-4 py-1.5 rounded-md text-xs font-medium hover:bg-indigo-700 disabled:opacity-50"
                            >
                              {savingEdit ? "Saving..." : "Save changes"}
                            </button>
                          </div>
                        </div>
                      </td>
                    </tr>
                  )}
                  {relatedExpandedId === c.id && (
                    <tr>
                      <td colSpan={6} className="px-6 py-4 bg-gray-50">
                        <RelatedProductPicker
                          label={`You May Also Like defaults — ${c.name}`}
                          helpText="Used when a product in this category has no per-product related picks. Leave empty to use automatic same-category suggestions."
                          productIds={relatedIds}
                          products={products}
                          onChange={setRelatedIds}
                        />
                        <div className="mt-3 flex justify-end gap-3">
                          <button
                            onClick={() => setRelatedExpandedId(null)}
                            className="text-xs font-medium text-gray-500 hover:underline"
                            disabled={savingRelated}
                          >
                            Cancel
                          </button>
                          <button
                            onClick={() => saveRelatedDefaults(c)}
                            disabled={savingRelated}
                            className="bg-indigo-600 text-white px-4 py-1.5 rounded-md text-xs font-medium hover:bg-indigo-700 disabled:opacity-50"
                          >
                            {savingRelated ? "Saving..." : "Save related defaults"}
                          </button>
                        </div>
                      </td>
                    </tr>
                  )}
                  {expandedId === c.id && (
                    <tr>
                      <td colSpan={6} className="px-6 py-4 bg-gray-50">
                        <div className="mb-3 flex items-center justify-between gap-3">
                          <input
                            type="text"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            placeholder="Search products by name or SKU..."
                            className="flex-1 border rounded-md px-3 py-2 text-sm"
                          />
                          <span className="text-xs text-gray-500 whitespace-nowrap">
                            {pendingIds.size} selected
                          </span>
                        </div>

                        <div className="max-h-72 overflow-y-auto border rounded-md bg-white divide-y divide-gray-100">
                          {filteredProducts.length === 0 ? (
                            <div className="p-4 text-sm text-gray-500 text-center">No products match.</div>
                          ) : (
                            filteredProducts.map((p) => (
                              <label
                                key={p.id}
                                className="flex items-center gap-3 px-3 py-2 text-sm cursor-pointer hover:bg-gray-50"
                              >
                                <input
                                  type="checkbox"
                                  checked={pendingIds.has(p.id)}
                                  onChange={() => toggleProduct(p.id)}
                                  className="h-4 w-4"
                                />
                                <span className="flex-1 text-gray-900">{p.name}</span>
                                <span className="text-xs text-gray-400">{p.sku}</span>
                                {p.category && p.category !== c.name && (
                                  <span className="text-xs text-amber-600 whitespace-nowrap">
                                    currently: {p.category}
                                  </span>
                                )}
                              </label>
                            ))
                          )}
                        </div>

                        <div className="mt-3 flex justify-end gap-3">
                          <button
                            onClick={() => setExpandedId(null)}
                            className="text-xs font-medium text-gray-500 hover:underline"
                            disabled={saving}
                          >
                            Cancel
                          </button>
                          <button
                            onClick={() => saveAssignments(c)}
                            disabled={saving}
                            className="bg-indigo-600 text-white px-4 py-1.5 rounded-md text-xs font-medium hover:bg-indigo-700 disabled:opacity-50"
                          >
                            {saving ? "Saving..." : "Save assignments"}
                          </button>
                        </div>
                        <p className="mt-2 text-xs text-gray-400">
                          Checking a product assigns it to "{c.name}" (replacing any other category it had).
                          Unchecking a currently-assigned product clears its category.
                        </p>
                      </td>
                    </tr>
                  )}
                </Fragment>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}