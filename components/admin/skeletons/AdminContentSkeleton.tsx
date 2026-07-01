import { AdminSkeletonBlock } from "@/components/admin/skeletons/AdminSkeletonPrimitives";
import { AdminTableSkeleton } from "@/components/admin/skeletons/AdminTableSkeleton";

export function AdminTopBarSkeleton() {
  return (
    <header
      className="flex h-16 w-full items-center justify-between gap-4 px-6"
      style={{ borderBottom: "1px solid var(--admin-border)" }}
    >
      <AdminSkeletonBlock className="h-6 w-36" />
      <div className="flex items-center gap-3">
        <AdminSkeletonBlock className="hidden h-9 w-48 sm:block" />
        <AdminSkeletonBlock className="h-8 w-8 rounded-full" />
      </div>
    </header>
  );
}

export function AdminContentSkeleton() {
  return (
    <main className="flex-1 w-full space-y-6 p-6 md:p-8">
      <div className="flex flex-wrap gap-3">
        <AdminSkeletonBlock className="h-10 w-64" />
        <AdminSkeletonBlock className="h-10 w-36" />
      </div>
      <AdminTableSkeleton />
    </main>
  );
}

export function AdminPageSkeleton() {
  return (
    <>
      <AdminTopBarSkeleton />
      <AdminContentSkeleton />
    </>
  );
}
