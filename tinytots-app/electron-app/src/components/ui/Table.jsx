// src/components/ui/Table.jsx

/**
 * Composable table primitives (DESIGN.md §11 Table).
 * One hairline border on the rounded wrapper, a quiet elevated header, hairline
 * row dividers, light row hover, a clear olive-ruled selected row. No full-cell
 * grid, no zebra, no heavy container, compact padding, numeric columns aligned
 * right, mono identifiers at the call site.
 */
export function Table({ className = "", stickyHeader = false, children }) {
  return (
    <div
      className={`overflow-auto rounded-lg border border-border-default bg-surface-panel ${
        stickyHeader ? "max-h-full" : ""
      }`}
    >
      <table className={`w-full border-collapse ${className}`}>{children}</table>
    </div>
  );
}

export function THead({ sticky = false, children }) {
  return (
    <thead
      className={`bg-surface-sunken ${
        sticky ? "sticky top-0 z-10" : ""
      }`}
    >
      {children}
    </thead>
  );
}

export function TBody({ children }) {
  return <tbody className="divide-y divide-border-default">{children}</tbody>;
}

export function TR({ className = "", selected = false, onClick, children, ...rest }) {
  return (
    <tr
      onClick={onClick}
      className={`transition-colors ${onClick ? "cursor-pointer" : ""} ${
        selected
          ? "bg-brand-soft/60 shadow-[inset_2px_0_0_0_var(--color-brand)]"
          : "hover:bg-surface-sunken"
      } ${className}`}
      {...rest}
    >
      {children}
    </tr>
  );
}

const ALIGN = { left: "text-left", right: "text-right", center: "text-center" };

export function TH({ align = "left", className = "", children }) {
  return (
    <th
      className={`type-table-head px-4 py-2.5 ${ALIGN[align]} text-text-secondary ${className}`}
    >
      {children}
    </th>
  );
}

export function TD({ align = "left", className = "", children }) {
  return (
    <td
      className={`type-table px-4 py-2.5 ${ALIGN[align]} text-text-primary ${className}`}
    >
      {children}
    </td>
  );
}
