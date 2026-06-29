import Link from "next/link";
import { AnalyticsDashboard } from "@/components/admin/AnalyticsDashboard";
import {
  AdminTable,
  AdminTableBody,
  AdminTableHead,
} from "@/components/admin/AdminUI";
import { formatCurrency, formatDateShort } from "@/lib/admin/utils";
import type { AnalyticsData } from "@/lib/db/admin/analytics";
import type { CommissionSummary } from "@/lib/admin/commission";
import type { OrderWithCreator } from "@/lib/types";
import { OrderStatusBadge } from "@/components/admin/StatusDropdown";

type StaffAnalyticsViewProps = {
  memberName: string;
  analytics: AnalyticsData;
  orders: OrderWithCreator[];
  commission: CommissionSummary;
  showCommission: boolean;
};

export function StaffAnalyticsView({
  memberName,
  analytics,
  orders,
  commission,
  showCommission,
}: StaffAnalyticsViewProps) {
  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-xl font-bold">{memberName}</h2>
        <p className="text-sm" style={{ color: "var(--admin-text-muted)" }}>
          Manual orders inserted by this team member
        </p>
      </div>

      {showCommission && (
        <div
          className="rounded-xl p-5"
          style={{
            background: "var(--admin-surface)",
            border: "1px solid var(--admin-border)",
          }}
        >
          <h3 className="mb-3 font-semibold">Commission — this month</h3>
          <div className="grid gap-4 sm:grid-cols-3">
            <div>
              <p className="text-xs uppercase" style={{ color: "var(--admin-text-muted)" }}>
                Earned
              </p>
              <p className="text-2xl font-bold">{formatCurrency(commission.totalEarned)}</p>
            </div>
            <div>
              <p className="text-xs uppercase" style={{ color: "var(--admin-text-muted)" }}>
                Delivered orders
              </p>
              <p className="text-2xl font-bold">{commission.deliveredCount}</p>
            </div>
            <div>
              <p className="text-xs uppercase" style={{ color: "var(--admin-text-muted)" }}>
                Next tier
              </p>
              <p className="text-sm font-medium">
                {commission.currentTier
                  ? `#${commission.deliveredCount + 1} → Rs. ${commission.currentTier.rate}`
                  : "—"}
              </p>
              <p className="text-xs" style={{ color: "var(--admin-text-subtle)" }}>
                Resets {commission.nextPeriodReset} (PKT)
              </p>
            </div>
          </div>
          {commission.byTier.length > 0 && (
            <ul className="mt-4 space-y-1 text-sm">
              {commission.byTier.map((t) => (
                <li key={t.label}>
                  {t.label}: {t.count} orders → {formatCurrency(t.amount)}
                </li>
              ))}
            </ul>
          )}
        </div>
      )}

      <AnalyticsDashboard data={analytics} />

      <div>
        <h3 className="mb-3 font-semibold">Orders</h3>
        <AdminTable>
          <AdminTableHead>
            <th className="px-4 py-3">Order</th>
            <th className="px-4 py-3">Customer</th>
            <th className="px-4 py-3">Total</th>
            <th className="px-4 py-3">Status</th>
            <th className="px-4 py-3">Date</th>
          </AdminTableHead>
          <AdminTableBody>
            {orders.map((o) => (
              <tr key={o.id} className="admin-table-row">
                <td className="px-4 py-3">
                  <Link
                    href={`/admin/orders/${o.orderNumber}`}
                    className="font-mono text-sm hover:underline"
                    style={{ color: "var(--admin-primary-text)" }}
                  >
                    {o.orderNumber}
                  </Link>
                </td>
                <td className="px-4 py-3">{o.customerName}</td>
                <td className="px-4 py-3">{formatCurrency(o.total)}</td>
                <td className="px-4 py-3">
                  <OrderStatusBadge status={o.status} />
                </td>
                <td className="px-4 py-3">{formatDateShort(o.createdAt)}</td>
              </tr>
            ))}
          </AdminTableBody>
        </AdminTable>
      </div>
    </div>
  );
}
