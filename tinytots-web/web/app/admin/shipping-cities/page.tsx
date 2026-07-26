"use client";

import { useEffect, useState } from "react";
import { adminFetch } from "@/lib/admin-fetch";

interface City {
  id: number;
  name: string;
}

export default function AdminShippingCitiesPage() {
  const [mode, setMode] = useState<"list" | "all_pakistan">("list");
  const [cities, setCities] = useState<City[]>([]);
  const [newCity, setNewCity] = useState("");
  const [loading, setLoading] = useState(true);
  const [savingMode, setSavingMode] = useState(false);
  const [addingCity, setAddingCity] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  async function load() {
    setLoading(true);
    const [settingsRes, citiesRes] = await Promise.all([
      adminFetch("/api/admin/settings"),
      adminFetch("/api/admin/shipping-cities"),
    ]);
    const settingsData = await settingsRes.json();
    const citiesData = await citiesRes.json();

    if (settingsRes.ok) {
      const codModeSetting = (settingsData.settings || []).find((s: any) => s.key === "cod_city_mode");
      setMode(codModeSetting?.value === "all_pakistan" ? "all_pakistan" : "list");
    }
    if (citiesRes.ok) setCities(citiesData.cities || []);
    else setErrorMsg(citiesData.error || "Failed to load cities");

    setLoading(false);
  }

  useEffect(() => {
    load();
  }, []);

  async function handleModeChange(newMode: "list" | "all_pakistan") {
    setSavingMode(true);
    setErrorMsg("");
    const res = await adminFetch("/api/admin/settings", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ key: "cod_city_mode", value: newMode }),
    });
    const data = await res.json();
    if (!res.ok) {
      setErrorMsg(data.error || "Failed to update delivery mode");
    } else {
      setMode(newMode);
    }
    setSavingMode(false);
  }

  async function handleAddCity(e: React.FormEvent) {
    e.preventDefault();
    if (!newCity.trim()) return;
    setAddingCity(true);
    setErrorMsg("");
    const res = await adminFetch("/api/admin/shipping-cities", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: newCity.trim() }),
    });
    const data = await res.json();
    if (!res.ok) {
      setErrorMsg(data.error || "Failed to add city");
    } else {
      setNewCity("");
      load();
    }
    setAddingCity(false);
  }

  async function handleDelete(id: number) {
    if (!confirm("Remove this city from the COD delivery list?")) return;
    const res = await adminFetch(`/api/admin/shipping-cities/${id}`, { method: "DELETE" });
    const data = await res.json();
    if (!res.ok) {
      setErrorMsg(data.error || "Failed to remove city");
      return;
    }
    load();
  }

  if (loading) {
    return <div className="max-w-2xl mx-auto text-center py-12 text-gray-500">Loading...</div>;
  }

  return (
    <div className="max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold text-gray-900 mb-1">Delivery Cities</h1>
      <p className="text-sm text-gray-500 mb-6">
        Control which cities allow Cash on Delivery at checkout.
      </p>

      {errorMsg && <div className="mb-4 p-3 bg-red-50 text-red-700 text-sm rounded">{errorMsg}</div>}

      <div className="bg-white rounded-lg border border-gray-200 p-6 shadow-sm mb-6">
        <h2 className="text-sm font-semibold text-gray-900 mb-3">Delivery mode</h2>
        <div className="flex flex-col gap-3">
          <label className={`flex items-start gap-3 border rounded-lg px-4 py-3 cursor-pointer ${mode === "list" ? "border-indigo-500 bg-indigo-50" : "border-gray-200"}`}>
            <input
              type="radio"
              checked={mode === "list"}
              onChange={() => handleModeChange("list")}
              disabled={savingMode}
              className="mt-1"
            />
            <div>
              <p className="text-sm font-medium text-gray-900">Restrict to city list</p>
              <p className="text-xs text-gray-500">
                Only the cities listed below allow Cash on Delivery. Other cities must pay online.
              </p>
            </div>
          </label>
          <label className={`flex items-start gap-3 border rounded-lg px-4 py-3 cursor-pointer ${mode === "all_pakistan" ? "border-indigo-500 bg-indigo-50" : "border-gray-200"}`}>
            <input
              type="radio"
              checked={mode === "all_pakistan"}
              onChange={() => handleModeChange("all_pakistan")}
              disabled={savingMode}
              className="mt-1"
            />
            <div>
              <p className="text-sm font-medium text-gray-900">Allow all of Pakistan</p>
              <p className="text-xs text-gray-500">
                Cash on Delivery is available everywhere. The city list below is ignored.
              </p>
            </div>
          </label>
        </div>
      </div>

      <div className={`bg-white rounded-lg border border-gray-200 p-6 shadow-sm ${mode === "all_pakistan" ? "opacity-50" : ""}`}>
        <h2 className="text-sm font-semibold text-gray-900 mb-1">City list</h2>
        <p className="text-xs text-gray-500 mb-4">
          {mode === "all_pakistan"
            ? "Not currently used, since COD is allowed everywhere."
            : "Add any city not already in the list below — there's no fixed preset, type the name yourself."}
        </p>

        <form onSubmit={handleAddCity} className="flex gap-3 mb-4">
          <input
            type="text"
            value={newCity}
            onChange={(e) => setNewCity(e.target.value)}
            placeholder="e.g. Peshawar, Quetta, Hyderabad..."
            disabled={mode === "all_pakistan"}
            className="flex-1 border rounded-md px-3 py-2 text-sm disabled:bg-gray-50"
          />
          <button
            type="submit"
            disabled={addingCity || mode === "all_pakistan"}
            className="bg-indigo-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-indigo-700 disabled:opacity-50"
          >
            {addingCity ? "Adding..." : "+ Add"}
          </button>
        </form>

        <div className="flex flex-wrap gap-2">
          {cities.map((c) => (
            <span
              key={c.id}
              className="inline-flex items-center gap-2 bg-gray-100 text-gray-700 text-sm px-3 py-1.5 rounded-full capitalize"
            >
              {c.name}
              <button
                onClick={() => handleDelete(c.id)}
                disabled={mode === "all_pakistan"}
                className="text-gray-400 hover:text-red-600 disabled:opacity-40"
                aria-label={`Remove ${c.name}`}
              >
                ×
              </button>
            </span>
          ))}
          {cities.length === 0 && <p className="text-sm text-gray-400">No cities added yet.</p>}
        </div>
      </div>
    </div>
  );
}
