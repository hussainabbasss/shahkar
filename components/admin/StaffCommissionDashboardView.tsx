import Link from "next/link";
import { Banknote, ShoppingBag } from "lucide-react";
import { formatCurrency } from "@/lib/admin/utils";
import type { CommissionSummary } from "@/lib/admin/commission";

type StaffCommissionDashboardViewProps = {
  adminName: string;
  ordersCreated: number;
  commission: CommissionSummary;
};

function getGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return "Good morning";
  if (hour < 17) return "Good afternoon";
  return "Good evening";
}

function formatPageDate(): string {
  return new Date().toLocaleDateString("en-PK", {
    weekday: "long",
    day: "numeric",
    month: "short",
    year: "numeric",
    timeZone: "Asia/Karachi",
  });
}

export function StaffCommissionDashboardView({
  adminName,
  ordersCreated,
  commission,
}: StaffCommissionDashboardViewProps) {
  const firstName = adminName.split(" ")[0] ?? adminName;

  return (
    <div className="mx-auto max-w-[900px] space-y-6">
      <header>
        <h1
          className="text-2xl font-bold"
          style={{ color: "var(--admin-text-heading)" }}
        >
          {getGreeting()}, {firstName}
        </h1>
        <p className="mt-1 text-sm" style={{ color: "var(--admin-text-muted)" }}>
          Your sales summary · {formatPageDate()} · PKT
        </p>
      </header>

      <div className="grid gap-4 sm:grid-cols-2">
        <div
          className="rounded-xl p-6"
          style={{
            background: "var(--admin-surface)",
            border: "1px solid var(--admin-border)",
            boxShadow: "var(--admin-shadow-sm)",
          }}
        >
          <div className="flex items-start gap-4">
            <div
              className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full"
              style={{
                background: "var(--admin-primary-muted)",
                color: "var(--admin-primary-text)",
              }}
            >
              <ShoppingBag size={20} />
            </div>
            <div>
              <p
                className="text-sm font-semibold"
                style={{ color: "var(--admin-text-muted)" }}
              >
                Orders you made
              </p>
              <p
                className="mt-1 text-3xl font-bold tabular-nums"
                style={{ color: "var(--admin-text-heading)" }}
              >
                {ordersCreated.toLocaleString("en-PK")}
              </p>
              <p className="mt-1 text-xs" style={{ color: "var(--admin-text-subtle)" }}>
                Manual orders you inserted
              </p>
            </div>
          </div>
        </div>

        <div
          className="rounded-xl p-6"
          style={{
            background: "var(--admin-surface)",
            border: "1px solid var(--admin-border)",
            boxShadow: "var(--admin-shadow-sm)",
          }}
        >
          <div className="flex items-start gap-4">
            <div
              className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full"
              style={{
                background: "color-mix(in srgb, var(--admin-success) 12%, transparent)",
                color: "var(--admin-success)",
              }}
            >
              <Banknote size={20} />
            </div>
            <div>
              <p
                className="text-sm font-semibold"
                style={{ color: "var(--admin-text-muted)" }}
              >
                Commission this month
              </p>
              <p
                className="mt-1 text-3xl font-bold tabular-nums"
                style={{ color: "var(--admin-text-heading)" }}
              >
                {formatCurrency(commission.totalEarned)}
              </p>
              <p className="mt-1 text-xs" style={{ color: "var(--admin-text-subtle)" }}>
                {commission.deliveredCount} delivered · resets {commission.nextPeriodReset}
              </p>
            </div>
          </div>
        </div>
      </div>

      <p className="text-sm" style={{ color: "var(--admin-text-muted)" }}>
        <Link
          href="/admin/analytics"
          className="font-semibold hover:underline"
          style={{ color: "var(--admin-primary-text)" }}
        >
          View full analytics →
        </Link>
      </p>
    </div>
  );
}
