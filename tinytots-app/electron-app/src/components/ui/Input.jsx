// src/components/ui/Input.jsx

/**
 * Shared form field primitives (DESIGN.md §11 Input / Textarea / Select).
 * Clean white field, single hairline border, olive focus ring — no thick
 * outline, no double framing, no dark island, no giant pill.
 */

const FIELD_BASE =
  "type-input w-full rounded-md border bg-surface-panel px-3 py-2 text-text-primary outline-none transition-[border-color,box-shadow] placeholder:text-text-muted focus:ring-2 focus:ring-brand/45";

function fieldBorder(error) {
  return error
    ? "border-error focus:border-error"
    : "border-border-default focus:border-brand";
}

function Wrapper({ label, htmlFor, error, helperText, children }) {
  return (
    <div className="flex flex-col gap-1.5">
      {label && (
        <label htmlFor={htmlFor} className="type-field-label text-text-secondary">
          {label}
        </label>
      )}
      {children}
      {error ? (
        <p className="type-caption text-error-text">{error}</p>
      ) : helperText ? (
        <p className="type-caption text-text-muted">{helperText}</p>
      ) : null}
    </div>
  );
}

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
    <Wrapper label={label} htmlFor={inputId} error={error} helperText={helperText}>
      <input
        id={inputId}
        className={`${FIELD_BASE} ${fieldBorder(error)} ${className}`}
        aria-invalid={!!error}
        {...rest}
      />
    </Wrapper>
  );
}

export function Textarea({
  label,
  helperText,
  error,
  id,
  className = "",
  rows = 4,
  ...rest
}) {
  const inputId = id || rest.name;
  return (
    <Wrapper label={label} htmlFor={inputId} error={error} helperText={helperText}>
      <textarea
        id={inputId}
        rows={rows}
        className={`${FIELD_BASE} resize-y leading-relaxed ${fieldBorder(error)} ${className}`}
        aria-invalid={!!error}
        {...rest}
      />
    </Wrapper>
  );
}

export function Select({
  label,
  helperText,
  error,
  id,
  className = "",
  children,
  ...rest
}) {
  const inputId = id || rest.name;
  return (
    <Wrapper label={label} htmlFor={inputId} error={error} helperText={helperText}>
      <select
        id={inputId}
        className={`${FIELD_BASE} pr-8 appearance-none bg-[length:1rem] bg-[right_0.6rem_center] bg-no-repeat ${fieldBorder(
          error
        )} ${className}`}
        style={{
          backgroundImage:
            "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='16' height='16' viewBox='0 0 24 24' fill='none' stroke='%23675949' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='m6 9 6 6 6-6'/%3E%3C/svg%3E\")",
        }}
        aria-invalid={!!error}
        {...rest}
      >
        {children}
      </select>
    </Wrapper>
  );
}
