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
