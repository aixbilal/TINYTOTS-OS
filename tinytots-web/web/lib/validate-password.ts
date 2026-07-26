// Shared password policy — used everywhere a customer or admin sets/changes
// a password (signup, reset password, account settings, etc). Keep this in
// sync across every password form; don't duplicate the regex inline.
//
// Required: min 8 chars, at least one lowercase, one uppercase, one digit,
// one underscore (_), and one at symbol (@).

export function validatePassword(password: string): string | null {
  if (password.length < 8) return "Password must be at least 8 characters.";
  if (!/[a-z]/.test(password)) return "Password must include a lowercase letter.";
  if (!/[A-Z]/.test(password)) return "Password must include an uppercase letter.";
  if (!/[0-9]/.test(password)) return "Password must include a number.";
  if (!/_/.test(password)) return "Password must include an underscore (_).";
  if (!/@/.test(password)) return "Password must include an @ symbol.";
  return null; // valid
}

export const PASSWORD_HINT =
  "Min 8 characters, with uppercase, lowercase, a number, an underscore (_), and an @ symbol.";
