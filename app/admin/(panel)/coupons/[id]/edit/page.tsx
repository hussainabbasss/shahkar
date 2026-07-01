import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { CouponForm } from "@/components/admin/CouponForm";
import { AdminEmptyState } from "@/components/admin/AdminUI";
import { requirePermission } from "@/lib/admin/guards";
import { getCouponByIdAdmin } from "@/lib/db/admin/coupons";
import { isSupabaseConfigured } from "@/lib/supabase/config";

export const metadata: Metadata = {
  title: "Edit Coupon",
  robots: { index: false, follow: false },
};

export default async function EditCouponPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const admin = await requirePermission("manage_coupons");
  const { id } = await params;

  if (!isSupabaseConfigured()) {
    return (
      <AdminLayout title="Edit Coupon" admin={admin}>
        <AdminEmptyState message="Supabase not configured." />
      </AdminLayout>
    );
  }

  const coupon = await getCouponByIdAdmin(id);
  if (!coupon) notFound();

  return (
    <AdminLayout title={`Edit: ${coupon.code}`} admin={admin}>
      <CouponForm coupon={coupon} />
    </AdminLayout>
  );
}
