"use client";

import { ReactNode } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAdminAuth } from "@/lib/admin-auth-context";
import { can } from "@/lib/admin-permissions";

// ---------------------------------------------------------------------------
// Lightweight Admin design-system primitives. Tailwind + existing TinyTots
// tokens only — no new dependency. Use these instead of ad-hoc markup so the
// back office stays visually consistent.
// ---------------------------------------------------------------------------

/** Page title + optional description + right-aligned actions slot.
 *  `breadcrumb` renders a compact "Content / Website / Homepage" trail above
 *  the title — keep it to 2–3 segments, last segment = current page. */
export function AdminPageHeader({
  title,
  description,
  actions,
  breadcrumb,
  className = "",
}: {
  title: ReactNode;
  description?: ReactNode;
  actions?: ReactNode;
  breadcrumb?: string[];
  className?: string;
}) {
  return (
    <div className={`mb-6 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between ${className}`}>
      <div className="min-w-0">
        {breadcrumb && breadcrumb.length > 0 && (
          <p className="mb-1 font-label-md text-[11px] font-semibold uppercase tracking-wider text-text-secondary/70">
            {breadcrumb.join(" / ")}
          </p>
        )}
        <h1 className="font-headline-lg text-[26px] font-semibold leading-tight text-text-primary sm:text-[30px]">
          {title}
        </h1>
        {description && (
          <p className="mt-1 max-w-2xl font-body-sm text-body-sm text-text-secondary">{description}</p>
        )}
      </div>
      {actions && <div className="flex shrink-0 flex-wrap items-center gap-2">{actions}</div>}
    </div>
  );
}

/** Secondary (in-section) navigation. Sits under AdminPageHeader on pages that
 *  belong to a multi-page module (Website content, Blog, Help Center, Social
 *  proof, Digital Signage). Items the current role can't access are hidden;
 *  when only one item would remain visible the whole bar is hidden. */
export type AdminSubnavItem = {
  href: string;
  label: string;
  perm?: Parameters<typeof can>[1] | Parameters<typeof can>[1][] | null;
  /** Opens in a new tab (e.g. the live signage display). */
  external?: boolean;
  icon?: string;
};

export function AdminSubnav({ items, className = "" }: { items: AdminSubnavItem[]; className?: string }) {
  const pathname = usePathname();
  const { admin } = useAdminAuth();

  const allowed = (perm: AdminSubnavItem["perm"]) => {
    if (perm == null) return true;
    if (!admin) return false;
    const list = Array.isArray(perm) ? perm : [perm];
    return list.some((p) => can(admin.role, p));
  };

  const visible = items.filter((it) => allowed(it.perm));
  if (visible.length <= 1) return null;

  return (
    <nav
      className={`mb-6 flex flex-wrap items-center gap-1 border-b border-border-default ${className}`}
      aria-label="Section"
    >
      {visible.map((it) => {
        const active =
          !it.external &&
          (pathname === it.href || pathname?.startsWith(it.href + "/"));
        const cls = `-mb-px inline-flex items-center gap-1.5 border-b-2 px-3 py-2 font-body-sm text-body-sm font-medium transition-colors ${
          active
            ? "border-brand-primary text-text-primary"
            : "border-transparent text-text-secondary hover:border-border-default hover:text-text-primary"
        }`;
        if (it.external) {
          return (
            <a key={it.href} href={it.href} target="_blank" rel="noreferrer" className={cls}>
              {it.icon && (
                <span className="material-symbols-outlined text-[18px]" aria-hidden>
                  {it.icon}
                </span>
              )}
              {it.label}
              <span className="material-symbols-outlined text-[16px]" aria-hidden>
                open_in_new
              </span>
            </a>
          );
        }
        return (
          <Link key={it.href} href={it.href} aria-current={active ? "page" : undefined} className={cls}>
            {it.icon && (
              <span className="material-symbols-outlined text-[18px]" aria-hidden>
                {it.icon}
              </span>
            )}
            {it.label}
          </Link>
        );
      })}
    </nav>
  );
}

