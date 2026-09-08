"use client";

import { useCallback, useEffect, useState } from "react";
import { adminFetch } from "@/lib/admin-fetch";
import {
  AdminCard,
  AdminButton,
  AdminBadge,
  AdminAlert,
  AdminConfirmDialog,
  adminInputClass,
} from "@/components/admin/ui";

/**
 * Daily Report Recipients — website Admin management surface.
 *
 * Source of truth: public.daily_report_recipients (also managed from the
 * Electron POS Reports screen against the same table + same rules). All
 * mutations go through the authenticated /api/admin/report-recipients
 * routes; the browser never touches the table directly.
 *
 * Business rules mirrored from the API:
 *   - name + email required; email is the immutable identity of a destination
 *   - at most 5 ACTIVE recipients (server + DB enforced; UI just guides)
 *   - disabling keeps the row; 0 active => the report falls back to the
 *     owner's report email
 */

type Recipient = {
  id: number;
  name: string;
  email: string;
  is_active: boolean;
  created_at: string;
  updated_at: string | null;
};

const MAX_ACTIVE = 5;

type FetchResult =
  | { ok: true; recipients: Recipient[] }
  | { ok: false; error: string };

async function fetchRecipients(): Promise<FetchResult> {
  try {
    const res = await adminFetch("/api/admin/report-recipients");
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      return { ok: false, error: data.error || "Couldn't load recipients." };
    }
    return { ok: true, recipients: data.recipients || [] };
  } catch {
    return { ok: false, error: "Couldn't load recipients." };
  }
}

