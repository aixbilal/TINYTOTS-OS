"use client";

import { useEffect, useState } from "react";
import { useAdminAuth } from "@/lib/admin-auth-context";
import { adminFetch } from "@/lib/admin-fetch";
import { isValidEmail, EMAIL_ERROR } from "@/lib/validate-email";
import {
  AdminPageHeader,
  AdminCard,
  AdminButton,
  AdminBadge,
  AdminTableWrap,
  AdminTh,
  AdminTd,
  AdminConfirmDialog,
} from "@/components/admin/ui";

type TeamMember = { id: string; name: string; email: string; role: string; is_active: boolean };

const ROLES = ["admin", "order_manager", "support", "inventory_only"];
const roleLabel = (r: string) => r.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());

export default function TeamPage() {
  const { admin } = useAdminAuth();
  const [team, setTeam] = useState<TeamMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [role, setRole] = useState("support");
  const [submitting, setSubmitting] = useState(false);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [lastTempPassword, setLastTempPassword] = useState<string | null>(null);
  const [confirmAction, setConfirmAction] = useState<
    { kind: "remove" | "deactivate"; member: TeamMember } | null
  >(null);

  function loadTeam() {
    setLoading(true);
    setError(null);
    adminFetch("/api/admin/team")
      .then(async (r) => {
        const json = await r.json();
        if (!r.ok) {
          setTeam([]);
          setError(json.error || "Failed to load team.");
          return;
        }
        setTeam(json.data || []);
      })
      .catch(() => {
        setTeam([]);
        setError("Failed to load team.");
      })
      .finally(() => setLoading(false));
  }

  useEffect(() => {
    loadTeam();
  }, []);

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setNotice(null);
    if (!name.trim() || !email.trim()) return setError("Name and email are required.");
    if (!isValidEmail(email)) return setError(EMAIL_ERROR);
    if (!ROLES.includes(role)) return setError("Please select a valid role.");

    setSubmitting(true);
    const res = await adminFetch("/api/admin/team", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, email, role }),
    });
    const json = await res.json();
    setSubmitting(false);
    if (!res.ok) {
      setError(json.error || "Couldn't add team member.");
      return;
    }
    setLastTempPassword(json.temp_password);
    setNotice(`${name} added.`);
    setName("");
    setEmail("");
    setRole("support");
    loadTeam();
  }

  async function mutate(id: string, body: object, okMsg: string) {
    setBusyId(id);
    setError(null);
    setNotice(null);
    try {
      const res = await adminFetch(`/api/admin/team/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (!res.ok) {
        const j = await res.json().catch(() => ({}));
        setError(j.error || "Update failed.");
      } else {
        setNotice(okMsg);
        loadTeam();
      }
    } finally {
      setBusyId(null);
    }
  }

  async function doRemove(member: TeamMember) {
    setBusyId(member.id);
    setError(null);
    setNotice(null);
    try {
      const res = await adminFetch(`/api/admin/team/${member.id}`, { method: "DELETE" });
      if (!res.ok) {
        const j = await res.json().catch(() => ({}));
        setError(j.error || "Couldn't remove team member.");
      } else {
        setNotice(`${member.name} removed.`);
        loadTeam();
      }
    } finally {
      setBusyId(null);
      setConfirmAction(null);
    }
  }

  const inputClass =
    "rounded-md border border-border-default bg-surface-elevated px-3 py-2 font-body-sm text-body-sm text-text-primary focus:border-brand-primary focus:outline-none";

  if (admin && admin.role !== "admin") {
    return <p className="font-body-sm text-body-sm text-red-700">Only Admins can manage the team.</p>;
  }

  return (
    <div className="mx-auto max-w-3xl">
      <AdminPageHeader title="Team" description="Team members and their roles. Role changes take effect on their next request." />

      {error && (
        <p className="mb-4 rounded-md border border-red-200 bg-red-50 px-3 py-2 font-body-sm text-body-sm text-red-800">{error}</p>
      )}
      {notice && (
        <p className="mb-4 rounded-md border border-green-200 bg-green-50 px-3 py-2 font-body-sm text-body-sm text-green-800">{notice}</p>
      )}

      <AdminCard title="Add team member" className="mb-6">
        <form onSubmit={handleAdd} className="flex flex-col gap-3">
          <div className="grid gap-3 sm:grid-cols-2">
            <input placeholder="Name" value={name} onChange={(e) => setName(e.target.value)} className={inputClass} />
            <input placeholder="Email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} className={inputClass} />
          </div>
          <select value={role} onChange={(e) => setRole(e.target.value)} className={`${inputClass} sm:w-56`}>
            {ROLES.map((r) => (
              <option key={r} value={r}>{roleLabel(r)}</option>
            ))}
          </select>
          <AdminButton type="submit" variant="primary" disabled={submitting} className="self-start">
            {submitting ? "Creating…" : "Add member"}
          </AdminButton>
          {lastTempPassword && (
            <p className="rounded-md border border-amber-200 bg-amber-50 px-3 py-2 font-body-sm text-body-sm text-amber-900">
              Account created. Temporary password (shown once — share securely): <strong>{lastTempPassword}</strong>
            </p>
          )}
        </form>
      </AdminCard>

      <AdminCard padded={false}>
        {loading ? (
          <p className="px-5 py-8 text-center font-body-sm text-body-sm text-text-secondary">Loading team…</p>
        ) : (
          <AdminTableWrap className="rounded-none border-0">
            <thead>
              <tr>
                <AdminTh>Name</AdminTh>
                <AdminTh>Email</AdminTh>
                <AdminTh>Role</AdminTh>
                <AdminTh>Status</AdminTh>
                <AdminTh className="text-right">Actions</AdminTh>
              </tr>
            </thead>
            <tbody>
              {team.map((m) => {
                const busy = busyId === m.id;
                return (
                  <tr key={m.id} className="hover:bg-surface-secondary/50">
                    <AdminTd className="font-medium">{m.name}</AdminTd>
                    <AdminTd className="text-text-secondary">{m.email}</AdminTd>
                    <AdminTd>
                      <select
                        value={m.role}
                        disabled={busy}
                        onChange={(e) => mutate(m.id, { role: e.target.value }, `${m.name}'s role updated.`)}
                        className={`${inputClass} py-1`}
                        aria-label={`Role for ${m.name}`}
                      >
                        {ROLES.map((r) => (
                          <option key={r} value={r}>{roleLabel(r)}</option>
                        ))}
                      </select>
                    </AdminTd>
                    <AdminTd>
                      <AdminBadge tone={m.is_active ? "success" : "neutral"}>
                        {m.is_active ? "Active" : "Inactive"}
                      </AdminBadge>
                    </AdminTd>
                    <AdminTd className="whitespace-nowrap text-right">
                      <div className="flex justify-end gap-2">
                        {m.is_active ? (
                          <AdminButton
                            variant="ghost"
                            disabled={busy}
                            onClick={() => setConfirmAction({ kind: "deactivate", member: m })}
                          >
                            Deactivate
                          </AdminButton>
                        ) : (
                          <AdminButton
                            variant="secondary"
                            disabled={busy}
                            onClick={() => mutate(m.id, { is_active: true }, `${m.name} reactivated.`)}
                          >
                            Reactivate
                          </AdminButton>
                        )}
                        <AdminButton
                          variant="danger"
                          disabled={busy}
                          onClick={() => setConfirmAction({ kind: "remove", member: m })}
                        >
                          Remove
                        </AdminButton>
                      </div>
                    </AdminTd>
                  </tr>
                );
              })}
            </tbody>
          </AdminTableWrap>
        )}
      </AdminCard>

      {confirmAction && (
        <AdminConfirmDialog
          title={confirmAction.kind === "remove" ? `Remove ${confirmAction.member.name}?` : `Deactivate ${confirmAction.member.name}?`}
          message={
            confirmAction.kind === "remove"
              ? "This permanently removes their admin account and cannot be undone."
              : "They keep their account but lose admin access until reactivated."
          }
          confirmLabel={confirmAction.kind === "remove" ? "Remove" : "Deactivate"}
          danger
          busy={busyId === confirmAction.member.id}
          onCancel={() => setConfirmAction(null)}
          onConfirm={() => {
            if (confirmAction.kind === "remove") doRemove(confirmAction.member);
            else {
              mutate(confirmAction.member.id, { is_active: false }, `${confirmAction.member.name} deactivated.`);
              setConfirmAction(null);
            }
          }}
        />
      )}
    </div>
  );
}
