"use client";

import { PASSWORD_CHECKS } from "@/lib/validate-password";

/**
 * Live password-policy checklist, shared by signup and reset-password so the
 * two forms can never drift apart. Requirements come from PASSWORD_CHECKS
 * (lib/validate-password.ts) — the same list the real policy is enforced
 * against — so this UI can never claim a rule that isn't actually required.
 *
 * Neutral (muted, not red) until a requirement is met, then flips to a
 * green check — never shouts every unmet rule as an error while the user is
 * still composing a password. `showErrors` (pass after blur/submit) tints
 * remaining unmet items red instead of neutral.
 */
export default function PasswordRequirements({
  password,
  showErrors = false,
}: {
  password: string;
  showErrors?: boolean;
}) {
  return (
    <ul className="flex flex-col gap-1 mt-1.5">
      {PASSWORD_CHECKS.map((check) => {
        const met = check.test(password);
        const tone = met ? "text-green-700" : showErrors ? "text-red-700" : "text-text-secondary";
        return (
          <li key={check.key} className={`flex items-center gap-1.5 font-label-md text-label-md transition-colors ${tone}`}>
            <span className="material-symbols-outlined text-[14px]" aria-hidden="true">
              {met ? "check_circle" : "radio_button_unchecked"}
            </span>
            <span>
              {check.label}
              <span className="sr-only">{met ? " — met" : " — not met yet"}</span>
            </span>
          </li>
        );
      })}
    </ul>
  );
}