export default function ReportRecipientsCard() {
  const [recipients, setRecipients] = useState<Recipient[] | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<number | "new" | null>(null);

  const [newName, setNewName] = useState("");
  const [newEmail, setNewEmail] = useState("");

  const [editingId, setEditingId] = useState<number | null>(null);
  const [editName, setEditName] = useState("");

  const [confirmRemove, setConfirmRemove] = useState<Recipient | null>(null);

  const applyResult = useCallback(
    (r: FetchResult) => {
      if (r.ok) {
        setLoadError(null);
        setRecipients(r.recipients);
      } else {
        setLoadError(r.error);
        setRecipients([]);
      }
    },
    []
  );

  // Refresh from the server (used after every mutation).
  const reload = useCallback(async () => {
    applyResult(await fetchRecipients());
  }, [applyResult]);

  // Initial load — the setState happens only inside the async continuation.
  useEffect(() => {
    let cancelled = false;
    (async () => {
      const r = await fetchRecipients();
      if (!cancelled) applyResult(r);
    })();
    return () => {
      cancelled = true;
    };
  }, [applyResult]);

  const activeCount = (recipients || []).filter((r) => r.is_active).length;
  const atLimit = activeCount >= MAX_ACTIVE;

  async function addRecipient(e: React.FormEvent) {
    e.preventDefault();
    setActionError(null);
    setBusyId("new");
    try {
      const res = await adminFetch("/api/admin/report-recipients", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: newName.trim(), email: newEmail.trim() }),
      });
      const data = await res.json();
      if (!res.ok) {
        setActionError(data.error || "Couldn't add recipient.");
        return;
      }
      setNewName("");
      setNewEmail("");
      await reload();
    } finally {
      setBusyId(null);
    }
  }

  async function patchRecipient(id: number, patch: { name?: string; is_active?: boolean }) {
    setActionError(null);
    setBusyId(id);
    try {
      const res = await adminFetch(`/api/admin/report-recipients/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(patch),
      });
      const data = await res.json();
      if (!res.ok) {
        setActionError(data.error || "Couldn't update recipient.");
        return false;
      }
      await reload();
      return true;
    } finally {
      setBusyId(null);
    }
  }

  async function removeRecipient(id: number) {
    setActionError(null);
    setBusyId(id);
    try {
      const res = await adminFetch(`/api/admin/report-recipients/${id}`, { method: "DELETE" });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setActionError(data.error || "Couldn't remove recipient.");
        return;
      }
      await reload();
    } finally {
      setBusyId(null);
      setConfirmRemove(null);
    }
  }

  async function saveEdit(id: number) {
    const ok = await patchRecipient(id, { name: editName.trim() });
    if (ok) setEditingId(null);
  }

  return (
    <AdminCard
      title="Daily Report Recipients"
      actions={
        recipients !== null && (
          <span className="font-label-md text-label-md text-text-secondary">
            {activeCount} / {MAX_ACTIVE} active
          </span>
        )
      }
      padded={false}
    >
      <div className="p-4 sm:p-5">
        <p className="mb-4 font-body-sm text-body-sm text-text-secondary">
          One daily sales report is generated and emailed to every active
          recipient below. Disable a recipient to stop their emails without
          losing the record. Up to {MAX_ACTIVE} can be active at once.
        </p>

        {loadError && (
          <div className="mb-4">
            <AdminAlert tone="danger">{loadError}</AdminAlert>
          </div>
        )}
        {actionError && (
          <div className="mb-4">
            <AdminAlert tone="danger">{actionError}</AdminAlert>
          </div>
        )}

        {recipients === null ? (
          <p className="font-body-sm text-body-sm text-text-secondary">Loading…</p>
        ) : (
          <>
            {activeCount === 0 && (
              <div className="mb-4">
                <AdminAlert tone="info">
                  No active recipients. Daily reports currently fall back to the
                  owner&apos;s report email (configured on the server).
                </AdminAlert>
              </div>
            )}

            <ul className="mb-5 divide-y divide-border-default overflow-hidden rounded-md border border-border-default">
              {recipients.length === 0 && (
                <li className="px-4 py-3 font-body-sm text-body-sm text-text-secondary">
                  No recipients added yet.
                </li>
              )}
              {recipients.map((r) => {
                const rowBusy = busyId === r.id;
                return (
                  <li key={r.id} className="flex flex-wrap items-center gap-x-3 gap-y-2 px-4 py-3">
                    <div className="min-w-0 flex-1">
                      {editingId === r.id ? (
                        <div className="flex flex-wrap items-center gap-2">
                          <input
                            value={editName}
                            onChange={(e) => setEditName(e.target.value)}
                            aria-label={`Name for ${r.email}`}
                            maxLength={120}
                            className={`${adminInputClass} max-w-[220px]`}
                          />
                          <AdminButton
                            variant="primary"
                            onClick={() => saveEdit(r.id)}
                            disabled={rowBusy || !editName.trim()}
                          >
                            Save
                          </AdminButton>
                          <AdminButton variant="ghost" onClick={() => setEditingId(null)} disabled={rowBusy}>
                            Cancel
                          </AdminButton>
                        </div>
                      ) : (
                        <>
                          <p className="truncate font-body-sm text-body-sm font-medium text-text-primary">
                            {r.name}
                          </p>
                          <p className="truncate font-label-md text-label-md text-text-secondary">
                            {r.email}
                          </p>
                        </>
                      )}
                    </div>

                    {editingId !== r.id && (
                      <>
                        <AdminBadge tone={r.is_active ? "success" : "neutral"}>
                          {r.is_active ? "Active" : "Disabled"}
                        </AdminBadge>
                        <div className="flex items-center gap-1.5">
                          {r.is_active ? (
                            <AdminButton
                              variant="secondary"
                              onClick={() => patchRecipient(r.id, { is_active: false })}
                              disabled={rowBusy}
                            >
                              Disable
                            </AdminButton>
                          ) : (
                            <AdminButton
                              variant="secondary"
                              onClick={() => patchRecipient(r.id, { is_active: true })}
                              disabled={rowBusy || atLimit}
                              title={atLimit ? `${MAX_ACTIVE} active recipients already — disable one first.` : undefined}
                            >
                              Enable
                            </AdminButton>
                          )}
                          <AdminButton
                            variant="ghost"
                            onClick={() => {
                              setEditingId(r.id);
                              setEditName(r.name);
                              setActionError(null);
                            }}
                            disabled={rowBusy}
                          >
                            Edit
                          </AdminButton>
                          {!r.is_active && (
                            <AdminButton
                              variant="danger"
                              onClick={() => setConfirmRemove(r)}
                              disabled={rowBusy}
                            >
                              Remove
                            </AdminButton>
                          )}
                        </div>
                      </>
                    )}
                  </li>
                );
              })}
            </ul>

            <form onSubmit={addRecipient} className="flex flex-wrap items-end gap-2">
              <div className="min-w-[160px] flex-1">
                <label
                  htmlFor="rr-name"
                  className="mb-1 block font-label-md text-label-md text-text-secondary"
                >
                  Name
                </label>
                <input
                  id="rr-name"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  maxLength={120}
                  placeholder="e.g. Store Manager"
                  className={adminInputClass}
                />
              </div>
              <div className="min-w-[200px] flex-1">
                <label
                  htmlFor="rr-email"
                  className="mb-1 block font-label-md text-label-md text-text-secondary"
                >
                  Email
                </label>
                <input
                  id="rr-email"
                  type="email"
                  value={newEmail}
                  onChange={(e) => setNewEmail(e.target.value)}
                  maxLength={200}
                  placeholder="name@example.com"
                  className={adminInputClass}
                />
              </div>
              <AdminButton
                type="submit"
                variant="primary"
                disabled={busyId === "new" || !newName.trim() || !newEmail.trim() || atLimit}
                title={atLimit ? `${MAX_ACTIVE} active recipients already — disable one before adding another.` : undefined}
              >
                {busyId === "new" ? "Adding…" : "Add recipient"}
              </AdminButton>
            </form>
            {atLimit && (
              <p className="mt-2 font-label-md text-label-md text-text-secondary">
                {MAX_ACTIVE} of {MAX_ACTIVE} recipients are active. Disable one to
                add or enable another.
              </p>
            )}
          </>
        )}
      </div>

      {confirmRemove && (
        <AdminConfirmDialog
          title="Remove recipient?"
          message={
            <>
              Permanently remove <strong>{confirmRemove.name}</strong> (
              {confirmRemove.email})? Past report delivery records are kept.
            </>
          }
          confirmLabel="Remove"
          danger
          busy={busyId === confirmRemove.id}
          onConfirm={() => removeRecipient(confirmRemove.id)}
          onCancel={() => setConfirmRemove(null)}
        />
      )}
    </AdminCard>
  );
}
