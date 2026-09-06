import { useNavigate } from "react-router-dom";
import { LogOut } from "lucide-react";
import Button from "../components/ui/Button";
import { PageHeader } from "../components/ui/Layout";
import { EmptyState } from "../components/ui/States";
import { getSession, clearSession } from "../auth";

/**
 * Read-only account screen. Everything shown comes from the current session
 * (getSession()) only — no profile API, no mutation, no editing. Logout
 * reuses the same clearSession() + redirect the sidebar/header already use.
 */
export default function Profile() {
  const navigate = useNavigate();
  const session = getSession();

  function handleLogout() {
    clearSession();
    navigate("/login");
  }

  if (!session) {
    return (
      <div className="mx-auto max-w-[720px]">
        <div className="rounded-lg border border-border-default bg-surface-panel">
          <EmptyState
            title="Not signed in"
            description="Your session has ended. Please sign in again."
            action={{ label: "Go to login", onClick: () => navigate("/login") }}
          />
        </div>
      </div>
    );
  }

  const initial = session.name?.[0]?.toUpperCase() || "?";

  const fields = [
    ["Name", session.name],
    ["Username", session.username ? `@${session.username}` : null],
    ["Role", session.role],
  ].filter(([, value]) => value != null && value !== "");

  return (
    <div className="mx-auto max-w-[720px] flex flex-col gap-5">
      <PageHeader title="Profile" description="Your current session details." />

      <div className="rounded-lg border border-border-default bg-surface-panel p-6">
        <div className="flex items-center gap-4">
          <span className="w-14 h-14 rounded-full bg-brand text-pure-white type-heading-sm font-semibold flex items-center justify-center shrink-0">
            {initial}
          </span>
          <div className="min-w-0">
            <p className="type-heading-sm text-text-primary truncate">
              {session.name || "—"}
            </p>
            <p className="type-body-sm text-text-muted capitalize truncate">
              {session.role || "—"}
              {session.username ? ` · @${session.username}` : ""}
            </p>
          </div>
        </div>

        <dl className="mt-6 divide-y divide-border-default border-t border-border-default">
          {fields.map(([label, value]) => (
            <div
              key={label}
              className="flex items-center justify-between gap-4 py-3"
            >
              <dt className="type-field-label text-text-muted">{label}</dt>
              <dd className="type-body-sm text-text-primary text-right capitalize">
                {label === "Username" ? (
                  <span className="type-mono type-caption normal-case">
                    {value}
                  </span>
                ) : (
                  value
                )}
              </dd>
            </div>
          ))}
        </dl>
      </div>

      <div className="rounded-lg border border-border-default bg-surface-panel p-6 flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="type-section text-text-primary">Session</p>
          <p className="type-body-sm text-text-secondary mt-0.5">
            End your session on this device.
          </p>
        </div>
        <Button variant="secondary" onClick={handleLogout}>
          <LogOut size={14} /> Log Out
        </Button>
      </div>
    </div>
  );
}