/** White elevated surface with consistent border/radius/padding. */
export function AdminCard({
  children,
  className = "",
  padded = true,
  title,
  actions,
}: {
  children: ReactNode;
  className?: string;
  padded?: boolean;
  title?: ReactNode;
  actions?: ReactNode;
}) {
  return (
    <section className={`rounded-lg border border-border-default bg-surface-elevated ${className}`}>
      {(title || actions) && (
        <div className="flex items-center justify-between gap-3 border-b border-border-default px-4 py-3 sm:px-5">
          {title && <h2 className="font-headline-md text-headline-md font-semibold text-text-primary">{title}</h2>}
          {actions && <div className="flex items-center gap-2">{actions}</div>}
        </div>
      )}
      <div className={padded ? "p-4 sm:p-5" : ""}>{children}</div>
    </section>
  );
}

type BtnVariant = "primary" | "secondary" | "ghost" | "danger";
const BTN: Record<BtnVariant, string> = {
  primary: "bg-brand-primary text-white hover:opacity-90",
  secondary: "border border-border-default bg-surface-elevated text-text-primary hover:bg-surface-secondary",
  ghost: "text-text-secondary hover:bg-surface-secondary hover:text-text-primary",
  danger: "border border-red-200 bg-white text-red-700 hover:bg-red-50",
};

export function AdminButton({
  children,
  variant = "secondary",
  className = "",
  type = "button",
  ...rest
}: {
  children: ReactNode;
  variant?: BtnVariant;
  className?: string;
} & React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      type={type}
      className={`inline-flex items-center justify-center gap-1.5 rounded-md px-3.5 py-2 font-body-sm text-body-sm font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-50 ${BTN[variant]} ${className}`}
      {...rest}
    >
      {children}
    </button>
  );
}

type Tone = "neutral" | "success" | "warning" | "danger" | "info" | "brand";
const TONE: Record<Tone, string> = {
  neutral: "bg-surface-secondary text-text-secondary",
  success: "bg-green-100 text-green-800",
  warning: "bg-amber-100 text-amber-800",
  danger: "bg-red-100 text-red-800",
  info: "bg-sky-100 text-sky-800",
  brand: "bg-brand-primary/10 text-brand-primary",
};

export function AdminBadge({ children, tone = "neutral" }: { children: ReactNode; tone?: Tone }) {
  return (
    <span
      className={`inline-flex items-center whitespace-nowrap rounded-full px-2 py-0.5 font-label-md text-[11px] font-semibold uppercase tracking-wide ${TONE[tone]}`}
    >
      {children}
    </span>
  );
}

/** Maps common business statuses to a consistent tone + readable label. */
export function AdminStatusBadge({ status }: { status: string | null | undefined }) {
  const s = (status || "").toLowerCase().trim();
  const map: Record<string, { tone: Tone; label: string }> = {
    new: { tone: "info", label: "New" },
    processing: { tone: "warning", label: "Processing" },
    shipped: { tone: "brand", label: "Shipped" },
    delivered: { tone: "success", label: "Delivered" },
    cancelled: { tone: "danger", label: "Cancelled" },
    open: { tone: "info", label: "Open" },
    in_progress: { tone: "warning", label: "In Progress" },
    "in progress": { tone: "warning", label: "In Progress" },
    resolved: { tone: "success", label: "Resolved" },
    active: { tone: "success", label: "Active" },
    inactive: { tone: "neutral", label: "Inactive" },
  };
  const hit = map[s] || { tone: "neutral" as Tone, label: status || "—" };
  return <AdminBadge tone={hit.tone}>{hit.label}</AdminBadge>;
}

/** Horizontal-scroll wrapper so wide tables never blow out the page at
 *  tablet widths. */
export function AdminTableWrap({ children, className = "" }: { children: ReactNode; className?: string }) {
  return (
    <div className={`w-full overflow-x-auto rounded-lg border border-border-default ${className}`}>
      <table className="w-full min-w-[640px] border-collapse text-left">{children}</table>
    </div>
  );
}

export function AdminTh({ children, className = "" }: { children?: ReactNode; className?: string }) {
  return (
    <th
      className={`whitespace-nowrap border-b border-border-default bg-surface-secondary px-3 py-2.5 font-label-md text-[11px] font-semibold uppercase tracking-wider text-text-secondary ${className}`}
    >
      {children}
    </th>
  );
}

export function AdminTd({ children, className = "" }: { children?: ReactNode; className?: string }) {
  return (
    <td className={`border-b border-border-default px-3 py-2.5 align-middle font-body-sm text-body-sm text-text-primary ${className}`}>
      {children}
    </td>
  );
}

