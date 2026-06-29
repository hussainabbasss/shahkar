import { formatCurrency } from "@/lib/admin/utils";

type StatCardProps = {
  label: string;
  value: string | number;
  sub?: string;
  alert?: boolean;
};

export function StatCard({ label, value, sub, alert }: StatCardProps) {
  return (
    <div
      className="admin-card p-4"
      style={
        alert
          ? {
              borderColor: "var(--admin-error)",
              background: "color-mix(in srgb, var(--admin-error) 10%, var(--admin-surface))",
            }
          : undefined
      }
    >
      <p
        className="text-xs font-medium uppercase tracking-wide"
        style={{ color: "var(--admin-text-muted)" }}
      >
        {label}
      </p>
      <p
        className="mt-1 text-2xl font-bold tabular-nums"
        style={{ color: "var(--admin-text-heading)" }}
      >
        {typeof value === "number" && label.toLowerCase().includes("revenue")
          ? formatCurrency(value)
          : value}
      </p>
      {sub && (
        <p className="mt-1 text-xs" style={{ color: "var(--admin-text-muted)" }}>
          {sub}
        </p>
      )}
    </div>
  );
}
