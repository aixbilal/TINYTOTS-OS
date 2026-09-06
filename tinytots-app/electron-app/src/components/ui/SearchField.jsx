// src/components/ui/SearchField.jsx
import { Search, X } from "lucide-react";

/**
 * Shared search input (DESIGN.md §11 Search field). Icon + input in one
 * hairline control on a sunken well, radius-md, with a clear button that
 * appears once populated. Quiet — not a heavy pill.
 */
export default function SearchField({
  value,
  onChange,
  onClear,
  placeholder = "Search…",
  className = "",
  inputRef,
  ...rest
}) {
  return (
    <div
      className={`inline-flex items-center gap-2 rounded-md border border-border-default bg-surface-sunken px-3 h-9 transition-[border-color,box-shadow] focus-within:border-brand focus-within:ring-2 focus-within:ring-brand/40 ${className}`}
    >
      <Search size={15} className="text-text-muted shrink-0" />
      <input
        ref={inputRef}
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="type-input flex-1 min-w-0 bg-transparent outline-none text-text-primary placeholder:text-text-muted"
        {...rest}
      />
      {value && (
        <button
          type="button"
          onClick={() => (onClear ? onClear() : onChange(""))}
          className="text-text-muted hover:text-text-primary shrink-0"
          aria-label="Clear search"
        >
          <X size={14} />
        </button>
      )}
    </div>
  );
}
