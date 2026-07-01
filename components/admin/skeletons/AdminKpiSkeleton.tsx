import { AdminSkeletonBlock } from "@/components/admin/skeletons/AdminSkeletonPrimitives";

export function AdminKpiSkeleton({ cards = 4 }: { cards?: number }) {
  return (
    <div className="grid w-full gap-4 sm:grid-cols-2 xl:grid-cols-4">
      {Array.from({ length: cards }).map((_, i) => (
        <div
          key={i}
          className="rounded-xl p-5"
          style={{
            background: "var(--admin-surface)",
            border: "1px solid var(--admin-border)",
            boxShadow: "var(--admin-shadow-sm)",
          }}
        >
          <AdminSkeletonBlock className="mb-3 h-4 w-24" />
          <AdminSkeletonBlock className="mb-2 h-8 w-32" />
          <AdminSkeletonBlock className="h-3 w-20" />
        </div>
      ))}
    </div>
  );
}
