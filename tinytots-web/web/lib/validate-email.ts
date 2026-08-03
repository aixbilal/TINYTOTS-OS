/** Basic email format check shared across storefront + admin forms. */
export function isValidEmail(email: string): boolean {
  const trimmed = email.trim();
  if (!trimmed || trimmed.length > 100) return false;
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed);
}

export const EMAIL_ERROR = "Please enter a valid email address.";
