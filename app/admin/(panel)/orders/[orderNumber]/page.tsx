import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { OrderDetailForm } from "@/components/admin/OrderDetailForm";
import { AdminEmptyState } from "@/components/admin/AdminUI";
import {
  getAllowedOrderStatuses,
  hasPermission,
} from "@/lib/admin/permissions";
import { requirePermission } from "@/lib/admin/guards";
import { getOrderByNumberAdmin } from "@/lib/db/admin/orders";
import { isSupabaseConfigured } from "@/lib/supabase/config";

export const metadata: Metadata = {
  title: "Order Detail",
  robots: { index: false, follow: false },
};

export default async function AdminOrderDetailPage({
  params,
}: {
  params: Promise<{ orderNumber: string }>;
}) {
  const admin = await requirePermission("view_orders");
  const { orderNumber } = await params;

  if (!isSupabaseConfigured()) {
    return (
      <AdminLayout title="Order Detail" admin={admin}>
        <AdminEmptyState message="Supabase not configured." />
      </AdminLayout>
    );
  }

  const order = await getOrderByNumberAdmin(orderNumber);
  if (!order) notFound();

  const allowedStatuses = getAllowedOrderStatuses(admin);
  const canEdit =
    hasPermission(admin, "create_orders") ||
    hasPermission(admin, "update_order_status") ||
    hasPermission(admin, "mark_order_delivered");

  return (
    <AdminLayout title={order.orderNumber} admin={admin}>
      <OrderDetailForm
        order={order}
        allowedStatuses={allowedStatuses}
        canEdit={canEdit}
      />
    </AdminLayout>
  );
}
