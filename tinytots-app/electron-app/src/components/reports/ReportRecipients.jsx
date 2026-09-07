import { useCallback, useEffect, useState } from "react";
import { Mail, Plus, Trash2, Check } from "lucide-react";
import Button from "../ui/Button";
import Badge from "../ui/Badge";
import Input from "../ui/Input";
import { apiFetch } from "../../services/api";

/**
 * Manage who receives the daily sales report email.
 *
 * The report itself is still generated once per day (backend
 * reportService.generateDailyReport); this list only controls delivery
 * fan-out. With no active rows the backend falls back to OWNER_EMAIL, so
 * this card is purely additive — it never breaks the existing report.
 */
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

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

  async function addRecipient(e) {
    e.preventDefault();
    const email = newEmail.trim().toLowerCase();
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
        body: JSON.stringify({ name: newName.trim(), email }),
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

  const activeCount = (recipients || []).filter((r) => r.is_active).length;
  const usingFallback = recipients !== null && activeCount === 0;

  return (
    <div className="rounded-lg border border-border-default bg-surface-panel p-5">
      <div className="flex items-center gap-2 mb-1">
        <Mail size={16} className="text-text-secondary" />
        <h3 className="type-section text-text-primary">Daily Report Recipients</h3>
      </div>
      <p className="type-body-sm text-text-secondary mb-4">
        One report is generated each day and emailed to every active recipient
        below. Disable a recipient to stop their delivery without losing the
        record.
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
                    disabled={busy}
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
              <span className="type-field-label text-text-secondary block mb-1">
                Name (optional)
              </span>
              <Input
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                placeholder="e.g. Store Manager"
              />
            </label>
            <label className="flex-1 min-w-[200px]">
              <span className="type-field-label text-text-secondary block mb-1">
                Email
              </span>
              <Input
                type="email"
                value={newEmail}
                onChange={(e) => setNewEmail(e.target.value)}
                placeholder="name@example.com"
              />
            </label>
            <Button type="submit" disabled={busy || !newEmail.trim()} loading={busy}>
              <Plus size={14} /> Add
            </Button>
          </form>

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
