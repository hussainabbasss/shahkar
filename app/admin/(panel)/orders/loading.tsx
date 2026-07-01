import { AdminTableSkeleton } from "@/components/admin/skeletons/AdminTableSkeleton";
import { AdminTopBarSkeleton } from "@/components/admin/skeletons/AdminContentSkeleton";
import { AdminSkeletonBlock } from "@/components/admin/skeletons/AdminSkeletonPrimitives";

export default function OrdersLoading() {
  return (
    <>
      <AdminTopBarSkeleton />
      <main className="flex-1 w-full space-y-6 p-6 md:p-8">
      <div className="flex flex-wrap gap-3">
        <AdminSkeletonBlock className="h-10 w-64" />
        <AdminSkeletonBlock className="h-10 w-36" />
        <AdminSkeletonBlock className="h-10 w-36" />
      </div>
      <AdminTableSkeleton columns={9} />
      </main>
    </>
  );
}
