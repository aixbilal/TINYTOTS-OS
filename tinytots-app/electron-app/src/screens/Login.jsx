// src/screens/Login.jsx
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Lock, User, Shirt, Loader2 } from "lucide-react";
import { saveSession } from "../auth";
import { apiFetch } from "../services/api";
// Approved TinyTots website lifestyle image, packaged into the Electron bundle
// so login never depends on remote asset availability (owner polish §58).
// Source: tinytots-web/web/public/images/homepage/brand-story-support.webp
import brandImage from "../assets/login-brand.webp";

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
    <div className="min-h-screen w-full flex bg-surface-app">
      {/* Brand / lifestyle region — real TinyTots editorial imagery */}
      <div className="relative hidden md:block md:w-[42%] lg:w-[44%] shrink-0 overflow-hidden">
        <img
          src={brandImage}
          alt="TinyTots baby clothing on a wooden rail in warm daylight"
          className="absolute inset-0 h-full w-full object-cover object-center"
        />
        <div className="absolute inset-x-0 bottom-0 bg-[rgba(42,38,33,0.42)] px-8 py-6">
          <p className="font-display text-pure-white text-[22px] leading-tight">
            TinyTots<span className="opacity-80"> OS</span>
          </p>
          <p className="type-caption text-pure-white/80 mt-0.5">
            The counter, the stockroom, the day — in one place.
          </p>
        </div>
      </div>

      {/* Sign-in region — open, no enclosing auth card */}
      <div className="flex-1 flex items-center justify-center px-6 py-10">
        <div className="w-full max-w-[340px]">
          <div className="flex items-center gap-2.5 mb-7">
            <span className="w-10 h-10 rounded-lg bg-brand-soft text-brand flex items-center justify-center shrink-0">
              <Shirt size={20} strokeWidth={2} />
            </span>
            <span className="leading-tight">
              <span className="block font-display text-[19px] text-text-primary">
                TinyTots OS
              </span>
              <span className="block type-caption text-text-muted">Store Console</span>
            </span>
          </div>

          <h1 className="type-heading-sm text-text-primary">Sign in</h1>
          <p className="type-body-sm text-text-secondary mt-1 mb-6">
            Sign in to start your shift on this terminal.
          </p>

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

          <p className="type-caption text-text-muted mt-6">
            TinyTots OS · Retail terminal
          </p>
        </div>
      </div>
    </div>
  );
}
