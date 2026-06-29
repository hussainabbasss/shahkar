import type { Metadata } from "next";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { SaleForm } from "@/components/admin/SaleForm";
import { AdminEmptyState } from "@/components/admin/AdminUI";
import { requirePermission } from "@/lib/admin/guards";
import { getAdminCategories, listAllProductsAdmin } from "@/lib/db/admin/products";
import { isSupabaseConfigured } from "@/lib/supabase/config";

export const metadata: Metadata = {
  title: "New Sale",
  robots: { index: false, follow: false },
};

export default async function NewSalePage() {
  const admin = await requirePermission("manage_sales");

  if (!isSupabaseConfigured()) {
    return (
      <AdminLayout title="New Sale" admin={admin}>
        <AdminEmptyState message="Supabase not configured." />
      </AdminLayout>
    );
  }

  const [products, categories] = await Promise.all([
    listAllProductsAdmin(),
    getAdminCategories(),
  ]);

  return (
    <AdminLayout title="New Sale" admin={admin}>
      <SaleForm products={products} categories={categories} />
    </AdminLayout>
  );
}
