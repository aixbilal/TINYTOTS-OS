// src/components/ui/Table.jsx

/**
 * Lightweight composable table primitives for the dark operational system.
 * A bordered panel wrapper, a slightly elevated header row, hairline row
 * dividers and a quiet row hover — tuned for dense retail data.
 */
export function Table({ className = "", children }) {
  return (
    <div className="overflow-x-auto rounded-xl border border-border-default bg-surface-panel">
      <table className={`w-full border-collapse ${className}`}>{children}</table>
    </div>
  );
}

export function THead({ children }) {
  return <thead className="bg-surface-elevated/60">{children}</thead>;
}

export function TBody({ children }) {
  return <tbody className="divide-y divide-border-default">{children}</tbody>;
}

export function TR({ className = "", children, ...rest }) {
  return (
    <tr
      className={`transition-colors hover:bg-surface-elevated/50 ${className}`}
      {...rest}
    >
      {children}
    </tr>
  );
}

const ALIGN = {
  left: "text-left",
  right: "text-right",
  center: "text-center",
};

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
