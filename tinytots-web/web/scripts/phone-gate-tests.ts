/**
 * Regression coverage for the admin/customer distinction in the storefront
 * phone-onboarding gate (lib/phone-gate.ts, wired up in middleware.ts).
 *
 * Bug this guards against: an authenticated ACTIVE ADMIN has no customers
 * row (admins live in admin_users, not customers), so the naive "gate
 * anyone without customers.phone" rule redirected every admin into
 * /account/add-phone forever, and updating there failed (0 rows matched).
 *
 * No test framework — run with:
 *
 *   node scripts/phone-gate-tests.ts
 */

import { shouldForcePhoneOnboarding } from "../lib/phone-gate.ts";

let pass = 0;
let fail = 0;

function check(name: string, cond: boolean, detail?: unknown) {
  if (cond) {
    pass++;
    console.log(`  ok   ${name}`);
  } else {
    fail++;
    console.log(`  FAIL ${name}${detail !== undefined ? "  →  " + JSON.stringify(detail) : ""}`);
  }
}

// --- active admin: must never be forced through customer onboarding -------
check(
  "active admin, no customers row → NOT gated",
  shouldForcePhoneOnboarding({ customerReadError: false, customerPhone: null, isActiveAdmin: true }) === false
);
check(
  "active admin, customers row exists but phone empty string → NOT gated",
  shouldForcePhoneOnboarding({ customerReadError: false, customerPhone: "", isActiveAdmin: true }) === false
);

// --- inactive / non-admin: gets no admin privilege in this decision -------
check(
  "inactive admin, no customers row → gated (falls through as ordinary user)",
  shouldForcePhoneOnboarding({ customerReadError: false, customerPhone: null, isActiveAdmin: false }) === true
);

// --- ordinary customers: unaffected by the admin carve-out -----------------
check(
  "customer without phone → gated",
  shouldForcePhoneOnboarding({ customerReadError: false, customerPhone: null, isActiveAdmin: false }) === true
);
check(
  "customer with whitespace-only phone → gated",
  shouldForcePhoneOnboarding({ customerReadError: false, customerPhone: "   ", isActiveAdmin: false }) === true
);
check(
  "customer with phone on file → NOT gated",
  shouldForcePhoneOnboarding({ customerReadError: false, customerPhone: "03001234567", isActiveAdmin: false }) === false
);

// --- fail-closed on a customers-row read error, even for an admin ---------
// (middleware only resolves isActiveAdmin when the customer check itself
// would otherwise gate, so a real customerReadError always carries
// isActiveAdmin: false — this locks in that a transient read failure never
// admits anyone, admin or not, via this function alone.)
check(
  "customers-row read error → gated regardless of admin status",
  shouldForcePhoneOnboarding({ customerReadError: true, customerPhone: null, isActiveAdmin: false }) === true
);
check(
  "customers-row read error with phone present → still gated (fail closed)",
  shouldForcePhoneOnboarding({ customerReadError: true, customerPhone: "03001234567", isActiveAdmin: false }) === true
);

console.log(`\n${pass} passed, ${fail} failed`);
process.exit(fail === 0 ? 0 : 1);
