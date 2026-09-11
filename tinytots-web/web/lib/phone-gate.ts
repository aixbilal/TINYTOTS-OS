/**
 * Pure decision logic for the storefront customer-phone-onboarding gate
 * (see middleware.ts). Kept separate from the Supabase calls so the
 * admin/customer distinction can be unit tested without mocking
 * @supabase/ssr — see scripts/phone-gate-tests.ts.
 */
export interface PhoneGateDecisionInput {
  /** True if the customers-row lookup for this auth user errored. */
  customerReadError: boolean;
  /** customers.phone for this auth user, or null/undefined if no row. */
  customerPhone: string | null | undefined;
  /**
   * True only when the admin_users lookup for this auth user succeeded
   * AND returned is_active === true. An inactive admin, a missing admin
   * row, or a failed lookup must all resolve to false here — they get no
   * admin privilege in this decision.
   */
  isActiveAdmin: boolean;
}

/**
 * Returns true when the request should be redirected to
 * /account/add-phone.
 *
 * - A customers-row read error fails closed (gate), matching prior
 *   behavior: we can't confirm the phone is on file, so don't assume it is.
 * - A customer with a phone on file is never gated.
 * - A customer without a phone on file is gated UNLESS they are an active
 *   admin — admins have no customers row by design and must not be forced
 *   through customer onboarding.
 */
export function shouldForcePhoneOnboarding(input: PhoneGateDecisionInput): boolean {
  if (input.customerReadError) return true;

  const phone = input.customerPhone?.trim() ?? "";
  if (phone) return false;

  if (input.isActiveAdmin) return false;

  return true;
}
