import { useCallback, useEffect, useMemo, useState } from "react";
import { Plus, Trash2, Users as UsersIcon, ShieldCheck, UserRound } from "lucide-react";
import Button from "../components/ui/Button";
import Badge from "../components/ui/Badge";
import Input, { Select } from "../components/ui/Input";
import Dialog from "../components/ui/Dialog";
import { PageHeader, KpiRow, KpiTile } from "../components/ui/Layout";
import { LoadingState, EmptyState, ErrorState } from "../components/ui/States";
import { Table, THead, TBody, TR, TH, TD } from "../components/ui/Table";
import { apiFetch } from "../services/api";
import { getSession } from "../auth";

/**
 * Staff & Access — the single authority for employee logins and roles, built on
 * the existing contracts:
 *   GET    /api/users
 *   POST   /api/users        { name, username, password, role }
 *   DELETE /api/users/:id
 *
 * The top metrics are derived entirely from the loaded users array — no new API
 * (owner polish §14). Backend role values (admin / cashier) are unchanged; only
 * the visible badge is title-cased (§73).
 */
const ROLE_OPTIONS = [
  { value: "cashier", label: "Cashier" },
  { value: "admin", label: "Admin" },
];

function roleVariant(role) {
  return role === "admin" ? "info" : "neutral";
}

function initialOf(name) {
  return name?.trim()?.[0]?.toUpperCase() || "?";
}

