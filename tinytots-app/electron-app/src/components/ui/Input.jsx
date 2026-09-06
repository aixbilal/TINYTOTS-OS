// src/components/ui/Input.jsx

/**
 * Shared text input primitive with label/helper/error slots. Border and focus
 * colors reuse the existing gold/maroon tokens; sizing reuses `.type-input`
 * (already applied globally to <input> in styles/typography.css).
 */
export default function Input({
  label,
  helperText,
  error,
  id,
  className = "",
  ...rest
}) {
  const inputId = id || rest.name;

  return (
    <div className="flex flex-col gap-1.5">
      {label && (
        <label htmlFor={inputId} className="type-field-label text-ink-900">
          {label}
        </label>
      )}
      <input
        id={inputId}
        className={`rounded-lg border bg-white px-3.5 py-2.5 text-ink-900 outline-none transition-colors placeholder:text-ink-700/40 focus:ring-2 focus:ring-maroon-700/30 ${
          error
            ? "border-red-400 focus:border-red-500"
            : "border-gold-300/50 focus:border-maroon-700"
        } ${className}`}
        aria-invalid={!!error}
        {...rest}
      />
      {error ? (
        <p className="type-caption text-red-600">{error}</p>
      ) : helperText ? (
        <p className="type-caption text-ink-700/70">{helperText}</p>
      ) : null}
    </div>
  );
}
