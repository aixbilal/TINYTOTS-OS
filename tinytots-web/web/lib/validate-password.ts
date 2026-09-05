// Shared password policy — used everywhere a customer or admin sets/changes
// a password (signup, reset password, account settings, admin change, etc).
// Keep this in sync across every password form; don't duplicate rules inline.
//
// Required: minimum 8 characters, at least one uppercase letter, one
// lowercase letter, one number, and one special character.

// Standard ASCII punctuation set — deliberately excludes plain whitespace so
// "Password 1" can't satisfy the special-character rule with just a space.
const SPECIAL_CHAR_REGEX = /[!"#$%&'()*+,\-./:;<=>?@[\]^_`{|}~]/;

// Drives the shared <PasswordRequirements> checklist UI. Kept as a list (not
// separate booleans) so the visible requirements always match validatePassword
// exactly — if the policy ever changes, add/edit the rule here, nowhere else.
export type PasswordCheck = { key: string; label: string; test: (password: string) => boolean };

export const PASSWORD_CHECKS: PasswordCheck[] = [
  { key: "length", label: "At least 8 characters", test: (password) => password.length >= 8 },
  { key: "uppercase", label: "One uppercase letter", test: (password) => /[A-Z]/.test(password) },
  { key: "lowercase", label: "One lowercase letter", test: (password) => /[a-z]/.test(password) },
  { key: "number", label: "One number", test: (password) => /[0-9]/.test(password) },
  { key: "special", label: "One special character", test: (password) => SPECIAL_CHAR_REGEX.test(password) },
];

export function validatePassword(password: string): string | null {
  const failed = PASSWORD_CHECKS.find((check) => !check.test(password));
  if (!failed) return null; // valid

  switch (failed.key) {
    case "length":
      return "Password must be at least 8 characters.";
    case "uppercase":
      return "Password must include an uppercase letter.";
    case "lowercase":
      return "Password must include a lowercase letter.";
    case "number":
      return "Password must include a number.";
    case "special":
      return "Password must include a special character.";
    default:
      return "Password does not meet the requirements.";
  }
}

export const PASSWORD_HINT =
  "At least 8 characters, with an uppercase letter, a lowercase letter, a number, and a special character.";
