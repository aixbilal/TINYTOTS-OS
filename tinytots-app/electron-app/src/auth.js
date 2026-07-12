// src/auth.js
// Small helper around sessionStorage so the rest of the app has one
// place to check "who's logged in" and "what role are they."
// Session clears when the app is fully closed (sessionStorage), which
// matches a typical shift-based POS login.

const SESSION_KEY = "tinytots_session";

export function saveSession(user) {
  sessionStorage.setItem(SESSION_KEY, JSON.stringify(user));
}

export function getSession() {
  try {
    const raw = sessionStorage.getItem(SESSION_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function clearSession() {
  sessionStorage.removeItem(SESSION_KEY);
}

export function isLoggedIn() {
  return !!getSession();
}

export function isAdmin() {
  const session = getSession();
  return session?.role === "admin";
}