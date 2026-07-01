import { AdminSkeletonBlock } from "@/components/admin/skeletons/AdminSkeletonPrimitives";

export function AdminChartSkeleton({ height = 280 }: { height?: number }) {
  return (
    <div
      className="rounded-xl p-5"
      style={{
        background: "var(--admin-surface)",
        border: "1px solid var(--admin-border)",
        boxShadow: "var(--admin-shadow-sm)",
      }}
    >
      <AdminSkeletonBlock className="mb-4 h-5 w-40" />
      <div className="skeleton-shimmer w-full rounded-lg" style={{ height }} />
    </div>
  );
}
