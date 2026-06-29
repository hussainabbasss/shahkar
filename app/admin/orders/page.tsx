import type { Metadata } from "next";
import Link from "next/link";
import { AdminLayout } from "@/components/admin/AdminLayout";
import {
  AdminEmptyState,
  AdminPrimaryButton,
  AdminTable,
  AdminTableBody,
  AdminTableHead,
  StatusBadge,
  adminInputClass,
} from "@/components/admin/AdminUI";
import { OrderStatusBadge } from "@/components/admin/StatusDropdown";
import {
  hasPermission,
  isSuperAdmin,
} from "@/lib/admin/permissions";
import { requirePermission } from "@/lib/admin/guards";
import { formatCurrency, formatDateShort } from "@/lib/admin/utils";
import { listOrdersAdmin, listStaffForFilter } from "@/lib/db/admin/orders";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import type { OrderStatus } from "@/lib/types";

export const metadata: Metadata = {
  title: "Orders",
  robots: { index: false, follow: false },
};

const STATUSES = ["all", "pending", "confirmed", "dispatched", "delivered", "returned"] as const;

export default async function AdminOrdersPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string; q?: string; creator?: string }>;
}) {
  const admin = await requirePermission("view_orders");
  const params = await searchParams;
  const status = (params.status ?? "all") as OrderStatus | "all";
  const search = params.q ?? "";
  const creator = params.creator ?? "all";

  if (!isSupabaseConfigured()) {
    return (
      <AdminLayout title="Orders" admin={admin}>
        <AdminEmptyState message="Supabase not configured." />
      </AdminLayout>
    );
  }

  const staff = isSuperAdmin(admin) ? await listStaffForFilter() : [];
  const { orders, total } = await listOrdersAdmin({
    status,
    search,
    createdBy: isSuperAdmin(admin) ? creator : "all",
  });

  return (
    <AdminLayout
      title="Orders"
      admin={admin}
      actions={
        hasPermission(admin, "create_orders") ? (
          <Link href="/admin/orders/new">
            <AdminPrimaryButton>New manual order</AdminPrimaryButton>
          </Link>
        ) : undefined
      }
    >
      <div className="mb-6 space-y-4">
        <form method="get" className="flex flex-wrap gap-3">
          <input
            name="q"
            defaultValue={search}
            placeholder="Search order # or phone"
            className={`${adminInputClass} max-w-xs`}
          />
          <select name="status" defaultValue={status} className={`${adminInputClass} max-w-[160px]`}>
            {STATUSES.map((s) => (
              <option key={s} value={s}>{s === "all" ? "All Statuses" : s}</option>
            ))}
          </select>
          {isSuperAdmin(admin) && (
            <select
              name="creator"
              defaultValue={creator}
              className={`${adminInputClass} max-w-[180px]`}
            >
              <option value="all">All creators</option>
              <option value="website">Website</option>
              {staff.map((s) => (
                <option key={s.id} value={s.id}>{s.name}</option>
              ))}
            </select>
          )}
          <button type="submit" className="rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-white">
            Filter
          </button>
        </form>
        <p className="text-sm" style={{ color: "var(--admin-text-muted)" }}>
          {total} order{total !== 1 ? "s" : ""}
        </p>
      </div>

      {orders.length === 0 ? (
        <AdminEmptyState message="No orders found" />
      ) : (
        <AdminTable>
          <AdminTableHead>
            <th className="px-4 py-3">Order</th>
            <th className="px-4 py-3">Source</th>
            <th className="px-4 py-3">Created by</th>
            <th className="px-4 py-3">Customer</th>
            <th className="px-4 py-3">Phone</th>
            <th className="px-4 py-3">City</th>
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
                    className="font-mono text-sm font-medium hover:underline"
                    style={{ color: "var(--admin-primary-text)" }}
                  >
                    {o.orderNumber}
                  </Link>
                </td>
                <td className="px-4 py-3">
                  <StatusBadge
                    status={o.source === "manual" ? "active" : "draft"}
                    variant="product"
                  />
                  <span className="ml-1 text-xs capitalize">{o.source === "manual" ? "Manual" : "Website"}</span>
                </td>
                <td className="px-4 py-3">
                  {o.source === "manual" ? (o.creatorName ?? "Staff") : "Website"}
                </td>
                <td className="px-4 py-3">{o.customerName}</td>
                <td className="px-4 py-3">{o.customerPhone}</td>
                <td className="px-4 py-3">{o.city}</td>
                <td className="px-4 py-3">{formatCurrency(o.total)}</td>
                <td className="px-4 py-3">
                  <OrderStatusBadge status={o.status} />
                </td>
                <td className="px-4 py-3" style={{ color: "var(--admin-text-muted)" }}>
                  {formatDateShort(o.createdAt)}
                </td>
              </tr>
            ))}
          </AdminTableBody>
        </AdminTable>
      )}
    </AdminLayout>
  );
}
