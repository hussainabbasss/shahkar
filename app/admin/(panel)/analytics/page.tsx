import type { Metadata } from "next";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { AnalyticsDashboard } from "@/components/admin/AnalyticsDashboard";
import { StaffAnalyticsView } from "@/components/admin/StaffAnalyticsView";
import { AdminEmptyState } from "@/components/admin/AdminUI";
import { getCommissionSummaryForUser } from "@/lib/admin/commission";
import { getAnalyticsScope } from "@/lib/admin/permissions";
import { requirePermission } from "@/lib/admin/guards";
import { getAnalyticsData } from "@/lib/db/admin/analytics";
import { listOrdersAdmin } from "@/lib/db/admin/orders";
import { isSupabaseConfigured } from "@/lib/supabase/config";

export const metadata: Metadata = {
  title: "Analytics",
  robots: { index: false, follow: false },
};

export default async function AdminAnalyticsPage() {
  const admin = await requirePermission("view_analytics");
  const scope = getAnalyticsScope(admin);

  if (!isSupabaseConfigured()) {
    return (
      <AdminLayout title="Analytics" admin={admin}>
        <AdminEmptyState message="Supabase not configured." />
      </AdminLayout>
    );
  }

  if (scope === "own") {
    const [{ orders }, analytics, commission] = await Promise.all([
      listOrdersAdmin({
        createdBy: admin.id,
        source: "manual",
        limit: 100,
      }),
      getAnalyticsData("daily", { createdBy: admin.id, manualOnly: true }),
      getCommissionSummaryForUser(admin.id, admin.commissionConfig),
    ]);

    return (
      <AdminLayout title="My Analytics" admin={admin}>
        <StaffAnalyticsView
          memberName={admin.name}
          analytics={analytics}
          orders={orders}
          commission={commission}
          showCommission={admin.commissionEnabled}
        />
      </AdminLayout>
    );
  }

  const data = await getAnalyticsData("daily");

  return (
    <AdminLayout title="Analytics" admin={admin}>
      <AnalyticsDashboard data={data} />
    </AdminLayout>
  );
}
