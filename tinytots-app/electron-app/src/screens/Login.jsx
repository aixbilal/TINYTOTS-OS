// src/screens/Login.jsx
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Lock, User, Loader2 } from "lucide-react";
import { saveSession } from "../auth";
import { apiFetch } from "../services/api";
import FlipText from "../components/motion/FlipText";
// Approved TinyTots website lifestyle image, packaged into the Electron bundle
// so login never depends on remote asset availability (owner §14 / §27).
// Source: tinytots-web/web/public/images/homepage/editorial-story-02.webp
import brandImage from "../assets/lifestyle/kids-reading.webp";

const SIGN_IN_LINES = [
  "Store operations, beautifully simple",
  "POS, inventory and receipts in one calm place",
  "Run the counter with confidence",
  "Warm retail operations",
];

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
    <div className="min-h-screen w-full flex bg-surface-app tt-signin-enter">
      {/* Brand / lifestyle region — real TinyTots editorial imagery, ~44/56 */}
      <div className="relative hidden md:block md:w-[44%] lg:w-[45%] shrink-0 overflow-hidden">
        <img
          src={brandImage}
          alt="Two children reading together in warm daylight"
          className="absolute inset-0 h-full w-full object-cover object-center"
        />
        {/* faint warm inner edge so the photo meets the form quietly */}
        <div className="absolute inset-y-0 right-0 w-16 bg-gradient-to-l from-surface-app/70 to-transparent" />
      </div>

      {/* Sign-in region — open, no enclosing auth card */}
      <div className="flex-1 flex items-center justify-center px-6 py-10">
        <div className="w-full max-w-[360px]">
          <h1 className="font-display text-[34px] sm:text-[40px] leading-[1.05] text-text-primary tracking-[-0.01em]">
            TinyTots OS
          </h1>
          <FlipText
            phrases={SIGN_IN_LINES}
            className="mt-2 mb-8 type-body text-text-secondary font-medium"
          />

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
        </div>
      </div>
    </div>
  );
}
