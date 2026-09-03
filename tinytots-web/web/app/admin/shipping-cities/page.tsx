"use client";

import { useEffect, useState } from "react";
import { adminFetch } from "@/lib/admin-fetch";
import { AdminPageHeader, AdminCard, AdminButton, AdminAlert, adminInputClass } from "@/components/admin/ui";

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
    return <div className="mx-auto max-w-2xl py-12 text-center font-body-sm text-body-sm text-text-secondary">Loading…</div>;
  }

  return (
    <div className="mx-auto max-w-2xl">
      <AdminPageHeader
        breadcrumb={["Business", "Delivery cities"]}
        title="Delivery cities"
        description="Control which cities allow Cash on Delivery at checkout."
      />

      {errorMsg && (
        <div className="mb-4">
          <AdminAlert tone="danger">{errorMsg}</AdminAlert>
        </div>
      )}

      <AdminCard title="Delivery mode" className="mb-6">
        <div className="flex flex-col gap-3">
          <label className={`flex cursor-pointer items-start gap-3 rounded-lg border px-4 py-3 ${mode === "list" ? "border-brand-primary bg-brand-primary/5" : "border-border-default"}`}>
            <input
              type="radio"
              checked={mode === "list"}
              onChange={() => handleModeChange("list")}
              disabled={savingMode}
              className="mt-1"
            />
            <div>
              <p className="font-body-sm text-body-sm font-medium text-text-primary">Restrict to city list</p>
              <p className="font-label-md text-label-md text-text-secondary">
                Only the cities listed below allow Cash on Delivery. Other cities must pay online.
              </p>
            </div>
          </label>
          <label className={`flex cursor-pointer items-start gap-3 rounded-lg border px-4 py-3 ${mode === "all_pakistan" ? "border-brand-primary bg-brand-primary/5" : "border-border-default"}`}>
            <input
              type="radio"
              checked={mode === "all_pakistan"}
              onChange={() => handleModeChange("all_pakistan")}
              disabled={savingMode}
              className="mt-1"
            />
            <div>
              <p className="font-body-sm text-body-sm font-medium text-text-primary">Allow all of Pakistan</p>
              <p className="font-label-md text-label-md text-text-secondary">
                Cash on Delivery is available everywhere. The city list below is ignored.
              </p>
            </div>
          </label>
        </div>
      </AdminCard>

      <AdminCard title="City list" className={mode === "all_pakistan" ? "opacity-50" : ""}>
        <p className="mb-4 font-label-md text-label-md text-text-secondary">
          {mode === "all_pakistan"
            ? "Not currently used, since COD is allowed everywhere."
            : "Add any city not already in the list below — there's no fixed preset, type the name yourself."}
        </p>

        <form onSubmit={handleAddCity} className="mb-4 flex gap-3">
          <input
            type="text"
            value={newCity}
            onChange={(e) => setNewCity(e.target.value)}
            placeholder="e.g. Peshawar, Quetta, Hyderabad..."
            disabled={mode === "all_pakistan"}
            className={`flex-1 ${adminInputClass}`}
          />
          <AdminButton type="submit" variant="primary" disabled={addingCity || mode === "all_pakistan"}>
            {addingCity ? "Adding…" : "Add"}
          </AdminButton>
        </form>

        <div className="flex flex-wrap gap-2">
          {cities.map((c) => (
            <span
              key={c.id}
              className="inline-flex items-center gap-2 rounded-full bg-surface-secondary px-3 py-1.5 font-body-sm text-body-sm capitalize text-text-secondary"
            >
              {c.name}
              <button
                onClick={() => handleDelete(c.id)}
                disabled={mode === "all_pakistan"}
                className="text-text-secondary hover:text-red-600 disabled:opacity-40"
                aria-label={`Remove ${c.name}`}
              >
                ×
              </button>
            </span>
          ))}
          {cities.length === 0 && (
            <p className="font-body-sm text-body-sm text-text-secondary">No cities added yet.</p>
          )}
        </div>
      </AdminCard>
    </div>
  );
}
