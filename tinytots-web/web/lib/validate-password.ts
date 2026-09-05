// Shared password policy — used everywhere a customer or admin sets/changes
// a password (signup, reset password, account settings, admin change, etc).
// Keep this in sync across every password form; don't duplicate rules inline.
//
// Required: minimum 8 characters. No forced special-character sets.

export function validatePassword(password: string): string | null {
  if (password.length < 8) return "Password must be at least 8 characters.";
  return null; // valid
}

export const PASSWORD_HINT = "At least 8 characters.";

// Drives the shared <PasswordRequirements> checklist UI. Kept as a list (not
// a single boolean) so the visible requirements always match validatePassword
// exactly — if the real policy ever grows, add the rule here and the check
// above, nowhere else.
export type PasswordCheck = { key: string; label: string; test: (password: string) => boolean };

export const PASSWORD_CHECKS: PasswordCheck[] = [
  { key: "length", label: "At least 8 characters", test: (password) => password.length >= 8 },
];
