import type { Metadata } from "next";
import Link from "next/link";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { DeleteProductButton } from "@/components/admin/DeleteProductButton";
import {
  AdminEmptyState,
  AdminPrimaryButton,
  AdminTable,
  AdminTableBody,
  AdminTableHead,
  StatusBadge,
} from "@/components/admin/AdminUI";
import { requirePermission } from "@/lib/admin/guards";
import { formatCurrency } from "@/lib/admin/utils";
import { listAllProductsAdmin } from "@/lib/db/admin/products";
import { isSupabaseConfigured } from "@/lib/supabase/config";

export const metadata: Metadata = {
  title: "Products",
  robots: { index: false, follow: false },
};

export default async function AdminProductsPage() {
  const admin = await requirePermission("view_products");

  if (!isSupabaseConfigured()) {
    return (
      <AdminLayout title="Products" admin={admin}>
        <AdminEmptyState message="Supabase not configured." />
      </AdminLayout>
    );
  }

  const products = await listAllProductsAdmin();

  return (
    <AdminLayout
      title="Products"
      admin={admin}
      actions={<AdminPrimaryButton href="/admin/products/new">New Product</AdminPrimaryButton>}
    >
      {products.length === 0 ? (
        <AdminEmptyState message="No products yet. Create your first product." />
      ) : (
        <AdminTable>
          <AdminTableHead>
            <th className="px-4 py-3">Product</th>
            <th className="px-4 py-3">Price</th>
            <th className="px-4 py-3">Stock</th>
            <th className="px-4 py-3">Featured</th>
            <th className="px-4 py-3">Status</th>
            <th className="px-4 py-3">Actions</th>
          </AdminTableHead>
          <AdminTableBody>
            {products.map((p) => (
              <tr key={p.id} className="admin-table-row">
                <td className="px-4 py-3">
                  <div className="flex items-center gap-3">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={p.images[0] ?? "/products/placeholder.svg"}
                      alt=""
                      className="h-10 w-10 rounded object-cover"
                    />
                    <div>
                      <p className="font-medium">{p.name}</p>
                      <p className="text-xs" style={{ color: "var(--admin-text-muted)" }}>{p.category}</p>
                    </div>
                  </div>
                </td>
                <td className="px-4 py-3">
                  {p.salePrice ? (
                    <span>
                      <span style={{ color: "var(--admin-text-muted)" }} className="line-through">{formatCurrency(p.originalPrice)}</span>{" "}
                      {formatCurrency(p.salePrice)}
                    </span>
                  ) : (
                    formatCurrency(p.originalPrice)
                  )}
                </td>
                <td className="px-4 py-3">{p.stock}</td>
                <td className="px-4 py-3">{p.featured ? "✓" : "—"}</td>
                <td className="px-4 py-3">
                  <StatusBadge
                    status={p.active ? "active" : "draft"}
                    variant="product"
                  />
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-3">
                    <Link
                      href={`/admin/products/${p.id}/edit`}
                      className="text-sm text-primary hover:underline"
                    >
                      Edit
                    </Link>
                    <DeleteProductButton id={p.id} />
                  </div>
                </td>
              </tr>
            ))}
          </AdminTableBody>
        </AdminTable>
      )}
    </AdminLayout>
  );
}
