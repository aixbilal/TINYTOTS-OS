import { useCallback, useEffect, useState } from "react";
import { Mail, Plus, Trash2, Check } from "lucide-react";
import Button from "../ui/Button";
import Badge from "../ui/Badge";
import Input from "../ui/Input";
import { apiFetch } from "../../services/api";

/**
 * Manage who receives the daily sales report email.
 *
 * Source of truth: public.daily_report_recipients. The WEBSITE Admin
 * (Settings) is the primary place to manage this; this POS card operates on
 * the SAME table and the SAME rules (name + email required, max 5 active,
 * empty => OWNER_EMAIL fallback), so the two never diverge. The report is
 * still generated once per day; this list only controls delivery fan-out.
 */
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const MAX_ACTIVE = 5;

export default function ReportRecipients() {
  const [recipients, setRecipients] = useState(null); // null = loading
  const [fallbackEmail, setFallbackEmail] = useState(null);
  const [loadError, setLoadError] = useState(false);
  const [newName, setNewName] = useState("");
  const [newEmail, setNewEmail] = useState("");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");

  const load = useCallback(() => {
    apiFetch("/api/report-recipients")
      .then((r) => r.json())
      .then((data) => {
        if (data?.success) {
          setRecipients(data.recipients || []);
          setFallbackEmail(data.fallbackEmail || null);
          setLoadError(false);
        } else {
          setLoadError(true);
        }
      })
      .catch(() => setLoadError(true));
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const activeCount = (recipients || []).filter((r) => r.is_active).length;
  const atLimit = activeCount >= MAX_ACTIVE;
  const usingFallback = recipients !== null && activeCount === 0;

  async function addRecipient(e) {
    e.preventDefault();
    const name = newName.trim();
    const email = newEmail.trim().toLowerCase();
    if (!name) {
      setMessage("Enter a name.");
      return;
    }
    if (!EMAIL_RE.test(email)) {
      setMessage("Enter a valid email address.");
      return;
    }
    setBusy(true);
    setMessage("");
    try {
      const res = await apiFetch("/api/report-recipients", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email }),
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.message || data.error || "Failed to add.");
      setNewName("");
      setNewEmail("");
      load();
    } catch (err) {
      setMessage(err.message);
    } finally {
      setBusy(false);
    }
  }

  async function toggleActive(recipient) {
    setBusy(true);
    setMessage("");
    try {
      const res = await apiFetch(`/api/report-recipients/${recipient.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ is_active: !recipient.is_active }),
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.message || data.error || "Failed to update.");
      load();
    } catch (err) {
      setMessage(err.message);
    } finally {
      setBusy(false);
    }
  }

  async function removeRecipient(recipient) {
    setBusy(true);
    setMessage("");
    try {
      const res = await apiFetch(`/api/report-recipients/${recipient.id}`, {
        method: "DELETE",
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.message || data.error || "Failed to remove.");
      load();
    } catch (err) {
      setMessage(err.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="rounded-lg border border-border-default bg-surface-panel p-5">
      <div className="flex items-center justify-between gap-2 mb-1">
        <div className="flex items-center gap-2">
          <Mail size={16} className="text-text-secondary" />
          <h3 className="type-section text-text-primary">Daily Report Recipients</h3>
        </div>
        {recipients !== null && (
          <span className="type-caption text-text-muted">
            {activeCount} / {MAX_ACTIVE} active
          </span>
        )}
      </div>
      <p className="type-body-sm text-text-secondary mb-4">
        One report is generated each day and emailed to every active recipient.
        Up to {MAX_ACTIVE} can be active. Also manageable from the website Admin
        &rsaquo; Settings.
      </p>

      {loadError ? (
        <p className="type-body-sm text-warning-text">
          Couldn&apos;t load recipients. This screen only works inside the desktop app.
        </p>
      ) : recipients === null ? (
        <p className="type-body-sm text-text-muted">Loading…</p>
      ) : (
        <>
          {usingFallback && (
            <p className="type-caption text-text-muted mb-3">
              No active recipients — the report currently goes to the default
              owner address{fallbackEmail ? ` (${fallbackEmail})` : ""}.
            </p>
          )}

          <ul className="divide-y divide-border-default rounded-md border border-border-default overflow-hidden mb-4">
            {recipients.length === 0 && (
              <li className="px-4 py-3 type-body-sm text-text-muted">
                No recipients added yet.
              </li>
            )}
            {recipients.map((r) => (
              <li
                key={r.id}
                className="flex items-center justify-between gap-3 px-4 py-3"
              >
                <span className="min-w-0">
                  <span className="type-body-sm font-medium text-text-primary block truncate">
                    {r.name || r.email}
                  </span>
                  {r.name && (
                    <span className="type-caption text-text-muted block truncate">
                      {r.email}
                    </span>
                  )}
                </span>
                <span className="flex items-center gap-2 shrink-0">
                  <Badge variant={r.is_active ? "success" : "neutral"}>
                    {r.is_active ? "Active" : "Disabled"}
                  </Badge>
                  <Button
                    variant="secondary"
                    size="sm"
                    disabled={busy || (!r.is_active && atLimit)}
                    title={
                      !r.is_active && atLimit
                        ? `${MAX_ACTIVE} recipients already active — disable one first.`
                        : undefined
                    }
                    onClick={() => toggleActive(r)}
                  >
                    {r.is_active ? "Disable" : "Enable"}
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    disabled={busy}
                    onClick={() => removeRecipient(r)}
                    aria-label={`Remove ${r.email}`}
                  >
                    <Trash2 size={14} />
                  </Button>
                </span>
              </li>
            ))}
          </ul>

          <form onSubmit={addRecipient} className="flex flex-wrap items-end gap-2">
            <label className="flex-1 min-w-[140px]">
              <span className="type-field-label text-text-secondary block mb-1">Name</span>
              <Input
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                maxLength={120}
                placeholder="e.g. Store Manager"
              />
            </label>
            <label className="flex-1 min-w-[200px]">
              <span className="type-field-label text-text-secondary block mb-1">Email</span>
              <Input
                type="email"
                value={newEmail}
                onChange={(e) => setNewEmail(e.target.value)}
                maxLength={200}
                placeholder="name@example.com"
              />
            </label>
            <Button
              type="submit"
              disabled={busy || !newName.trim() || !newEmail.trim() || atLimit}
              loading={busy}
              title={
                atLimit
                  ? `${MAX_ACTIVE} recipients already active — disable one before adding another.`
                  : undefined
              }
            >
              <Plus size={14} /> Add
            </Button>
          </form>
          {atLimit && (
            <p className="type-caption text-text-muted mt-2">
              {MAX_ACTIVE} of {MAX_ACTIVE} recipients are active. Disable one to add or
              enable another.
            </p>
          )}

          {message && (
            <p className="type-caption text-text-secondary mt-3 inline-flex items-center gap-1.5">
              <Check size={13} /> {message}
            </p>
          )}
        </>
      )}
    </div>
  );
}
