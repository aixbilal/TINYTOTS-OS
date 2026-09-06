// src/screens/Login.jsx
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Lock, User, Shirt, Loader2 } from "lucide-react";
import { saveSession } from "../auth";
import { apiFetch } from "../services/api";

export default function Login() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");

    if (!username.trim() || !password) {
      setError("Enter both username and password.");
      return;
    }

    setLoading(true);
    try {
      // ---- Try online login first ----
      const res = await apiFetch("/api/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username: username.trim(), password }),
      });

      if (!res.ok) {
        throw new Error(`Login request failed with status ${res.status}`);
      }

      const result = await res.json();

      if (result.success) {
        saveSession(result.user);

        // Cache the hash locally so this login also works offline later.
        if (window.electron?.cacheUser) {
          await window.electron.cacheUser({
            username: result.user.username,
            name: result.user.name,
            role: result.user.role,
            passwordHash: result.passwordHash,
          });
        }

        navigate(result.user.role === "admin" ? "/dashboard" : "/pos");
        return;
      }

      setError(result.message || "Invalid username or password.");
    } catch {
      // ---- No internet reached the server — fall back to offline login ----
      if (!window.electron?.offlineLogin) {
        setError("Can't reach the server, and offline login isn't available in this build.");
        return;
      }

      const offlineResult = await window.electron.offlineLogin({
        username: username.trim(),
        password,
      });
      console.log("Offline login result:", offlineResult);

      if (offlineResult.success) {
        saveSession(offlineResult.user);
        navigate(offlineResult.user.role === "admin" ? "/dashboard" : "/pos");
      } else {
        setError(offlineResult.message || offlineResult.error || "Invalid username or password.");
        console.error("Offline login failed:", offlineResult);
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-surface-app px-4">
      <div className="relative w-full max-w-sm rounded-xl border border-border-default bg-surface-panel p-8">
        <div className="flex flex-col items-center text-center mb-6">
          <span className="w-11 h-11 rounded-lg bg-brand-soft text-brand flex items-center justify-center mb-3">
            <Shirt size={22} strokeWidth={2} />
          </span>
          <h1 className="type-heading-sm text-text-primary">Welcome back</h1>
          <p className="type-body-sm text-text-secondary mt-1">
            Sign in to your TinyTots OS account
          </p>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-3">
          <label className="flex items-center gap-2.5 rounded-md border border-border-default bg-surface-panel px-3 py-2.5 transition-[border-color,box-shadow] focus-within:border-brand focus-within:ring-2 focus-within:ring-brand/45">
            <User size={16} className="text-text-muted shrink-0" />
            <input
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Username"
              autoFocus
              className="type-input w-full bg-transparent outline-none text-text-primary placeholder:text-text-muted"
            />
          </label>

          <label className="flex items-center gap-2.5 rounded-md border border-border-default bg-surface-panel px-3 py-2.5 transition-[border-color,box-shadow] focus-within:border-brand focus-within:ring-2 focus-within:ring-brand/45">
            <Lock size={16} className="text-text-muted shrink-0" />
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Password"
              className="type-input w-full bg-transparent outline-none text-text-primary placeholder:text-text-muted"
            />
          </label>

          {error && <p className="type-caption text-error-text">{error}</p>}

          <button
            type="submit"
            disabled={loading}
            className="type-btn mt-1 w-full inline-flex items-center justify-center gap-2 rounded-md bg-brand text-pure-white py-2.5 shadow-sm hover:bg-brand-hover active:bg-brand-active active:translate-y-px disabled:opacity-50 transition-[background-color,transform]"
          >
            {loading && <Loader2 size={15} className="animate-spin" />}
            {loading ? "Signing in…" : "Sign in"}
          </button>
        </form>

        <p className="type-caption text-text-muted text-center mt-5">
          TinyTots OS · Retail terminal
        </p>
      </div>
    </div>
  );
}
