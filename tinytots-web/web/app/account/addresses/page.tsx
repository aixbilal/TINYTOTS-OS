"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import { supabase } from "@/lib/supabase";
import AccountSidebar from "@/components/AccountSidebar";

const MAX_LEN = { label: 30, address: 300, city: 50 };

type Address = {
  id: number;
  label: string;
  address: string;
  city: string;
  is_default: boolean;
};

const PROFILE_MAX_LEN = { name: 80, phone: 20 };

export default function AddressesPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const [customerId, setCustomerId] = useState<number | null>(null);
  const [customerName, setCustomerName] = useState<string | null>(null);
  const [customerEmail, setCustomerEmail] = useState<string | null>(null);
  const [profileName, setProfileName] = useState("");
  const [profilePhone, setProfilePhone] = useState("");
  const [profileSaving, setProfileSaving] = useState(false);
  const [profileSaved, setProfileSaved] = useState(false);
  const [profileError, setProfileError] = useState<string | null>(null);
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
      .select("id, full_name, email, phone")
      .eq("auth_user_id", user!.id)
      .single();

    if (!customer) {
      setError("Couldn't load your account.");
      setLoading(false);
      return;
    }

    setCustomerId(customer.id);
    setCustomerName(customer.full_name);
    setCustomerEmail(customer.email);
    setProfileName(customer.full_name || "");
    setProfilePhone(customer.phone || "");

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

  async function handleProfileSave(e: React.FormEvent) {
    e.preventDefault();
    if (!customerId || !profileName.trim() || !profilePhone.trim()) return;

    setProfileSaving(true);
    setProfileError(null);
    setProfileSaved(false);

    const { error: saveError } = await supabase
      .from("customers")
      .update({ full_name: profileName.trim(), phone: profilePhone.trim() })
      .eq("id", customerId);

    setProfileSaving(false);
    if (saveError) {
      setProfileError("Couldn't save your profile. Please try again.");
      return;
    }
    setCustomerName(profileName.trim());
    setProfileSaved(true);
    setTimeout(() => setProfileSaved(false), 2500);
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

  async function handleSetDefault(id: number) {
    if (!customerId) return;
    await supabase.from("addresses").update({ is_default: false }).eq("customer_id", customerId);
    await supabase.from("addresses").update({ is_default: true }).eq("id", id);
    loadAddresses();
  }

  const inputClass =
    "w-full border rounded-lg px-4 py-3 bg-surface-elevated text-text-primary font-body-md text-body-md border-border-default focus:border-brand-primary focus:outline-none transition-colors";

  if (authLoading || loading) {
    return (
      <main className="max-w-container-max mx-auto py-stack-lg">
        <p className="font-body-md text-body-md text-text-secondary">Loading...</p>
      </main>
    );
  }

  if (!user) return null;

  return (
    <main className="max-w-container-max mx-auto w-full py-stack-lg flex flex-col md:flex-row gap-gutter">
      <AccountSidebar name={customerName} />

      <section className="flex-grow flex flex-col gap-stack-md min-w-0">
        <div>
          <h1 className="font-display-md text-display-md text-text-primary">Profile & Addresses</h1>
          <p className="font-body-md text-body-md text-text-secondary mt-2">
            Manage your personal information and saved addresses.
          </p>
        </div>

        {error && <p className="font-label-md text-label-md text-red-700">{error}</p>}

        {/* Profile Information */}
        <form
          onSubmit={handleProfileSave}
          className="border border-border-subtle rounded-2xl p-6 bg-surface-elevated flex flex-col gap-4"
        >
          <h2 className="font-headline-md text-headline-md text-text-primary">Profile Information</h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="font-label-md text-label-md text-text-secondary mb-1.5 block">Full Name</label>
              <input
                type="text"
                value={profileName}
                onChange={(e) => setProfileName(e.target.value.slice(0, PROFILE_MAX_LEN.name))}
                maxLength={PROFILE_MAX_LEN.name}
                className={inputClass}
              />
            </div>
            <div>
              <label className="font-label-md text-label-md text-text-secondary mb-1.5 block">Email Address</label>
              <input
                type="email"
                value={customerEmail ?? ""}
                disabled
                title="Email is tied to your login and can't be changed here."
                className={`${inputClass} opacity-60 cursor-not-allowed`}
              />
            </div>
            <div>
              <label className="font-label-md text-label-md text-text-secondary mb-1.5 block">Phone Number</label>
              <input
                type="tel"
                value={profilePhone}
                onChange={(e) => setProfilePhone(e.target.value.slice(0, PROFILE_MAX_LEN.phone))}
                maxLength={PROFILE_MAX_LEN.phone}
                className={inputClass}
              />
            </div>
          </div>
          {profileError && <p className="font-label-md text-label-md text-red-700">{profileError}</p>}
          {profileSaved && <p className="font-label-md text-label-md text-green-700">Profile updated.</p>}
          <button
            type="submit"
            disabled={profileSaving}
            className="self-start bg-brand-primary text-white font-button text-button px-6 py-2.5 rounded-xl hover:opacity-90 transition-opacity disabled:opacity-50"
          >
            {profileSaving ? "Saving..." : "Save Changes"}
          </button>
        </form>

        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <h2 className="font-headline-md text-headline-md text-text-primary">Saved Addresses</h2>
          {!showForm && (
            <button
              onClick={() => setShowForm(true)}
              className="bg-brand-primary text-white font-button text-button h-12 px-6 rounded-xl hover:opacity-90 transition-opacity flex items-center gap-2 shadow-sm whitespace-nowrap"
            >
              <span className="material-symbols-outlined">add</span> Add New Address
            </button>
          )}
        </div>

        {showForm && (
          <form
            onSubmit={handleSave}
            className="border border-border-default rounded-2xl p-6 bg-surface-elevated flex flex-col gap-3"
          >
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
            <label className="flex items-center gap-2 font-body-sm text-body-sm text-text-secondary">
              <input type="checkbox" checked={isDefault} onChange={(e) => setIsDefault(e.target.checked)} />
              Set as default address
            </label>
            <div className="flex gap-3 mt-1">
              <button
                type="submit"
                disabled={saving}
                className="bg-brand-primary text-white px-5 py-2.5 rounded-xl font-button text-button hover:opacity-90 transition-opacity disabled:opacity-50"
              >
                {saving ? "Saving..." : editingId ? "Update address" : "Save address"}
              </button>
              <button
                type="button"
                onClick={resetForm}
                className="px-5 py-2.5 rounded-xl font-button text-button text-text-secondary hover:underline"
              >
                Cancel
              </button>
            </div>
          </form>
        )}

        {addresses.length === 0 && !showForm ? (
          <p className="font-body-sm text-body-sm text-text-secondary">
            No saved addresses yet. Add one so you don't have to retype it at checkout.
          </p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-bento-gap">
            {addresses.map((a) => (
              <div
                key={a.id}
                className="border border-border-default rounded-2xl p-6 bg-surface-elevated flex flex-col relative overflow-hidden group"
              >
                {a.is_default && (
                  <div className="absolute top-0 right-0 p-4">
                    <span className="bg-brand-primary/10 text-brand-primary font-label-md text-label-md px-3 py-1 rounded-full">
                      Default
                    </span>
                  </div>
                )}
                <div className="flex items-center gap-3 mb-4">
                  <span
                    className={`flex items-center justify-center w-9 h-9 rounded-full ${
                      a.is_default
                        ? "text-brand-primary bg-brand-primary/20"
                        : "text-text-secondary bg-surface-secondary"
                    }`}
                  >
                    <span className="material-symbols-outlined text-[20px]">
                      {a.is_default ? "local_shipping" : "house"}
                    </span>
                  </span>
                  <h3 className="font-headline-md text-headline-md text-text-primary">{a.label}</h3>
                </div>
                <div className="font-body-md text-body-md text-text-secondary flex-grow">
                  <p>{a.address}</p>
                  <p>{a.city}</p>
                </div>
                <div className="mt-6 flex gap-3 border-t border-border-default pt-4 flex-wrap items-center">
                  <button
                    onClick={() => startEdit(a)}
                    className="font-button text-button text-text-secondary hover:text-brand-primary transition-colors"
                  >
                    Edit
                  </button>
                  <span className="text-border-default">|</span>
                  <button
                    onClick={() => handleDelete(a.id)}
                    className="font-button text-button text-red-700 hover:opacity-80 transition-opacity"
                  >
                    Delete
                  </button>
                  {!a.is_default && (
                    <>
                      <span className="text-border-default hidden md:inline">|</span>
                      <button
                        onClick={() => handleSetDefault(a.id)}
                        className="font-button text-button text-text-secondary hover:text-brand-primary transition-colors text-sm w-full md:w-auto mt-2 md:mt-0 text-left"
                      >
                        Set as Default
                      </button>
                    </>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </main>
  );
}