export function AdminEmptyState({
  icon = "inbox",
  title,
  description,
  action,
}: {
  icon?: string;
  title: string;
  description?: string;
  action?: ReactNode;
}) {
  return (
    <div className="flex flex-col items-center gap-2 px-4 py-12 text-center">
      <span className="material-symbols-outlined text-[32px] text-text-secondary/60" aria-hidden>
        {icon}
      </span>
      <p className="font-headline-md text-headline-md font-semibold text-text-primary">{title}</p>
      {description && <p className="max-w-sm font-body-sm text-body-sm text-text-secondary">{description}</p>}
      {action && <div className="mt-2">{action}</div>}
    </div>
  );
}

/** Minimal accessible confirm dialog. Render conditionally: `{open && <AdminConfirmDialog .../>}`. */
export function AdminConfirmDialog({
  title,
  message,
  confirmLabel = "Confirm",
  cancelLabel = "Cancel",
  danger = false,
  busy = false,
  onConfirm,
  onCancel,
}: {
  title: string;
  message: ReactNode;
  confirmLabel?: string;
  cancelLabel?: string;
  danger?: boolean;
  busy?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 p-4"
      role="dialog"
      aria-modal="true"
      aria-label={title}
      onClick={onCancel}
    >
      <div
        className="w-full max-w-sm rounded-lg border border-border-default bg-surface-elevated p-5 shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="font-headline-md text-headline-md font-semibold text-text-primary">{title}</h2>
        <p className="mt-1.5 font-body-sm text-body-sm text-text-secondary">{message}</p>
        <div className="mt-4 flex justify-end gap-2">
          <AdminButton variant="ghost" onClick={onCancel} disabled={busy}>
            {cancelLabel}
          </AdminButton>
          <AdminButton variant={danger ? "danger" : "primary"} onClick={onConfirm} disabled={busy}>
            {busy ? "Working…" : confirmLabel}
          </AdminButton>
        </div>
      </div>
    </div>
  );
}

export function AdminAlert({ children, tone = "info" }: { children: ReactNode; tone?: "info" | "success" | "warning" | "danger" }) {
  const t = {
    info: "border-sky-200 bg-sky-50 text-sky-900",
    success: "border-green-200 bg-green-50 text-green-900",
    warning: "border-amber-200 bg-amber-50 text-amber-900",
    danger: "border-red-200 bg-red-50 text-red-900",
  }[tone];
  return (
    <div className={`rounded-md border px-3.5 py-2.5 font-body-sm text-body-sm ${t}`} role="status">
      {children}
    </div>
  );
}

// --- Form primitives -----------------------------------------------------
// Shared input styling so every Admin form has the same field rhythm,
// focus ring, label and help-text treatment.

export const adminInputClass =
  "w-full rounded-md border border-border-default bg-surface-elevated px-3 py-2 font-body-sm text-body-sm text-text-primary placeholder:text-text-secondary/60 focus:outline-none focus:ring-2 focus:ring-brand-primary/40 disabled:cursor-not-allowed disabled:opacity-60";

/** Label + optional help text wrapper for a single form control. */
export function AdminField({
  label,
  hint,
  htmlFor,
  children,
  className = "",
}: {
  label: ReactNode;
  hint?: ReactNode;
  htmlFor?: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={`flex flex-col gap-1.5 ${className}`}>
      <label htmlFor={htmlFor} className="font-label-md text-label-md font-medium text-text-primary">
        {label}
      </label>
      {hint && <p className="-mt-0.5 font-label-md text-label-md text-text-secondary">{hint}</p>}
      {children}
    </div>
  );
}

/** Sticky-feel save row: primary action + transient "Saved" confirmation. */
export function AdminSaveBar({
  onSave,
  saving,
  saved,
  label = "Save changes",
  children,
}: {
  onSave: () => void;
  saving?: boolean;
  saved?: boolean;
  label?: string;
  children?: ReactNode;
}) {
  return (
    <div className="flex flex-wrap items-center gap-3 border-t border-border-default pt-4">
      <AdminButton variant="primary" onClick={onSave} disabled={saving}>
        {saving ? "Saving…" : label}
      </AdminButton>
      {saved && (
        <span className="inline-flex items-center gap-1 font-label-md text-label-md font-medium text-green-700">
          <span className="material-symbols-outlined text-[16px]" aria-hidden>check_circle</span>
          Saved
        </span>
      )}
      {children}
    </div>
  );
}
