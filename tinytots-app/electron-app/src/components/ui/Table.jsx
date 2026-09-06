// src/components/ui/Table.jsx

/**
 * Lightweight composable table primitives. Reuses the `.type-table` /
 * `.type-table-head` classes already defined in styles/typography.css.
 * Tables intentionally keep square edges (no radius) per the redesign
 * docs' radius hierarchy (05-07 Radius.md).
 */
export function Table({ className = "", children }) {
  return (
    <div className="overflow-x-auto rounded-2xl border border-gold-300/30 bg-white">
      <table className={`w-full border-collapse ${className}`}>{children}</table>
    </div>
  );
}

export function THead({ children }) {
  return <thead className="bg-cream-100/60">{children}</thead>;
}

export function TBody({ children }) {
  return <tbody className="divide-y divide-gold-300/20">{children}</tbody>;
}

export function TR({ className = "", children, ...rest }) {
  return (
    <tr className={`hover:bg-cream-100/60 transition-colors ${className}`} {...rest}>
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
      className={`type-table-head px-4 py-3 ${ALIGN[align]} text-ink-900 ${className}`}
    >
      {children}
    </th>
  );
}

export function TD({ align = "left", className = "", children }) {
  return (
    <td className={`type-table px-4 py-3 ${ALIGN[align]} text-ink-900 ${className}`}>
      {children}
    </td>
  );
}
