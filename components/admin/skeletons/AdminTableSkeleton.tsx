import { AdminSkeletonBlock } from "@/components/admin/skeletons/AdminSkeletonPrimitives";

type AdminTableSkeletonProps = {
  columns?: number;
  rows?: number;
};

export function AdminTableSkeleton({
  columns = 8,
  rows = 10,
}: AdminTableSkeletonProps) {
  return (
    <div
      className="w-full overflow-hidden rounded-xl"
      style={{
        background: "var(--admin-surface)",
        border: "1px solid var(--admin-border)",
        boxShadow: "var(--admin-shadow-sm)",
      }}
    >
      <div
        className="flex gap-4 px-4 py-3"
        style={{ borderBottom: "1px solid var(--admin-border)" }}
      >
        {Array.from({ length: columns }).map((_, i) => (
          <AdminSkeletonBlock key={i} className="h-4 flex-1" />
        ))}
      </div>
      <div className="divide-y" style={{ borderColor: "var(--admin-border)" }}>
        {Array.from({ length: rows }).map((_, row) => (
          <div key={row} className="flex gap-4 px-4 py-3">
            {Array.from({ length: columns }).map((_, col) => (
              <AdminSkeletonBlock
                key={col}
                className={`h-4 flex-1 ${col === 0 ? "max-w-[120px]" : ""}`}
              />
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}
