// Single source of truth for "is Turnstile configured" across the auth pages
// and their API routes. Public site key only — the secret lives in the
// Supabase Dashboard's own CAPTCHA provider config, never in this app.
// Absent/empty means Turnstile is off: pages must render their existing
// forms exactly as before, with no CAPTCHA UI and no token requirement.
export const TURNSTILE_SITE_KEY = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY?.trim() || null;
