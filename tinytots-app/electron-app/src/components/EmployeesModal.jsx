// src/components/EmployeesModal.jsx
import { useEffect, useState } from "react";
import { X, Plus, Trash2, User } from "lucide-react";

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
      const res = await fetch("http://localhost:3000/api/users", {
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
    } catch (err) {
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
      const res = await fetch(`http://localhost:3000/api/users/${id}`, { method: "DELETE" });
      const result = await res.json();
      if (result.success) {
        setEmployees((prev) => prev.filter((e) => e.id !== id));

        if (window.electron?.removeCachedUser) {
          await window.electron.removeCachedUser({ username: employeeUsername });
        }
      } else {
        alert(result.message || "Couldn't remove employee.");
      }
    } catch (err) {
      alert("Couldn't reach the server. Check your connection and try again.");
    }
  }

  return (
    <div className="fixed inset-0 bg-ink-900/40 flex items-center justify-center z-50 px-4">
      <div className="bg-cream-50 rounded-2xl w-full max-w-lg max-h-[80vh] overflow-hidden flex flex-col">
        <div className="flex items-center justify-between px-5 py-4 border-b border-gold-300/30">
          <h2 className="font-display text-xl text-ink-900">Manage Employees</h2>
          <button onClick={onClose} className="text-ink-700 hover:text-maroon-700">
            <X size={18} />
          </button>
        </div>

        <div className="overflow-y-auto flex-1 px-5 py-4">
          {loading ? (
            <p className="text-center text-sm text-ink-700 py-8">Loading…</p>
          ) : employees.length === 0 ? (
            <p className="text-center text-sm text-ink-700/60 py-8">No employees yet. Add your first one below.</p>
          ) : (
            <div className="space-y-2 mb-4">
              {employees.map((emp) => (
                <div
                  key={emp.id}
                  className="flex items-center justify-between bg-cream-100 rounded-lg px-4 py-3"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-full bg-maroon-700 text-cream-50 flex items-center justify-center font-semibold text-sm">
                      {emp.name?.[0]?.toUpperCase() || <User size={15} />}
                    </div>
                    <div>
                      <p className="text-sm font-medium text-ink-900">{emp.name}</p>
                      <p className="text-xs text-ink-700/60">
                        @{emp.username} · <span className="capitalize">{emp.role}</span>
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => handleDelete(emp.id, emp.name, emp.username)}
                    className="text-ink-700/50 hover:text-maroon-700"
                    title="Remove employee"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              ))}
            </div>
          )}

          {showAddForm ? (
            <form onSubmit={handleAdd} className="border-t border-gold-300/30 pt-4 flex flex-col gap-3">
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Full name"
                className="border border-gold-300/50 rounded-lg px-3 py-2 text-sm outline-none"
              />
              <input
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Username"
                className="border border-gold-300/50 rounded-lg px-3 py-2 text-sm outline-none"
              />
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Password"
                className="border border-gold-300/50 rounded-lg px-3 py-2 text-sm outline-none"
              />
              <select
                value={role}
                onChange={(e) => setRole(e.target.value)}
                className="border border-gold-300/50 rounded-lg px-3 py-2 text-sm outline-none"
              >
                <option value="cashier">Cashier</option>
                <option value="admin">Admin</option>
              </select>

              {error && <p className="text-sm text-maroon-700">{error}</p>}

              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setShowAddForm(false);
                    setError("");
                  }}
                  className="flex-1 border border-gold-300/50 rounded-lg py-2 text-sm text-ink-900 hover:bg-cream-100"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="flex-1 bg-maroon-700 text-cream-50 rounded-lg py-2 text-sm font-medium hover:bg-maroon-800 disabled:opacity-50"
                >
                  {saving ? "Adding…" : "Add Employee"}
                </button>
              </div>
            </form>
          ) : (
            <button
              onClick={() => setShowAddForm(true)}
              className="w-full flex items-center justify-center gap-2 border border-dashed border-gold-300/60 rounded-lg py-2.5 text-sm text-ink-900 hover:bg-cream-100"
            >
              <Plus size={15} /> Add Employee
            </button>
          )}
        </div>
      </div>
    </div>
  );
}