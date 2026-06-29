import type { Metadata } from "next";
import Link from "next/link";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { ManualOrderForm } from "@/components/admin/ManualOrderForm";
import { AdminEmptyState } from "@/components/admin/AdminUI";
import { getManualOrderProductsAction } from "@/app/actions/admin/orders";
import {
  getAllowedOrderStatuses,
  hasPermission,
} from "@/lib/admin/permissions";
import { requirePermission } from "@/lib/admin/guards";
import { isSupabaseConfigured } from "@/lib/supabase/config";

export const metadata: Metadata = {
  title: "New Order",
  robots: { index: false, follow: false },
};

export default async function NewManualOrderPage() {
  const admin = await requirePermission("create_orders");

  if (!isSupabaseConfigured()) {
    return (
      <AdminLayout title="New Order" admin={admin}>
        <AdminEmptyState message="Supabase not configured." />
      </AdminLayout>
    );
  }

  const products = await getManualOrderProductsAction();
  const allowedStatuses = getAllowedOrderStatuses(admin);

  return (
    <AdminLayout
      title="New Manual Order"
      admin={admin}
      actions={
        <Link
          href="/admin/orders"
          className="text-sm font-medium"
          style={{ color: "var(--admin-text-muted)" }}
        >
          ← Back to orders
        </Link>
      }
    >
      <ManualOrderForm
        products={products}
        canMarkDelivered={hasPermission(admin, "mark_order_delivered")}
        allowedStatuses={allowedStatuses}
      />
    </AdminLayout>
  );
}
