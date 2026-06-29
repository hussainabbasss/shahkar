import type { Metadata } from "next";
import Link from "next/link";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { CouponActions } from "@/components/admin/CouponActions";
import {
  AdminEmptyState,
  AdminPrimaryButton,
  AdminTable,
  AdminTableBody,
  AdminTableHead,
  StatusBadge,
} from "@/components/admin/AdminUI";
import { requirePermission } from "@/lib/admin/guards";
import { formatDateShort, getCouponStatus } from "@/lib/admin/utils";
import { listCouponsAdmin } from "@/lib/db/admin/coupons";
import { isSupabaseConfigured } from "@/lib/supabase/config";

export const metadata: Metadata = {
  title: "Coupons",
  robots: { index: false, follow: false },
};

export default async function AdminCouponsPage() {
  const admin = await requirePermission("view_coupons");

  if (!isSupabaseConfigured()) {
    return (
      <AdminLayout title="Coupons" admin={admin}>
        <AdminEmptyState message="Supabase not configured." />
      </AdminLayout>
    );
  }

  const coupons = await listCouponsAdmin();

  return (
    <AdminLayout
      title="Coupons"
      admin={admin}
      actions={<AdminPrimaryButton href="/admin/coupons/new">Create Coupon</AdminPrimaryButton>}
    >
      {coupons.length === 0 ? (
        <AdminEmptyState message="No coupons yet" />
      ) : (
        <AdminTable>
          <AdminTableHead>
            <th className="px-4 py-3">Code</th>
            <th className="px-4 py-3">Discount</th>
            <th className="px-4 py-3">Uses</th>
            <th className="px-4 py-3">Expiry</th>
            <th className="px-4 py-3">Status</th>
            <th className="px-4 py-3">Actions</th>
          </AdminTableHead>
          <AdminTableBody>
            {coupons.map((c) => {
              const status = getCouponStatus(c);
              return (
                <tr key={c.id} className="admin-table-row">
                  <td className="px-4 py-3 font-mono font-medium">{c.code}</td>
                  <td className="px-4 py-3">
                    {c.discountType === "percentage"
                      ? `${c.discountValue}%`
                      : `Rs. ${c.discountValue}`}
                  </td>
                  <td className="px-4 py-3">
                    {c.usesCount}
                    {c.usageLimit !== null ? ` / ${c.usageLimit}` : ""}
                  </td>
                  <td className="px-4 py-3" style={{ color: "var(--admin-text-muted)" }}>
                    {c.expiryDate ? formatDateShort(c.expiryDate) : "—"}
                  </td>
                  <td className="px-4 py-3">
                    <StatusBadge status={status} variant="coupon" />
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <Link href={`/admin/coupons/${c.id}/edit`} className="text-sm text-primary hover:underline">
                        Edit
                      </Link>
                      <CouponActions id={c.id} active={c.active} />
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
