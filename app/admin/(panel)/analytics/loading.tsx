import { AdminChartSkeleton } from "@/components/admin/skeletons/AdminChartSkeleton";
import { AdminKpiSkeleton } from "@/components/admin/skeletons/AdminKpiSkeleton";
import { AdminTopBarSkeleton } from "@/components/admin/skeletons/AdminContentSkeleton";

export default function AnalyticsLoading() {
  return (
    <>
      <AdminTopBarSkeleton />
      <main className="flex-1 w-full space-y-6 p-6 md:p-8">
      <AdminKpiSkeleton cards={3} />
      <div className="grid gap-6 lg:grid-cols-2">
        <AdminChartSkeleton />
        <AdminChartSkeleton />
      </div>
      <AdminChartSkeleton height={320} />
      </main>
    </>
  );
}
