// src/screens/Login.jsx
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Lock, User } from "lucide-react";
import { saveSession } from "../auth";
import loginBg from "../assets/login-bg.png";

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
      const res = await fetch("http://localhost:3000/api/login", {
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
    } catch (err) {
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
    <div
      className="min-h-screen flex items-center justify-center px-4"
      style={{
        backgroundImage: `url(${loginBg})`,
        backgroundSize: "cover",
        backgroundPosition: "center",
        backgroundRepeat: "no-repeat",
      }}
    >
      <div
        className="w-full max-w-md rounded-3xl p-10 border border-white/40 shadow-2xl backdrop-blur-xl transition-transform duration-300 ease-out hover:scale-110 cursor-default"
        style={{
          background:
            "linear-gradient(160deg, rgba(255,255,255,0.35) 0%, rgba(255,255,255,0.12) 100%)",
          boxShadow:
            "0 8px 32px rgba(70,10,20,0.25), inset 0 1px 1px rgba(255,255,255,0.5)",
        }}
      >
        <h1 className="font-display text-5xl font-extrabold text-maroon-800 text-center mb-2 tracking-tight">
          Tiny Tots
        </h1>
        <p className="text-base text-ink-700/80 text-center mb-8">Sign in to continue</p>

        <form onSubmit={handleSubmit} className="flex flex-col gap-5">
          <div className="flex items-center gap-3 border border-white/50 rounded-xl px-4 py-3.5 bg-white/20 backdrop-blur-sm">
            <User size={18} className="text-ink-800/70" />
            <input
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Username"
              autoFocus
              className="w-full bg-transparent text-base outline-none placeholder:text-ink-800/50 text-ink-900"
            />
          </div>

          <div className="flex items-center gap-3 border border-white/50 rounded-xl px-4 py-3.5 bg-white/20 backdrop-blur-sm">
            <Lock size={18} className="text-ink-800/70" />
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Password"
              className="w-full bg-transparent text-base outline-none placeholder:text-ink-800/50 text-ink-900"
            />
          </div>

          {error && <p className="text-sm text-maroon-700">{error}</p>}

          <button
            type="submit"
            disabled={loading}
            className="w-full text-cream-50 font-semibold text-lg py-3.5 rounded-xl disabled:opacity-50 transition-opacity"
            style={{
              background: "linear-gradient(180deg, #8a1f2d 0%, #6b1420 100%)",
              boxShadow: "0 4px 14px rgba(90,15,25,0.4)",
            }}
          >
            {loading ? "Signing in…" : "Sign In"}
          </button>
        </form>
      </div>
    </div>
  );
}