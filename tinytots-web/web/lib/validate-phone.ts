/**
 * Pakistani mobile numbers used at checkout / account / contact forms.
 * Accepts: 03XXXXXXXXX or +923XXXXXXXXX (spaces/hyphens ignored).
 */
export function isValidPakPhone(phone: string): boolean {
  const digits = phone.replace(/[\s-]/g, "");
  return /^(03\d{9}|\+923\d{9})$/.test(digits);
}

/** Slightly looser server-side form also used by checkout API historically. */
export function isValidPakPhoneServer(phone: string): boolean {
  const digits = phone.replace(/[\s-]/g, "");
  return /^(?:\+92|0)3\d{9}$/.test(digits);
}

export const PAK_PHONE_ERROR = "Enter a valid Pakistani mobile number, e.g. 03001234567.";

/**
 * Canonical `03XXXXXXXXX` form for a Pakistani mobile number — spaces, hyphens
 * and a `+92` / `0092` / `92` country prefix are all normalized away. Returns
 * null for anything that is not a valid PK mobile number, so callers can use it
 * both to validate and to get a single stable value to compare/store.
 */
export function normalizePakPhone(phone: string | null | undefined): string | null {
  if (phone == null) return null;
  const digits = String(phone).replace(/[\s-]/g, "");
  if (!/^(?:\+92|0092|92|0)3\d{9}$/.test(digits)) return null;
  const local = digits.replace(/^(?:\+92|0092|92|0)/, ""); // -> 3XXXXXXXXX
  return "0" + local; // -> 03XXXXXXXXX
}
