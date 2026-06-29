import type { Metadata } from "next";
import Link from "next/link";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { SaleActions } from "@/components/admin/SaleActions";
import {
  AdminEmptyState,
  AdminPrimaryButton,
  AdminTable,
  AdminTableBody,
  AdminTableHead,
  StatusBadge,
} from "@/components/admin/AdminUI";
import { requirePermission } from "@/lib/admin/guards";
import { formatDateShort, getSaleStatus } from "@/lib/admin/utils";
import { listSalesAdmin } from "@/lib/db/admin/sales";
import { isSupabaseConfigured } from "@/lib/supabase/config";

export const metadata: Metadata = {
  title: "Sales",
  robots: { index: false, follow: false },
};

export default async function AdminSalesPage() {
  const admin = await requirePermission("view_sales");

  if (!isSupabaseConfigured()) {
    return (
      <AdminLayout title="Sales" admin={admin}>
        <AdminEmptyState message="Supabase not configured." />
      </AdminLayout>
    );
  }

  const sales = await listSalesAdmin();

  return (
    <AdminLayout
      title="Sales"
      admin={admin}
      actions={<AdminPrimaryButton href="/admin/sales/new">Create Sale</AdminPrimaryButton>}
    >
      {sales.length === 0 ? (
        <AdminEmptyState message="No sales yet" />
      ) : (
        <AdminTable>
          <AdminTableHead>
            <th className="px-4 py-3">Name</th>
            <th className="px-4 py-3">Discount</th>
            <th className="px-4 py-3">Scope</th>
            <th className="px-4 py-3">Start</th>
            <th className="px-4 py-3">End</th>
            <th className="px-4 py-3">Status</th>
            <th className="px-4 py-3">Actions</th>
          </AdminTableHead>
          <AdminTableBody>
            {sales.map((s) => {
              const status = getSaleStatus(s);
              return (
                <tr key={s.id} className="admin-table-row">
                  <td className="px-4 py-3 font-medium">{s.name}</td>
                  <td className="px-4 py-3">
                    {s.discountType === "percentage"
                      ? `${s.discountValue}%`
                      : `Rs. ${s.discountValue}`}
                  </td>
                  <td className="px-4 py-3 capitalize">{s.appliesTo}</td>
                  <td className="px-4 py-3" style={{ color: "var(--admin-text-muted)" }}>{formatDateShort(s.startDate)}</td>
                  <td className="px-4 py-3" style={{ color: "var(--admin-text-muted)" }}>{formatDateShort(s.endDate)}</td>
                  <td className="px-4 py-3">
                    <StatusBadge status={status} variant="sale" />
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <Link href={`/admin/sales/${s.id}/edit`} className="text-sm text-primary hover:underline">
                        Edit
                      </Link>
                      <SaleActions id={s.id} />
                    </div>
                  </td>
                </tr>
              );
            })}
          </AdminTableBody>
        </AdminTable>
      )}
    </AdminLayout>
  );
}
