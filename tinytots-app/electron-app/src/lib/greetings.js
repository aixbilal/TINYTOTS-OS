// src/lib/greetings.js
//
// Time-aware greeting personality for the Dashboard hero (DESIGN.md §19–20).
//
// - The line is chosen DETERMINISTICALLY from the date, the current time band
//   and the username, so it stays put for the whole band/session and only
//   drifts across the day and across days — never flickers on re-render.
// - Curated, hand-written lines only. Nothing is fetched from an AI.
// - Tone: warm, focused, lightly playful, professional. No motivational cringe.
// - "Preferred greeting name" is a LOCAL, per-username preference on this PC.
//   It never touches the account record or any backend contract (§21).

const GREETING_NAME_KEY = (username) => `tinytots:greeting-name:${username || "guest"}`;

/**
 * Local, per-PC preferred greeting name. Returns "" when nothing is stored.
 */
export function getPreferredGreetingName(username) {
  try {
    return localStorage.getItem(GREETING_NAME_KEY(username))?.trim() || "";
  } catch {
    return "";
  }
}

/**
 * Persist (or clear, with an empty value) the local preferred greeting name.
 */
export function setPreferredGreetingName(username, value) {
  try {
    const v = (value || "").trim();
    if (v) localStorage.setItem(GREETING_NAME_KEY(username), v);
    else localStorage.removeItem(GREETING_NAME_KEY(username));
  } catch {
    /* storage unavailable — greetings just fall back to the derived name */
  }
}

/**
 * Safe first-name derivation from the full session name (§22). Prefers the
 * first meaningful token; only falls back to the username when there is no
 * usable name at all. Never assumes the second token.
 */
export function deriveFirstName(fullName, username) {
  const tokens = String(fullName || "")
    .trim()
    .split(/\s+/)
    .filter((t) => t && !/^(mr|mrs|ms|dr|muhammad|mohammad|md|syed)\.?$/i.test(t));
  if (tokens[0]) return tokens[0];
  const raw = String(fullName || "").trim().split(/\s+/)[0];
  return raw || username || "there";
}

/**
 * The name to greet with: explicit local preference → derived first name.
 */
export function resolveGreetingName(session) {
  const username = session?.username;
  const preferred = getPreferredGreetingName(username);
  if (preferred) return preferred;
  return deriveFirstName(session?.name, username);
}

// 00:00–04:59 · 05:00–08:29 · 08:30–11:59 · 12:00–16:59 · 17:00–20:59 · 21:00–23:59
const BANDS = [
  { key: "lateNight", start: 0, end: 5 * 60 },
  { key: "earlyMorning", start: 5 * 60, end: 8 * 60 + 30 },
  { key: "morning", start: 8 * 60 + 30, end: 12 * 60 },
  { key: "afternoon", start: 12 * 60, end: 17 * 60 },
  { key: "evening", start: 17 * 60, end: 21 * 60 },
  { key: "night", start: 21 * 60, end: 24 * 60 },
];

export function getTimeBand(date = new Date()) {
  const minutes = date.getHours() * 60 + date.getMinutes();
  return (BANDS.find((b) => minutes >= b.start && minutes < b.end) || BANDS[0]).key;
}

// ~48 curated lines. "{name}" is interpolated with the greeting name.
const LINES = {
  lateNight: [
    "Still going, {name}?",
    "Late shift, {name}.",
    "Quiet hours on the counter.",
    "Night owl mode, {name}.",
    "The store's asleep — you're not.",
    "Burning the midnight receipt roll.",
    "One more thing, then rest.",
    "Late night, steady hands.",
  ],
  earlyMorning: [
    "Early start, {name}.",
    "First one in, {name}.",
    "Morning's still waking up.",
    "Coffee, then the counter.",
    "Quiet before the doors open.",
    "Fresh day, {name}.",
    "Opening up, {name}.",
    "Beat the rush.",
  ],
  morning: [
    "Good morning, {name}.",
    "Morning momentum, {name}.",
    "Store looking good this morning.",
    "Let's make it a good one, {name}.",
    "Doors open, {name}.",
    "Morning trade ahead.",
    "Set the pace for the day.",
    "Shelves stocked, ready to sell.",
  ],
  afternoon: [
    "Good afternoon, {name}.",
    "Keep the counter moving, {name}.",
    "Midday rhythm, {name}.",
    "Steady through the afternoon.",
    "Half the day done, {name}.",
    "Afternoon trade in full swing.",
    "One sale at a time.",
    "Store's humming along.",
  ],
  evening: [
    "Good evening, {name}.",
    "Evening rush, {name}.",
    "Winding toward close, {name}.",
    "Busy evening on the floor.",
    "Last stretch of the day.",
    "Evening trade, {name}.",
    "Keep it smooth till close.",
    "Good evening — store's in good hands.",
  ],
  night: [
    "Evening wrap-up, {name}.",
    "Closing time soon, {name}.",
    "Cashing out for the night.",
    "Last customers of the day.",
    "Nearly there, {name}.",
    "Tidy up, count down, close.",
    "End of a solid day, {name}.",
    "Lights low, day nearly done.",
  ],
};

// Small deterministic string hash (djb2). Stable across runs and platforms.
function hashString(str) {
  let h = 5381;
  for (let i = 0; i < str.length; i += 1) h = (h * 33) ^ str.charCodeAt(i);
  return h >>> 0;
}

/**
 * A deterministic greeting for this user, this day, this time band.
 * Same inputs → same line, so it never jumps between re-renders (§24).
 */
export function getGreeting(session, date = new Date()) {
  const name = resolveGreetingName(session);
  const band = getTimeBand(date);
  const pool = LINES[band] || LINES.morning;
  const dayKey = `${date.getFullYear()}-${date.getMonth() + 1}-${date.getDate()}`;
  const seed = hashString(`${dayKey}|${band}|${session?.username || "guest"}`);
  const line = pool[seed % pool.length];
  return line.replace("{name}", name);
}
