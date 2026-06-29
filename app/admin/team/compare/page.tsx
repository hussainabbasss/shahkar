import type { Metadata } from "next";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { AdminEmptyState } from "@/components/admin/AdminUI";
import { EmployeeComparisonTable } from "@/components/admin/EmployeeComparisonTable";
import { requireSuperAdmin } from "@/lib/admin/guards";
import { getEmployeeComparison } from "@/lib/db/admin/team";
import { isSupabaseConfigured } from "@/lib/supabase/config";

export const metadata: Metadata = {
  title: "Compare Employees",
  robots: { index: false, follow: false },
};

function getRangeDates(range: string): { start: Date; end: Date; label: string } {
  const now = new Date();
  const end = now;

  if (range === "week") {
    const start = new Date(now);
    const day = start.getDay();
    const diff = day === 0 ? 6 : day - 1;
    start.setDate(start.getDate() - diff);
    start.setHours(0, 0, 0, 0);
    return { start, end, label: "week" };
  }

  const start = new Date(now.getFullYear(), now.getMonth(), 1);
  return { start, end, label: "month" };
}

export default async function CompareEmployeesPage({
  searchParams,
}: {
  searchParams: Promise<{ range?: string }>;
}) {
  const admin = await requireSuperAdmin();
  const params = await searchParams;
  const range = params.range === "week" ? "week" : "month";

  if (!isSupabaseConfigured()) {
    return (
      <AdminLayout title="Compare Employees" admin={admin}>
        <AdminEmptyState message="Supabase not configured." />
      </AdminLayout>
    );
  }

  const { start, end } = getRangeDates(range);
  const rows = await getEmployeeComparison(start, end);

  return (
    <AdminLayout title="Compare Employees" admin={admin}>
      <p className="mb-4 text-sm" style={{ color: "var(--admin-text-muted)" }}>
        Manual orders inserted by staff — storefront orders excluded.
      </p>
      <EmployeeComparisonTable rows={rows} range={range} />
    </AdminLayout>
  );
}
