import { AdminKpiSkeleton } from "@/components/admin/skeletons/AdminKpiSkeleton";
import { AdminTableSkeleton } from "@/components/admin/skeletons/AdminTableSkeleton";

export function DashboardSkeleton() {
  return (
    <div className="mx-auto w-full max-w-[1400px] space-y-8">
      <AdminKpiSkeleton cards={4} />
      <AdminKpiSkeleton cards={3} />
      <AdminTableSkeleton columns={6} rows={6} />
    </div>
  );
}