export default function Users() {
  const [users, setUsers] = useState(null); // null = loading, [] = loaded/empty
  const [loadError, setLoadError] = useState(false);
  const [addOpen, setAddOpen] = useState(false);

  // add-user form state
  const [name, setName] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState("cashier");
  const [formError, setFormError] = useState("");
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState(null);

  const loadUsers = useCallback(() => {
    fetch("http://localhost:3000/api/users")
      .then((r) => r.json())
      .then((data) => {
        if (data.success) {
          setUsers(data.users);
          setLoadError(false);
        } else {
          setLoadError(true);
        }
      })
      .catch(() => setLoadError(true));
  }, []);

  useEffect(() => {
    loadUsers();
  }, [loadUsers]);

  const counts = useMemo(() => {
    const list = users || [];
    return {
      total: list.length,
      admins: list.filter((u) => u.role === "admin").length,
      cashiers: list.filter((u) => u.role === "cashier").length,
    };
  }, [users]);

  function retry() {
    setUsers(null);
    setLoadError(false);
    loadUsers();
  }

  function resetForm() {
    setName("");
    setUsername("");
    setPassword("");
    setRole("cashier");
    setFormError("");
  }

  async function handleAdd(e) {
    e.preventDefault();
    setFormError("");

    if (!name.trim() || !username.trim() || !password) {
      setFormError("Name, username, and password are all required.");
      return;
    }
    if (password.length < 4) {
      setFormError("Password should be at least 4 characters.");
      return;
    }

    setSaving(true);
    try {
      const res = await apiFetch("/api/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          username: username.trim(),
          password,
          role,
        }),
      });
      const result = await res.json();
      if (!result.success) {
        setFormError(result.message || "Couldn't create user.");
        return;
      }
      resetForm();
      setAddOpen(false);
      loadUsers();
    } catch {
      setFormError(
        "Couldn't reach the server. Check your connection and try again."
      );
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(user) {
    if (
      !window.confirm(
        `Remove ${user.name}'s login (@${user.username})? They won't be able to sign in anymore.`
      )
    ) {
      return;
    }
    setDeletingId(user.id);
    try {
      // acting_user_id lets the backend block self-deletion. It's a best-effort
      // hint (the session model has no server-side identity); the backend still
      // enforces the last-admin guard on its own.
      const actingId = getSession()?.id;
      const path = actingId
        ? `/api/users/${user.id}?acting_user_id=${encodeURIComponent(actingId)}`
        : `/api/users/${user.id}`;
      const res = await apiFetch(path, { method: "DELETE" });
      const result = await res.json();
      if (result.success) {
        setUsers((prev) => (prev || []).filter((u) => u.id !== user.id));
        if (window.electron?.removeCachedUser) {
          await window.electron.removeCachedUser({ username: user.username });
        }
      } else {
        alert(result.message || "Couldn't remove user.");
      }
    } catch {
      alert("Couldn't reach the server. Check your connection and try again.");
    } finally {
      setDeletingId(null);
    }
  }

  const hasUsers = Array.isArray(users) && users.length > 0;

  return (
    <div className="mx-auto max-w-[1100px] flex flex-col gap-6">
      <PageHeader
        title="Staff & Access"
        description="Manage employee logins and their roles for this store."
      >
        <Button onClick={() => setAddOpen(true)}>
          <Plus size={15} /> Add User
        </Button>
      </PageHeader>

      {/* Open metrics — derived from the loaded list, borderless semantic tiles */}
      {hasUsers && (
        <KpiRow className="grid-cols-3 max-w-lg">
          <KpiTile label="Total Staff" value={String(counts.total)} icon={UsersIcon} tone="goal" />
          <KpiTile label="Admins" value={String(counts.admins)} icon={ShieldCheck} tone="info" />
          <KpiTile label="Cashiers" value={String(counts.cashiers)} icon={UserRound} tone="orders" />
        </KpiRow>
      )}

      {loadError ? (
        <ErrorState
          title="Couldn't load staff"
          description="The local server didn't respond. Check the connection and try again."
          onRetry={retry}
        />
      ) : users === null ? (
        <LoadingState label="Loading staff…" />
      ) : users.length === 0 ? (
        <EmptyState
          icon={UsersIcon}
          title="No staff yet"
          description="Add your first employee login to get started."
          action={{ label: "Add User", onClick: () => setAddOpen(true) }}
        />
      ) : (
        <Table bare>
          <THead>
            <TR>
              <TH>Name</TH>
              <TH>Username</TH>
              <TH>Role</TH>
              <TH>Created</TH>
              <TH align="right">Actions</TH>
            </TR>
          </THead>
          <TBody>
            {users.map((u) => (
              <TR key={u.id}>
                <TD className="font-medium">
                  <span className="inline-flex items-center gap-2.5">
                    <span className="w-7 h-7 rounded-full bg-brand text-pure-white type-label font-semibold flex items-center justify-center shrink-0">
                      {initialOf(u.name)}
                    </span>
                    {u.name}
                  </span>
                </TD>
                <TD className="type-mono type-caption text-text-secondary">
                  @{u.username}
                </TD>
                <TD>
                  <Badge variant={roleVariant(u.role)}>
                    <span className="capitalize">{u.role}</span>
                  </Badge>
                </TD>
                <TD className="text-text-secondary">
                  {u.created_at
                    ? new Date(u.created_at).toLocaleDateString()
                    : "—"}
                </TD>
                <TD align="right">
                  <button
                    onClick={() => handleDelete(u)}
                    disabled={deletingId === u.id}
                    className="text-text-muted hover:text-error-text p-1 disabled:opacity-40"
                    title="Remove user"
                    aria-label={`Remove ${u.name}`}
                  >
                    <Trash2 size={15} />
                  </button>
                </TD>
              </TR>
            ))}
          </TBody>
        </Table>
      )}

      <Dialog
        open={addOpen}
        onClose={() => {
          setAddOpen(false);
          resetForm();
        }}
        title="Add User"
        description="Create a new employee login."
      >
        <form onSubmit={handleAdd} className="flex flex-col gap-3">
          <Input
            name="name"
            label="Full name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            autoComplete="off"
          />
          <Input
            name="username"
            label="Username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            autoComplete="off"
          />
          <Input
            name="password"
            label="Password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            helperText="At least 4 characters."
            autoComplete="new-password"
          />
          <Select
            id="role"
            label="Role"
            value={role}
            onChange={(e) => setRole(e.target.value)}
          >
            {ROLE_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </Select>

          {formError && (
            <p className="type-body-sm text-error-text">{formError}</p>
          )}

          <div className="mt-2 flex justify-end gap-3">
            <Button
              type="button"
              variant="secondary"
              onClick={() => {
                setAddOpen(false);
                resetForm();
              }}
            >
              Cancel
            </Button>
            <Button type="submit" loading={saving}>
              {saving ? "Adding…" : "Add User"}
            </Button>
          </div>
        </form>
      </Dialog>
    </div>
  );
}
