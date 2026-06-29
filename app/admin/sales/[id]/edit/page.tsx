import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { SaleForm } from "@/components/admin/SaleForm";
import { AdminEmptyState } from "@/components/admin/AdminUI";
import { requirePermission } from "@/lib/admin/guards";
import { getAdminCategories, listAllProductsAdmin } from "@/lib/db/admin/products";
import { getSaleByIdAdmin } from "@/lib/db/admin/sales";
import { isSupabaseConfigured } from "@/lib/supabase/config";

export const metadata: Metadata = {
  title: "Edit Sale",
  robots: { index: false, follow: false },
};

export default async function EditSalePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const admin = await requirePermission("manage_sales");
  const { id } = await params;

  if (!isSupabaseConfigured()) {
    return (
      <AdminLayout title="Edit Sale" admin={admin}>
        <AdminEmptyState message="Supabase not configured." />
      </AdminLayout>
    );
  }

  const [sale, products, categories] = await Promise.all([
    getSaleByIdAdmin(id),
    listAllProductsAdmin(),
    getAdminCategories(),
  ]);

  if (!sale) notFound();

  return (
    <AdminLayout title={`Edit: ${sale.name}`} admin={admin}>
      <SaleForm sale={sale} products={products} categories={categories} />
    </AdminLayout>
  );
}
