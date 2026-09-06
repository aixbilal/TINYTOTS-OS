// src/components/ui/Input.jsx

/**
 * Shared text input primitive with label/helper/error slots.
 * Dark elevated field, hairline border, coral focus ring.
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
        <label htmlFor={inputId} className="type-field-label text-text-secondary">
          {label}
        </label>
      )}
      <input
        id={inputId}
        className={`type-input rounded-lg border bg-surface-elevated px-3 py-2 text-text-primary outline-none transition-colors placeholder:text-text-muted focus:ring-2 focus:ring-brand/50 ${
          error
            ? "border-error focus:border-error"
            : "border-border-strong focus:border-brand"
        } ${className}`}
        aria-invalid={!!error}
        {...rest}
      />
      {error ? (
        <p className="type-caption text-error-text">{error}</p>
      ) : helperText ? (
        <p className="type-caption text-text-muted">{helperText}</p>
      ) : null}
    </div>
  );
}
