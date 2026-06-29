"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { updateOrderStatusAction } from "@/app/actions/admin/auth";
import { useToast } from "@/components/admin/ToastProvider";
import {
  OrderStatusBadge,
  StatusDropdown,
} from "@/components/admin/StatusDropdown";
import { formatCurrency, formatDateShort } from "@/lib/admin/utils";
import type { Order, OrderStatus } from "@/lib/types";

type RecentOrdersTableProps = {
  orders: Order[];
  allowedStatuses: OrderStatus[];
};

function OrderRowActions({
  orderNumber,
  currentStatus,
  allowedStatuses,
}: {
  orderNumber: string;
  currentStatus: OrderStatus;
  allowedStatuses: OrderStatus[];
}) {
  const router = useRouter();
  const { showToast } = useToast();
  const [status, setStatus] = useState(currentStatus);
  const [loading, setLoading] = useState(false);

  async function handleChange(next: OrderStatus) {
    setStatus(next);
    setLoading(true);
    const result = await updateOrderStatusAction(orderNumber, next);
    setLoading(false);
    if (result.success) {
      showToast(`Order ${orderNumber} updated to ${next}`);
      router.refresh();
    } else {
      setStatus(currentStatus);
      showToast(result.error ?? "Update failed", "error");
    }
  }

  return (
    <StatusDropdown
      value={status}
      onChange={handleChange}
      loading={loading}
      compact
      allowedStatuses={allowedStatuses}
    />
  );
}

export function RecentOrdersTable({
  orders,
  allowedStatuses,
}: RecentOrdersTableProps) {
  return (
    <section>
      <div className="mb-4 flex items-end justify-between gap-4">
        <div>
          <h2
            className="text-lg font-bold"
            style={{ color: "var(--admin-text-heading)" }}
          >
            Recent Orders
          </h2>
          <p className="text-sm" style={{ color: "var(--admin-text-muted)" }}>
            Last {orders.length} orders
          </p>
        </div>
        <Link
          href="/admin/orders"
          className="text-sm font-semibold hover:underline"
          style={{ color: "var(--admin-primary-text)" }}
        >
          View all →
        </Link>
      </div>

      <div
        className="overflow-x-auto rounded-xl"
        style={{
          background: "var(--admin-surface)",
          border: "1px solid var(--admin-border)",
          boxShadow: "var(--admin-shadow-sm)",
        }}
      >
        <table className="w-full min-w-[720px] text-left text-sm">
          <thead
            style={{
              borderBottom: "1px solid var(--admin-border)",
              background: "color-mix(in srgb, var(--admin-canvas) 60%, var(--admin-surface))",
            }}
          >
            <tr>
              {["Order", "Customer", "Amount", "Status", "Date", "Quick Update"].map(
                (h) => (
                  <th
                    key={h}
                    className="px-4 py-3 text-[11px] font-semibold uppercase tracking-wide"
                    style={{ color: "var(--admin-text-subtle)" }}
                  >
                    {h}
                  </th>
                ),
              )}
            </tr>
          </thead>
          <tbody>
            {orders.map((o) => (
              <tr
                key={o.id}
                className="admin-table-row"
                style={{ borderBottom: "1px solid var(--admin-border)" }}
              >
                <td className="px-4 py-3">
                  <Link
                    href={`/admin/orders/${o.orderNumber}`}
                    className="font-mono text-[13px] font-medium hover:underline"
                    style={{ color: "var(--admin-primary-text)" }}
                  >
                    {o.orderNumber}
                  </Link>
                </td>
                <td
                  className="max-w-[180px] truncate px-4 py-3 font-medium"
                  style={{ color: "var(--admin-text-body)" }}
                  title={o.customerName}
                >
                  {o.customerName}
                </td>
                <td
                  className="px-4 py-3 tabular-nums"
                  style={{ color: "var(--admin-text-body)" }}
                >
                  {formatCurrency(o.total)}
                </td>
                <td className="px-4 py-3">
                  <OrderStatusBadge status={o.status} />
                </td>
                <td
                  className="px-4 py-3 text-xs"
                  style={{ color: "var(--admin-text-muted)" }}
                >
                  {formatDateShort(o.createdAt)}
                </td>
                <td className="px-4 py-3">
                  <OrderRowActions
                    orderNumber={o.orderNumber}
                    currentStatus={o.status}
                    allowedStatuses={allowedStatuses}
                  />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
