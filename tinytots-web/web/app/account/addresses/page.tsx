"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/lib/auth-context";
import { supabase } from "@/lib/supabase";

const MAX_LEN = { label: 30, address: 300, city: 50 };

type Address = {
  id: number;
  label: string;
  address: string;
  city: string;
  is_default: boolean;
};

export default function AddressesPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const [customerId, setCustomerId] = useState<number | null>(null);
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [label, setLabel] = useState("Home");
  const [address, setAddress] = useState("");
  const [city, setCity] = useState("");
  const [isDefault, setIsDefault] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!authLoading && !user) router.push("/login");
  }, [authLoading, user, router]);

  useEffect(() => {
    if (!user) return;
    loadAddresses();
  }, [user]);

  async function loadAddresses() {
    setLoading(true);
    setError(null);
    const { data: customer } = await supabase
      .from("customers")
      .select("id")
      .eq("auth_user_id", user!.id)
      .single();

    if (!customer) {
      setError("Couldn't load your account.");
      setLoading(false);
      return;
    }

    setCustomerId(customer.id);

    const { data, error: addrError } = await supabase
      .from("addresses")
      .select("*")
      .eq("customer_id", customer.id)
      .order("is_default", { ascending: false })
      .order("created_at", { ascending: false });

    if (addrError) {
      setError("Couldn't load your addresses.");
    } else {
      setAddresses(data || []);
    }
    setLoading(false);
  }

  function resetForm() {
    setEditingId(null);
    setLabel("Home");
    setAddress("");
    setCity("");
    setIsDefault(false);
    setShowForm(false);
  }

  function startEdit(a: Address) {
    setEditingId(a.id);
    setLabel(a.label);
    setAddress(a.address);
    setCity(a.city);
    setIsDefault(a.is_default);
    setShowForm(true);
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    if (!address.trim() || !city.trim() || !customerId) return;

    setSaving(true);
    setError(null);

    // If this one is being set as default, clear the flag on all others first —
    // simplest way to enforce "only one default" without a DB constraint.
    if (isDefault) {
      await supabase.from("addresses").update({ is_default: false }).eq("customer_id", customerId);
    }

    const payload = {
      customer_id: customerId,
      label: label.trim() || "Home",
      address: address.trim(),
      city: city.trim(),
      is_default: isDefault,
    };

    const { error: saveError } = editingId
      ? await supabase.from("addresses").update(payload).eq("id", editingId)
      : await supabase.from("addresses").insert(payload);

    if (saveError) {
      setError("Couldn't save this address. Please try again.");
      setSaving(false);
      return;
    }

    setSaving(false);
    resetForm();
    loadAddresses();
  }

  async function handleDelete(id: number) {
    if (!confirm("Delete this address?")) return;
    const { error: delError } = await supabase.from("addresses").delete().eq("id", id);
    if (delError) {
      setError("Couldn't delete this address.");
      return;
    }
    setAddresses((prev) => prev.filter((a) => a.id !== id));
  }

  const inputClass =
    "w-full border rounded-lg px-4 py-3 bg-surface-container-lowest text-on-surface font-body-md text-body-md border-outline-variant focus:border-primary focus:outline-none transition-colors";

  if (authLoading || loading) {
    return (
      <main className="max-w-2xl mx-auto px-margin-mobile md:px-margin-desktop py-stack-lg">
        <p className="font-body-md text-body-md text-on-surface-variant">Loading...</p>
      </main>
    );
  }

  if (!user) return null;

  return (
    <main className="max-w-2xl mx-auto px-margin-mobile md:px-margin-desktop py-stack-lg">
      <Link href="/account" className="text-sm font-medium text-primary hover:underline mb-4 inline-block">
        ← Back to account
      </Link>

      <div className="flex justify-between items-center mb-stack-md">
        <h1 className="font-display-md text-display-md text-on-surface">Saved Addresses</h1>
        {!showForm && (
          <button
            onClick={() => setShowForm(true)}
            className="font-body-sm text-body-sm bg-primary-container text-on-primary px-4 py-2 rounded-lg hover:bg-primary transition-colors"
          >
            + Add address
          </button>
        )}
      </div>

      {error && <p className="font-label-md text-label-md text-error mb-4">{error}</p>}

      {showForm && (
        <form onSubmit={handleSave} className="border border-outline-variant/30 rounded-xl p-5 mb-stack-md flex flex-col gap-3">
          <input
            type="text"
            placeholder="Label (e.g. Home, Office)"
            value={label}
            onChange={(e) => setLabel(e.target.value.slice(0, MAX_LEN.label))}
            maxLength={MAX_LEN.label}
            className={inputClass}
          />
          <textarea
            placeholder="Full address (house/street/area)"
            value={address}
            onChange={(e) => setAddress(e.target.value.slice(0, MAX_LEN.address))}
            maxLength={MAX_LEN.address}
            rows={3}
            className={inputClass}
          />
          <input
            type="text"
            placeholder="City"
            value={city}
            onChange={(e) => setCity(e.target.value.slice(0, MAX_LEN.city))}
            maxLength={MAX_LEN.city}
            className={inputClass}
          />
          <label className="flex items-center gap-2 font-body-sm text-body-sm text-on-surface-variant">
            <input type="checkbox" checked={isDefault} onChange={(e) => setIsDefault(e.target.checked)} />
            Set as default address
          </label>
          <div className="flex gap-3 mt-1">
            <button
              type="submit"
              disabled={saving}
              className="bg-primary-container text-on-primary px-4 py-2 rounded-lg font-body-sm text-body-sm hover:bg-primary transition-colors disabled:opacity-50"
            >
              {saving ? "Saving..." : editingId ? "Update address" : "Save address"}
            </button>
            <button
              type="button"
              onClick={resetForm}
              className="px-4 py-2 rounded-lg font-body-sm text-body-sm text-on-surface-variant hover:underline"
            >
              Cancel
            </button>
          </div>
        </form>
      )}

      {addresses.length === 0 && !showForm ? (
        <p className="font-body-sm text-body-sm text-on-surface-variant">
          No saved addresses yet. Add one so you don't have to retype it at checkout.
        </p>
      ) : (
        <div className="flex flex-col gap-3">
          {addresses.map((a) => (
            <div key={a.id} className="border border-outline-variant/30 rounded-xl p-4 flex justify-between items-start">
              <div>
                <p className="font-body-md text-body-md text-on-surface font-semibold">
                  {a.label} {a.is_default && <span className="text-xs text-primary font-normal">(default)</span>}
                </p>
                <p className="font-body-sm text-body-sm text-on-surface-variant">{a.address}</p>
                <p className="font-body-sm text-body-sm text-on-surface-variant">{a.city}</p>
              </div>
              <div className="flex flex-col gap-1 text-right shrink-0 ml-3">
                <button onClick={() => startEdit(a)} className="text-xs font-medium text-primary hover:underline">
                  Edit
                </button>
                <button onClick={() => handleDelete(a.id)} className="text-xs font-medium text-error hover:underline">
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </main>
  );
}