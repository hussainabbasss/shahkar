import type { Metadata } from "next";
import { Suspense } from "react";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { DashboardView } from "@/components/admin/DashboardView";
import { StaffCommissionDashboardView } from "@/components/admin/StaffCommissionDashboardView";
import { AdminEmptyState } from "@/components/admin/AdminUI";
import { DashboardSkeleton } from "@/components/admin/skeletons/DashboardSkeleton";
import { getCommissionSummaryForUser } from "@/lib/admin/commission";
import { requirePermission } from "@/lib/admin/guards";
import type { AdminUser } from "@/lib/admin/auth";
import {
  getAllowedOrderStatuses,
  hasPermission,
  isSuperAdmin,
} from "@/lib/admin/permissions";
import { getDashboardKpiPayload } from "@/lib/db/admin/analytics";
import {
  countManualOrdersByStaff,
  getRecentOrdersAdmin,
} from "@/lib/db/admin/orders";
import { getUnreadSummary } from "@/lib/db/admin/messages";
import { getMyActiveTickets } from "@/lib/db/admin/tickets";
import { listTicketDepartments } from "@/lib/db/admin/ticket-departments";
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

  return (
    <AdminLayout title="Dashboard" admin={admin}>
      <Suspense
        fallback={
          showStaffCommissionDashboard ? (
            <div className="mx-auto w-full max-w-[900px] space-y-6">
              <DashboardSkeleton />
            </div>
          ) : (
            <DashboardSkeleton />
          )
        }
      >
        {showStaffCommissionDashboard ? (
          <StaffDashboardData admin={admin} />
        ) : (
          <SuperAdminDashboardData admin={admin} />
        )}
      </Suspense>
    </AdminLayout>
  );
}

async function StaffDashboardData({ admin }: { admin: AdminUser }) {
  const [ordersCreated, commission] = await Promise.all([
    countManualOrdersByStaff(admin.id),
    getCommissionSummaryForUser(admin.id, admin.commissionConfig),
  ]);

  return (
    <StaffCommissionDashboardView
      adminName={admin.name}
      ordersCreated={ordersCreated}
      commission={commission}
    />
  );
}

async function SuperAdminDashboardData({ admin }: { admin: AdminUser }) {
  const [kpi, recentOrders, unreadMessages, myTickets, ticketDepartments] =
    await Promise.all([
      getDashboardKpiPayload(),
      getRecentOrdersAdmin(10),
      getUnreadSummary(admin.id),
      hasPermission(admin, "view_tickets")
        ? getMyActiveTickets(admin.id)
        : Promise.resolve([]),
      hasPermission(admin, "view_tickets")
        ? listTicketDepartments()
        : Promise.resolve([]),
    ]);

  return (
    <DashboardView
      adminName={admin.name}
      kpi={kpi}
      recentOrders={recentOrders}
      allowedStatuses={getAllowedOrderStatuses(admin)}
      unreadMessages={unreadMessages.items}
      myTickets={myTickets}
      ticketDepartments={ticketDepartments}
      showMyTickets={hasPermission(admin, "view_tickets")}
    />
  );
}
