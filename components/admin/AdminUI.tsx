import type { CSSProperties, ReactNode } from "react";

type StatusBadgeProps = {
  status: string;
  variant?: "order" | "sale" | "coupon" | "product";
};

const ORDER_COLORS: Record<string, string> = {
  pending: "bg-accent-light text-accent",
  confirmed: "bg-blue-50 text-blue-700",
  dispatched: "bg-purple-50 text-purple-700",
  delivered: "bg-primary-light text-primary",
  returned: "bg-red-50 text-error",
};

const SALE_COLORS: Record<string, string> = {
  Active: "bg-primary-light text-primary",
  Scheduled: "bg-blue-50 text-blue-700",
  Expired: "bg-muted/20 text-muted",
  Inactive: "bg-muted/20 text-muted",
};

const COUPON_COLORS: Record<string, string> = {
  Active: "bg-primary-light text-primary",
  Expired: "bg-muted/20 text-muted",
  "Limit Reached": "bg-accent-light text-accent",
  Inactive: "bg-muted/20 text-muted",
};

const PRODUCT_COLORS: Record<string, string> = {
  active: "bg-primary-light text-primary",
  draft: "bg-muted/20 text-muted",
};

export function StatusBadge({ status, variant = "order" }: StatusBadgeProps) {
  const colors =
    variant === "sale"
      ? SALE_COLORS
      : variant === "coupon"
        ? COUPON_COLORS
        : variant === "product"
          ? PRODUCT_COLORS
          : ORDER_COLORS;

  const label = status.charAt(0).toUpperCase() + status.slice(1);
  const colorClass = colors[status] ?? colors[label] ?? "bg-muted/20 text-muted";

  return (
    <span
      className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold capitalize ${colorClass}`}
    >
      {label}
    </span>
  );
}

export function AdminTable({
  children,
}: {
  children: ReactNode;
}) {
  return (
    <div
      className="overflow-x-auto rounded-xl"
      style={{
        background: "var(--admin-surface)",
        border: "1px solid var(--admin-border)",
        boxShadow: "var(--admin-shadow-sm)",
      }}
    >
      <table className="w-full min-w-[640px] text-left text-sm">{children}</table>
    </div>
  );
}

export function AdminTableHead({ children }: { children: ReactNode }) {
  return (
    <thead
      style={{
        borderBottom: "1px solid var(--admin-border)",
        background: "color-mix(in srgb, var(--admin-canvas) 60%, var(--admin-surface))",
      }}
    >
      <tr className="text-[11px] font-semibold uppercase tracking-wide" style={{ color: "var(--admin-text-subtle)" }}>
        {children}
      </tr>
    </thead>
  );
}

export function AdminTableBody({ children }: { children: ReactNode }) {
  return (
    <tbody className="divide-y" style={{ borderColor: "var(--admin-border)" }}>
      {children}
    </tbody>
  );
}

export function AdminEmptyState({ message }: { message: string }) {
  return (
    <div
      className="rounded-xl border border-dashed px-6 py-12 text-center text-sm"
      style={{
        borderColor: "var(--admin-border)",
        background: "var(--admin-surface)",
        color: "var(--admin-text-muted)",
      }}
    >
      {message}
    </div>
  );
}

export function AdminPrimaryButton({
  children,
  href,
  onClick,
  type = "button",
  disabled,
}: {
  children: ReactNode;
  href?: string;
  onClick?: () => void;
  type?: "button" | "submit";
  disabled?: boolean;
}) {
  const className =
    "inline-flex items-center rounded-lg px-4 py-2 text-sm font-semibold text-white transition-colors disabled:opacity-50";

  const style = {
    background: "var(--admin-primary)",
  };

  if (href) {
    return (
      <a href={href} className={className} style={style}>
        {children}
      </a>
    );
  }

  return (
    <button type={type} onClick={onClick} disabled={disabled} className={className} style={style}>
      {children}
    </button>
  );
}

export function AdminDangerButton({
  children,
  onClick,
  type = "button",
  disabled,
}: {
  children: ReactNode;
  onClick?: () => void;
  type?: "button" | "submit";
  disabled?: boolean;
}) {
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className="inline-flex items-center rounded-lg border px-3 py-1.5 text-sm font-medium transition-colors disabled:opacity-50"
      style={{
        borderColor: "var(--admin-error)",
        color: "var(--admin-error)",
      }}
    >
      {children}
    </button>
  );
}

export function AdminFormSection({
  title,
  children,
}: {
  title: string;
  children: ReactNode;
}) {
  return (
    <section
      className="admin-card p-6"
    >
      <h2
        className="mb-4 text-lg font-semibold"
        style={{ color: "var(--admin-text-heading)" }}
      >
        {title}
      </h2>
      <div className="space-y-4">{children}</div>
    </section>
  );
}

export function AdminField({
  label,
  children,
  hint,
}: {
  label: string;
  children: ReactNode;
  hint?: string;
}) {
  return (
    <label className="block">
      <span
        className="mb-1 block text-sm font-medium"
        style={{ color: "var(--admin-text-body)" }}
      >
        {label}
      </span>
      {children}
      {hint && (
        <span className="mt-1 block text-xs" style={{ color: "var(--admin-text-muted)" }}>
          {hint}
        </span>
      )}
    </label>
  );
}

export const adminInputClass =
  "w-full rounded-lg border px-3 py-2 text-sm focus:outline-none focus:ring-2 transition-colors";
export const adminInputStyle = {
  background: "var(--admin-surface)",
  borderColor: "var(--admin-border)",
  color: "var(--admin-text-body)",
  "--tw-ring-color": "var(--admin-primary)",
} as CSSProperties;
