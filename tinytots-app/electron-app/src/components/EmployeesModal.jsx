// src/components/EmployeesModal.jsx
import { useEffect, useState } from "react";
import { X, Plus, Trash2, User } from "lucide-react";
import Button from "./ui/Button";
import { apiFetch } from "../services/api";

const FIELD =
  "w-full rounded-md border border-border-default bg-surface-panel px-3 py-2 type-input text-text-primary outline-none transition-[border-color,box-shadow] focus:border-brand focus:ring-2 focus:ring-brand/45 placeholder:text-text-muted";

export default function EmployeesModal({ onClose }) {
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);

  const [name, setName] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState("cashier");
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  function loadEmployees() {
    setLoading(true);
    fetch("http://localhost:3000/api/users")
      .then((r) => r.json())
      .then((data) => {
        if (data.success) setEmployees(data.users);
      })
      .catch((err) => console.error("Failed to load employees:", err))
      .finally(() => setLoading(false));
  }

  useEffect(() => {
    loadEmployees();
  }, []);

  async function handleAdd(e) {
    e.preventDefault();
    setError("");

    if (!name.trim() || !username.trim() || !password) {
      setError("Name, username, and password are all required.");
      return;
    }
    if (password.length < 4) {
      setError("Password should be at least 4 characters.");
      return;
    }

    setSaving(true);
    try {
      const res = await apiFetch("/api/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: name.trim(), username: username.trim(), password, role }),
      });
      const result = await res.json();

      if (!result.success) {
        setError(result.message || "Couldn't create employee.");
        return;
      }

      setName("");
      setUsername("");
      setPassword("");
      setRole("cashier");
      setShowAddForm(false);
      loadEmployees();
    } catch {
      setError("Couldn't reach the server. Check your connection and try again.");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id, employeeName, employeeUsername) {
    if (!window.confirm(`Remove ${employeeName}'s login? They won't be able to sign in anymore.`)) {
      return;
    }
    try {
      const res = await apiFetch(`/api/users/${id}`, { method: "DELETE" });
      const result = await res.json();
      if (result.success) {
        setEmployees((prev) => prev.filter((e) => e.id !== id));

        if (window.electron?.removeCachedUser) {
          await window.electron.removeCachedUser({ username: employeeUsername });
        }
      } else {
        alert(result.message || "Couldn't remove employee.");
      }
    } catch {
      alert("Couldn't reach the server. Check your connection and try again.");
    }
  }

  return (
    <div className="fixed inset-0 bg-surface-overlay tt-anim-fade flex items-center justify-center z-50 px-4">
      <div className="bg-surface-panel border border-border-strong rounded-xl shadow-lg w-full max-w-lg max-h-[80vh] overflow-hidden flex flex-col tt-anim-dialog">
        <div className="flex items-center justify-between px-5 py-4 border-b border-border-default">
          <h2 className="type-section text-text-primary">Manage Employees</h2>
          <button
            onClick={onClose}
            className="text-text-muted hover:text-text-primary rounded-md p-1 hover:bg-surface-elevated transition-colors"
            aria-label="Close"
          >
            <X size={18} />
          </button>
        </div>

        <div className="overflow-y-auto flex-1 px-5 py-4">
          {loading ? (
            <p className="text-center type-body-sm text-text-secondary py-8">Loading…</p>
          ) : employees.length === 0 ? (
            <p className="text-center type-body-sm text-text-muted py-8">
              No employees yet. Add your first one below.
            </p>
          ) : (
            <ul className="divide-y divide-border-default mb-4">
              {employees.map((emp) => (
                <li key={emp.id} className="flex items-center justify-between gap-3 py-3">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-9 h-9 rounded-full bg-brand text-pure-white flex items-center justify-center font-semibold type-body-sm shrink-0">
                      {emp.name?.[0]?.toUpperCase() || <User size={15} />}
                    </div>
                    <div className="min-w-0">
                      <p className="type-body-sm font-medium text-text-primary truncate">{emp.name}</p>
                      <p className="type-caption text-text-muted truncate">
                        @{emp.username} · <span className="capitalize">{emp.role}</span>
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => handleDelete(emp.id, emp.name, emp.username)}
                    className="text-text-muted hover:text-error-text shrink-0 p-1 transition-colors"
                    title="Remove employee"
                    aria-label={`Remove ${emp.name}`}
                  >
                    <Trash2 size={16} />
                  </button>
                </li>
              ))}
            </ul>
          )}

          {showAddForm ? (
            <form onSubmit={handleAdd} className="border-t border-border-default pt-4 flex flex-col gap-3">
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Full name"
                className={FIELD}
              />
              <input
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Username"
                className={FIELD}
              />
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Password"
                className={FIELD}
              />
              <select value={role} onChange={(e) => setRole(e.target.value)} className={FIELD}>
                <option value="cashier">Cashier</option>
                <option value="admin">Admin</option>
              </select>

              {error && <p className="type-body-sm text-error-text">{error}</p>}

              <div className="flex gap-2">
                <Button
                  type="button"
                  variant="secondary"
                  className="flex-1"
                  onClick={() => {
                    setShowAddForm(false);
                    setError("");
                  }}
                >
                  Cancel
                </Button>
                <Button type="submit" className="flex-1" disabled={saving} loading={saving}>
                  {saving ? "Adding…" : "Add Employee"}
                </Button>
              </div>
            </form>
          ) : (
            <button
              onClick={() => setShowAddForm(true)}
              className="w-full flex items-center justify-center gap-2 border border-dashed border-border-strong rounded-md py-2.5 type-body-sm text-text-secondary hover:bg-surface-sunken hover:text-text-primary transition-colors"
            >
              <Plus size={15} /> Add Employee
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
