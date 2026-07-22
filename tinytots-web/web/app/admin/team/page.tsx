"use client";

import { useEffect, useState } from "react";
import { useAdminAuth } from "@/lib/admin-auth-context";
import { adminFetch } from "@/lib/admin-fetch";

type TeamMember = { id: string; name: string; email: string; role: string; is_active: boolean };

const ROLES = ["admin", "order_manager", "support", "inventory_only"];

export default function TeamPage() {
  const { admin } = useAdminAuth();
  const [team, setTeam] = useState<TeamMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [role, setRole] = useState("support");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastTempPassword, setLastTempPassword] = useState<string | null>(null);

  function loadTeam() {
    setLoading(true);
    adminFetch("/api/admin/team")
      .then((r) => r.json())
      .then((json) => setTeam(json.data || []))
      .finally(() => setLoading(false));
  }

  useEffect(() => { loadTeam(); }, []);

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!name.trim() || !email.trim()) return setError("Name and email are required.");

    setSubmitting(true);
    const res = await adminFetch("/api/admin/team", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, email, role }),
    });
    const json = await res.json();
    setSubmitting(false);
    if (!res.ok) { setError(json.error); return; }

    setLastTempPassword(json.temp_password);
    setName(""); setEmail(""); setRole("support");
    loadTeam();
  }

  async function toggleActive(member: TeamMember) {
    await adminFetch(`/api/admin/team/${member.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ is_active: !member.is_active }),
    });
    loadTeam();
  }

  async function changeRole(member: TeamMember, newRole: string) {
    await adminFetch(`/api/admin/team/${member.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ role: newRole }),
    });
    loadTeam();
  }

  async function handleRemove(member: TeamMember) {
    if (!confirm(`Permanently remove ${member.name}? This cannot be undone.`)) return;
    await adminFetch(`/api/admin/team/${member.id}`, { method: "DELETE" });
    loadTeam();
  }

  const inputClass =
    "border rounded-lg px-4 py-2 bg-surface-container-lowest text-on-surface font-body-md text-body-md border-outline-variant focus:border-primary focus:outline-none";

  if (admin && admin.role !== "admin") {
    return <p className="font-body-md text-body-md text-error">Only Admins can manage the team.</p>;
  }

  return (
    <div className="max-w-2xl">
      <h1 className="font-display-md text-display-md text-on-surface mb-stack-md">Team</h1>

      <form onSubmit={handleAdd} className="border border-outline-variant/30 rounded-lg p-4 flex flex-col gap-3 mb-6">
        <h2 className="font-headline-md text-headline-md text-on-surface">Add team member</h2>
        <div className="grid grid-cols-2 gap-3">
          <input placeholder="Name" value={name} onChange={(e) => setName(e.target.value)} className={inputClass} />
          <input placeholder="Email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} className={inputClass} />
        </div>
        <select value={role} onChange={(e) => setRole(e.target.value)} className={`${inputClass} capitalize`}>
          {ROLES.map((r) => (
            <option key={r} value={r} className="capitalize">{r.replace("_", " ")}</option>
          ))}
        </select>
        <button type="submit" disabled={submitting} className="self-start px-5 py-2 rounded-xl bg-primary-container text-on-primary font-button text-button hover:bg-primary disabled:opacity-50">
          {submitting ? "Creating..." : "Add member"}
        </button>
        {error && <p className="font-label-md text-label-md text-error">{error}</p>}
        {lastTempPassword && (
          <p className="font-body-sm text-body-sm text-primary bg-primary-container/20 rounded-lg px-3 py-2">
            Account created. Temporary password (share securely — shown once): <strong>{lastTempPassword}</strong>
          </p>
        )}
      </form>

      {loading ? (
        <p className="font-body-md text-body-md text-on-surface-variant">Loading...</p>
      ) : (
        <table className="w-full border-collapse">
          <thead>
            <tr className="text-left border-b border-outline-variant/30">
              <th className="py-2 font-label-md text-label-md text-on-surface-variant">Name</th>
              <th className="py-2 font-label-md text-label-md text-on-surface-variant">Email</th>
              <th className="py-2 font-label-md text-label-md text-on-surface-variant">Role</th>
              <th className="py-2 font-label-md text-label-md text-on-surface-variant">Active</th>
            </tr>
          </thead>
          <tbody>
            {team.map((m) => (
              <tr key={m.id} className="border-b border-outline-variant/10">
                <td className="py-3 font-body-sm text-body-sm text-on-surface">{m.name}</td>
                <td className="py-3 font-body-sm text-body-sm text-on-surface-variant">{m.email}</td>
                <td className="py-3">
                  <select value={m.role} onChange={(e) => changeRole(m, e.target.value)} className={`${inputClass} py-1 capitalize`}>
                    {ROLES.map((r) => (
                      <option key={r} value={r} className="capitalize">{r.replace("_", " ")}</option>
                    ))}
                  </select>
                </td>
                <td className="py-3 flex gap-3">
                  <button onClick={() => toggleActive(m)} className={`font-label-md text-label-md hover:underline ${m.is_active ? "text-error" : "text-primary"}`}>
                    {m.is_active ? "Deactivate" : "Reactivate"}
                  </button>
                  <button onClick={() => handleRemove(m)} className="font-label-md text-label-md text-error hover:underline">
                    Remove
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}