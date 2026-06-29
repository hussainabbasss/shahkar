import type { Metadata } from "next";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { DashboardView } from "@/components/admin/DashboardView";
import { StaffCommissionDashboardView } from "@/components/admin/StaffCommissionDashboardView";
import { AdminEmptyState } from "@/components/admin/AdminUI";
import { NewMessagesCard } from "@/components/admin/messages/NewMessagesCard";
import { getUnreadSummary } from "@/lib/db/admin/messages";
import { getCommissionSummaryForUser } from "@/lib/admin/commission";
import { requirePermission } from "@/lib/admin/guards";
import {
  getAllowedOrderStatuses,
  isSuperAdmin,
} from "@/lib/admin/permissions";
import { getDashboardKpiPayload } from "@/lib/db/admin/analytics";
import {
  countManualOrdersByStaff,
  getRecentOrdersAdmin,
} from "@/lib/db/admin/orders";
import { isSupabaseConfigured } from "@/lib/supabase/config";

export const metadata: Metadata = {
  title: "Dashboard",
};

export default async function AdminDashboardPage() {
  const admin = await requirePermission("view_dashboard");

  if (!isSupabaseConfigured()) {
    return (
      <AdminLayout title="Dashboard" admin={admin}>
        <AdminEmptyState message="Supabase is not configured. Add env vars from .env.example and run migrations." />
      </AdminLayout>
    );
  }

  const showStaffCommissionDashboard =
    !isSuperAdmin(admin) && admin.commissionEnabled;

  if (showStaffCommissionDashboard) {
    const [ordersCreated, commission] = await Promise.all([
      countManualOrdersByStaff(admin.id),
      getCommissionSummaryForUser(admin.id, admin.commissionConfig),
    ]);

    return (
      <AdminLayout title="Dashboard" admin={admin}>
        <StaffCommissionDashboardView
          adminName={admin.name}
          ordersCreated={ordersCreated}
          commission={commission}
        />
      </AdminLayout>
    );
  }

  const [kpi, recentOrders, unreadMessages] = await Promise.all([
    getDashboardKpiPayload(),
    getRecentOrdersAdmin(10),
    getUnreadSummary(admin.id),
  ]);

  return (
    <AdminLayout
      title="Dashboard"
      admin={admin}
      sidebarIssues={{
        issueCount: kpi.issueCount,
        lowStockCount: kpi.lowStockCount,
      }}
    >
      <DashboardView
        adminName={admin.name}
        kpi={kpi}
        recentOrders={recentOrders}
        allowedStatuses={getAllowedOrderStatuses(admin)}
        unreadMessages={unreadMessages.items}
      />
    </AdminLayout>
  );
}
