/**
 * Compact form-level alert for server/auth failures — distinct from inline
 * per-field errors. Restrained pale surface, not a shouting red block, and
 * carries the accessible semantics a crude red line under an input doesn't:
 * role="alert" + aria-live so screen readers announce it the moment it
 * appears (e.g. after a failed sign-in), without needing focus to move.
 */
export default function FormAlert({ children }: { children?: React.ReactNode }) {
  if (!children) return null;
  return (
    <div role="alert" aria-live="assertive" className="flex items-start gap-2 rounded-lg border border-red-700/25 bg-red-700/5 px-3.5 py-3">
      <span className="material-symbols-outlined text-red-700 text-[18px] shrink-0 leading-none" aria-hidden="true">
        error
      </span>
      <p className="font-body-sm text-body-sm text-red-700">{children}</p>
    </div>
  );
}
