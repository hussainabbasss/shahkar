import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { AdminEmptyState } from "@/components/admin/AdminUI";
import { StaffAnalyticsView } from "@/components/admin/StaffAnalyticsView";
import { getCommissionSummaryForUser } from "@/lib/admin/commission";
import { isSuperAdmin } from "@/lib/admin/permissions";
import { requirePermission } from "@/lib/admin/guards";
import { getAnalyticsData } from "@/lib/db/admin/analytics";
import { listOrdersAdmin } from "@/lib/db/admin/orders";
import { getTeamMember } from "@/lib/db/admin/team";
import { isSupabaseConfigured } from "@/lib/supabase/config";

export const metadata: Metadata = {
  title: "Staff Analytics",
  robots: { index: false, follow: false },
};

export default async function StaffAnalyticsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const viewer = await requirePermission("view_analytics");
  const { id } = await params;

  if (!isSuperAdmin(viewer) && viewer.id !== id) {
    notFound();
  }

  if (!isSupabaseConfigured()) {
    return (
      <AdminLayout title="Staff Analytics" admin={viewer}>
        <AdminEmptyState message="Supabase not configured." />
      </AdminLayout>
    );
  }

  const member = await getTeamMember(id);
  if (!member || member.role === "admin") notFound();

  const [{ orders }, analytics, commission] = await Promise.all([
    listOrdersAdmin({
      createdBy: id,
      source: "manual",
      limit: 100,
    }),
    getAnalyticsData("daily", { createdBy: id, manualOnly: true }),
    getCommissionSummaryForUser(id, member.commissionConfig),
  ]);

  return (
    <AdminLayout title={`Analytics: ${member.name}`} admin={viewer}>
      <StaffAnalyticsView
        memberName={member.name}
        analytics={analytics}
        orders={orders}
        commission={commission}
        showCommission={member.commissionEnabled}
      />
    </AdminLayout>
  );
}
