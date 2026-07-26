"use client";

import { useEffect, useState } from "react";
import { adminFetch } from "@/lib/admin-fetch";

interface Category {
  id: number;
  name: string;
  slug: string;
  display_order: number;
}

export default function AdminCategoriesPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [newName, setNewName] = useState("");
  const [adding, setAdding] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editName, setEditName] = useState("");
  const [editOrder, setEditOrder] = useState("0");

  async function load() {
    setLoading(true);
    const res = await adminFetch("/api/admin/categories");
    const data = await res.json();
    if (res.ok) setCategories(data.categories || []);
    else setErrorMsg(data.error || "Failed to load categories");
    setLoading(false);
  }

  useEffect(() => {
    load();
  }, []);

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
  }

  async function saveEdit() {
    if (!editingId) return;
    const res = await adminFetch(`/api/admin/categories/${editingId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: editName.trim(), display_order: editOrder }),
    });
    const data = await res.json();
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

  return (
    <div className="max-w-3xl mx-auto">
      <h1 className="text-2xl font-bold text-gray-900 mb-1">Categories</h1>
      <p className="text-sm text-gray-500 mb-6">
        Manage the categories available when adding or editing products. Lower "Order" values show first.
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
                <th className="px-6 py-3">Name</th>
                <th className="px-6 py-3">Order</th>
                <th className="px-6 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {categories.map((c) => (
                <tr key={c.id} className="hover:bg-gray-50">
                  {editingId === c.id ? (
                    <>
                      <td className="px-6 py-3">
                        <input
                          value={editName}
                          onChange={(e) => setEditName(e.target.value)}
                          className="border rounded px-2 py-1 text-sm w-full"
                        />
                      </td>
                      <td className="px-6 py-3">
                        <input
                          type="number"
                          value={editOrder}
                          onChange={(e) => setEditOrder(e.target.value)}
                          className="border rounded px-2 py-1 text-sm w-20"
                        />
                      </td>
                      <td className="px-6 py-3 text-right space-x-3">
                        <button onClick={saveEdit} className="text-xs font-medium text-indigo-600 hover:underline">
                          Save
                        </button>
                        <button onClick={() => setEditingId(null)} className="text-xs font-medium text-gray-500 hover:underline">
                          Cancel
                        </button>
                      </td>
                    </>
                  ) : (
                    <>
                      <td className="px-6 py-4 font-medium text-gray-900">{c.name}</td>
                      <td className="px-6 py-4">{c.display_order}</td>
                      <td className="px-6 py-4 text-right space-x-3">
                        <button onClick={() => startEdit(c)} className="text-xs font-medium text-indigo-600 hover:underline">
                          Edit
                        </button>
                        <button onClick={() => handleDelete(c.id)} className="text-xs font-medium text-red-600 hover:underline">
                          Delete
                        </button>
                      </td>
                    </>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
