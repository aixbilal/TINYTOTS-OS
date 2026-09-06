import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { LogOut, Check } from "lucide-react";
import Button from "../components/ui/Button";
import Badge from "../components/ui/Badge";
import { PageHeader, Section } from "../components/ui/Layout";
import { EmptyState } from "../components/ui/States";
import { getSession, clearSession } from "../auth";
import {
  getPreferredGreetingName,
  setPreferredGreetingName,
  deriveFirstName,
} from "../lib/greetings";

/**
 * Account surface. The account fields (name / username / role) are read-only and
 * come only from the current session — no profile API, no account mutation
 * (owner polish §46). The one editable thing is a LOCAL, per-username preference:
 * the friendly greeting name used on the Dashboard hero on this device.
 */
function salutation(date = new Date()) {
  const h = date.getHours();
  if (h < 5) return "Good evening";
  if (h < 12) return "Good morning";
  if (h < 17) return "Good afternoon";
  return "Good evening";
}

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
        <EmptyState
          title="Not signed in"
          description="Your session has ended. Please sign in again."
          action={{ label: "Go to login", onClick: () => navigate("/login") }}
        />
      </div>
    );
  }

  const initial = session.name?.[0]?.toUpperCase() || "?";
  const derived = deriveFirstName(session.name, session.username);

  return (
    <div className="mx-auto max-w-[720px] flex flex-col gap-8">
      <PageHeader
        title="Profile"
        description="Your account and greeting preference on this device."
      />

      {/* Identity — soft tinted ground, no hard outline (§47) */}
      <div className="flex items-center gap-4 rounded-xl bg-brand/[0.05] p-5">
        <span className="w-16 h-16 rounded-full bg-brand text-pure-white type-heading-sm font-semibold flex items-center justify-center shrink-0">
          {initial}
        </span>
        <div className="min-w-0">
          <p className="type-heading-sm text-text-primary truncate">
            {session.name || "—"}
          </p>
          <div className="flex items-center gap-2 mt-1">
            {session.username && (
              <span className="type-mono type-caption text-text-secondary">
                @{session.username}
              </span>
            )}
            {session.role && (
              <Badge variant={session.role === "admin" ? "info" : "neutral"}>
                <span className="capitalize">{session.role}</span>
              </Badge>
            )}
          </div>
        </div>
      </div>

      {/* Account details — open rows, hairline dividers */}
      <Section title="Account details" divide>
        <dl className="divide-y divide-border-default">
          <DetailRow label="Full name" value={session.name || "—"} />
          <DetailRow
            label="Username"
            value={
              session.username ? (
                <span className="type-mono type-caption">@{session.username}</span>
              ) : (
                "—"
              )
            }
          />
          <DetailRow
            label="Role"
            value={<span className="capitalize">{session.role || "—"}</span>}
          />
        </dl>
        <p className="type-caption text-text-muted mt-3">
          These come from your account and can&apos;t be changed here.
        </p>
      </Section>

      <GreetingPreference username={session.username} derived={derived} />

      {/* Session — quiet, not dominant */}
      <Section title="Session" divide>
        <div className="flex items-center justify-between gap-3">
          <p className="type-body-sm text-text-secondary">
            End your session on this device.
          </p>
          <Button variant="secondary" onClick={handleLogout}>
            <LogOut size={14} /> Log Out
          </Button>
        </div>
      </Section>
    </div>
  );
}

function DetailRow({ label, value }) {
  return (
    <div className="flex items-center justify-between gap-4 py-3">
      <dt className="type-field-label text-text-muted">{label}</dt>
      <dd className="type-body-sm text-text-primary text-right">{value}</dd>
    </div>
  );
}

function GreetingPreference({ username, derived }) {
  const [value, setValue] = useState(() => getPreferredGreetingName(username));
  const [savedFlash, setSavedFlash] = useState(false);

  const effectiveName = useMemo(
    () => value.trim() || derived,
    [value, derived]
  );

  function save() {
    setPreferredGreetingName(username, value);
    setSavedFlash(true);
    setTimeout(() => setSavedFlash(false), 2200);
  }

  return (
    <Section
      title="Friendly greeting"
      description="Used only for greetings on this device."
      divide
    >
      <div className="flex flex-col gap-3 max-w-sm">
        <label className="flex flex-col gap-1.5">
          <span className="type-field-label text-text-secondary">
            Preferred greeting name
          </span>
          <input
            value={value}
            onChange={(e) => setValue(e.target.value)}
            onBlur={save}
            placeholder={derived}
            className="type-input rounded-md border border-border-default bg-surface-panel px-3 py-2 text-text-primary outline-none transition-[border-color,box-shadow] focus:border-brand focus:ring-2 focus:ring-brand/45 placeholder:text-text-muted"
          />
        </label>

        <p className="type-body-sm text-text-secondary">
          Preview:{" "}
          <span className="text-text-primary font-medium">
            {salutation()}, {effectiveName}.
          </span>
        </p>

        <div className="flex items-center gap-3">
          <Button size="sm" onClick={save}>
            Save preference
          </Button>
          {savedFlash && (
            <span className="type-caption text-success-text inline-flex items-center gap-1.5">
              <Check size={13} /> Saved on this device
            </span>
          )}
        </div>
      </div>
    </Section>
  );
}
