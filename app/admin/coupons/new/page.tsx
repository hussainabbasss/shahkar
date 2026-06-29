import type { Metadata } from "next";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { CouponForm } from "@/components/admin/CouponForm";
import { AdminEmptyState } from "@/components/admin/AdminUI";
import { requirePermission } from "@/lib/admin/guards";
import { isSupabaseConfigured } from "@/lib/supabase/config";

export const metadata: Metadata = {
  title: "New Coupon",
  robots: { index: false, follow: false },
};

export default async function NewCouponPage() {
  const admin = await requirePermission("manage_coupons");

  if (!isSupabaseConfigured()) {
    return (
      <AdminLayout title="New Coupon" admin={admin}>
        <AdminEmptyState message="Supabase not configured." />
      </AdminLayout>
    );
  }

  return (
    <AdminLayout title="New Coupon" admin={admin}>
      <CouponForm />
    </AdminLayout>
  );
}
