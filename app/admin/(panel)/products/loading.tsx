import { AdminTableSkeleton } from "@/components/admin/skeletons/AdminTableSkeleton";
import { AdminTopBarSkeleton } from "@/components/admin/skeletons/AdminContentSkeleton";

export default function ProductsLoading() {
  return (
    <>
      <AdminTopBarSkeleton />
      <main className="flex-1 w-full p-6 md:p-8">
        <AdminTableSkeleton columns={6} />
      </main>
    </>
  );
}
