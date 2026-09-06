import { useCallback, useEffect, useState } from "react";
import { Plus, Trash2, Users as UsersIcon } from "lucide-react";
import Button from "../components/ui/Button";
import Badge from "../components/ui/Badge";
import Input from "../components/ui/Input";
import Dialog from "../components/ui/Dialog";
import { LoadingState, EmptyState, ErrorState } from "../components/ui/States";
import { Table, THead, TBody, TR, TH, TD } from "../components/ui/Table";
import { apiFetch } from "../services/api";

/**
 * Admin-only user management, built on the existing contracts:
 *   GET    /api/users
 *   POST   /api/users        { name, username, password, role }
 *   DELETE /api/users/:id
 *
 * The legacy EmployeesModal (opened from the header profile menu) still uses
 * the same endpoints and is intentionally left in place until the final
 * UI consolidation.
 */
const ROLE_OPTIONS = [
  { value: "cashier", label: "Cashier" },
  { value: "admin", label: "Admin" },
];

function roleVariant(role) {
  return role === "admin" ? "info" : "neutral";
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
      const res = await apiFetch(`/api/users/${user.id}`, { method: "DELETE" });
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

  return (
    <div className="mx-auto max-w-[1100px] flex flex-col gap-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="type-heading-lg text-text-primary">Users</h1>
          <p className="type-body-sm text-text-secondary mt-0.5">
            Manage employee logins and their roles.
          </p>
        </div>
        <Button onClick={() => setAddOpen(true)}>
          <Plus size={15} /> Add User
        </Button>
      </div>

      {loadError ? (
        <div className="rounded-xl border border-border-default bg-surface-panel">
          <ErrorState
            title="Couldn't load users"
            description="The local server didn't respond. Check the connection and try again."
            onRetry={retry}
          />
        </div>
      ) : users === null ? (
        <div className="rounded-xl border border-border-default bg-surface-panel">
          <LoadingState label="Loading users…" />
        </div>
      ) : users.length === 0 ? (
        <div className="rounded-xl border border-border-default bg-surface-panel">
          <EmptyState
            icon={UsersIcon}
            title="No users yet"
            description="Add your first employee login to get started."
            action={{ label: "Add User", onClick: () => setAddOpen(true) }}
          />
        </div>
      ) : (
        <>
          <p className="type-body-sm text-text-secondary">
            {users.length} user{users.length === 1 ? "" : "s"}
          </p>
          <Table>
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
                  <TD className="font-medium">{u.name}</TD>
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
        </>
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
          <div className="flex flex-col gap-1.5">
            <label
              htmlFor="role"
              className="type-field-label text-text-secondary"
            >
              Role
            </label>
            <select
              id="role"
              value={role}
              onChange={(e) => setRole(e.target.value)}
              className="type-input rounded-lg border border-border-strong bg-surface-elevated px-3 py-2 text-text-primary outline-none focus:border-brand"
            >
              {ROLE_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>

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
