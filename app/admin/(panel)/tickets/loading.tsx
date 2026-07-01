import { AdminSkeletonBlock } from "@/components/admin/skeletons/AdminSkeletonPrimitives";
import { AdminTopBarSkeleton } from "@/components/admin/skeletons/AdminContentSkeleton";

export default function TicketsLoading() {
  return (
    <>
      <AdminTopBarSkeleton />
      <main className="flex-1 w-full space-y-6 p-6 md:p-8">
      <div className="flex flex-wrap gap-2">
        {Array.from({ length: 4 }).map((_, i) => (
          <AdminSkeletonBlock key={i} className="h-9 w-24 rounded-full" />
        ))}
      </div>
      <div className="grid gap-4 md:grid-cols-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <AdminSkeletonBlock key={i} className="h-[420px] rounded-xl" />
        ))}
      </div>
      </main>
    </>
  );
}
