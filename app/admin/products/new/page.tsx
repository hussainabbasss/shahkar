import type { Metadata } from "next";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { ProductForm } from "@/components/admin/ProductForm";
import { AdminEmptyState } from "@/components/admin/AdminUI";
import { requirePermission } from "@/lib/admin/guards";
import { getAdminCategories } from "@/lib/db/admin/products";
import { isSupabaseConfigured } from "@/lib/supabase/config";

export const metadata: Metadata = {
  title: "New Product",
  robots: { index: false, follow: false },
};

export default async function NewProductPage() {
  const admin = await requirePermission("manage_products");

  if (!isSupabaseConfigured()) {
    return (
      <AdminLayout title="New Product" admin={admin}>
        <AdminEmptyState message="Supabase not configured." />
      </AdminLayout>
    );
  }

  const categories = await getAdminCategories();

  return (
    <AdminLayout title="New Product" admin={admin}>
      <ProductForm categories={categories} />
    </AdminLayout>
  );
}
