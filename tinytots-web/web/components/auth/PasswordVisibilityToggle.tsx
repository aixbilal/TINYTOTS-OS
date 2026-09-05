// Shared show/hide button for password fields — same markup everywhere a
// password input appears (login, signup, reset password, account settings)
// so the toggle look and hit area never drift between forms.
export default function PasswordVisibilityToggle({
  visible,
  onToggle,
}: {
  visible: boolean;
  onToggle: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onToggle}
      aria-label={visible ? "Hide password" : "Show password"}
      className="absolute right-1.5 top-1/2 -translate-y-1/2 w-9 h-9 flex items-center justify-center rounded-full text-text-secondary hover:text-brand-primary hover:bg-surface-secondary transition-colors"
    >
      <span className="material-symbols-outlined text-[20px]" aria-hidden="true">
        {visible ? "visibility_off" : "visibility"}
      </span>
    </button>
  );
}
