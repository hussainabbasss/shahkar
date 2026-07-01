import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { ProductForm } from "@/components/admin/ProductForm";
import { AdminEmptyState } from "@/components/admin/AdminUI";
import { requirePermission } from "@/lib/admin/guards";
import {
  getAdminCategories,
  getProductByIdAdmin,
} from "@/lib/db/admin/products";
import { isSupabaseConfigured } from "@/lib/supabase/config";

export const metadata: Metadata = {
  title: "Edit Product",
  robots: { index: false, follow: false },
};

export default async function EditProductPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const admin = await requirePermission("manage_products");
  const { id } = await params;

  if (!isSupabaseConfigured()) {
    return (
      <AdminLayout title="Edit Product" admin={admin}>
        <AdminEmptyState message="Supabase not configured." />
      </AdminLayout>
    );
  }

  const [product, categories] = await Promise.all([
    getProductByIdAdmin(id),
    getAdminCategories(),
  ]);

  if (!product) notFound();

  return (
    <AdminLayout title={`Edit: ${product.name}`} admin={admin}>
      <ProductForm product={product} categories={categories} />
    </AdminLayout>
  );
}
