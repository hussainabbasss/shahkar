"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import {
  createSaleAction,
  updateSaleAction,
} from "@/app/actions/admin/sales";
import { useToast } from "@/components/admin/ToastProvider";
import {
  AdminField,
  AdminFormSection,
  AdminPrimaryButton,
  adminInputClass,
} from "@/components/admin/AdminUI";
import type { Product, Sale } from "@/lib/types";

type SaleFormProps = {
  sale?: Sale;
  products: Product[];
  categories: string[];
};

function toLocalDatetime(iso?: string): string {
  if (!iso) return "";
  const d = new Date(iso);
  const offset = d.getTimezoneOffset();
  const local = new Date(d.getTime() - offset * 60000);
  return local.toISOString().slice(0, 16);
}

export function SaleForm({ sale, products, categories }: SaleFormProps) {
  const router = useRouter();
  const { showToast } = useToast();
  const [appliesTo, setAppliesTo] = useState<Sale["appliesTo"]>(
    sale?.appliesTo ?? "all",
  );
  const [selectedProducts, setSelectedProducts] = useState<string[]>(
    sale?.productIds ?? [],
  );
  const [selectedCategories, setSelectedCategories] = useState<string[]>(
    sale?.categoryNames ?? [],
  );
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    const fd = new FormData(e.currentTarget);
    fd.set("productIds", selectedProducts.join(","));
    fd.set("categoryNames", selectedCategories.join(","));

    const result = sale
      ? await updateSaleAction(sale.id, fd)
      : await createSaleAction(fd);

    setLoading(false);
    if (result.success) {
      showToast(sale ? "Sale updated" : "Sale created");
      router.push("/admin/sales");
      router.refresh();
    } else {
      showToast(result.error, "error");
    }
  }

  return (
    <form onSubmit={handleSubmit} className="mx-auto max-w-3xl space-y-6">
      <AdminFormSection title="Sale Details">
        <AdminField label="Sale Name">
          <input
            name="name"
            required
            defaultValue={sale?.name ?? ""}
            className={adminInputClass}
            placeholder="Eid Sale"
          />
        </AdminField>
        <div className="grid gap-4 sm:grid-cols-2">
          <AdminField label="Discount Type">
            <select
              name="discountType"
              defaultValue={sale?.discountType ?? "percentage"}
              className={adminInputClass}
            >
              <option value="percentage">Percentage (%)</option>
              <option value="fixed">Fixed Amount (Rs.)</option>
            </select>
          </AdminField>
          <AdminField label="Discount Value">
            <input
              name="discountValue"
              type="number"
              required
              min={0}
              defaultValue={sale?.discountValue ?? ""}
              className={adminInputClass}
            />
          </AdminField>
        </div>
        <AdminField label="Display Coupon Code (optional)">
          <input
            name="couponCode"
            defaultValue={sale?.couponCode ?? ""}
            className={adminInputClass}
            placeholder="EID20"
          />
        </AdminField>
      </AdminFormSection>

      <AdminFormSection title="Scope">
        <AdminField label="Applies To">
          <select
            name="appliesTo"
            value={appliesTo}
            onChange={(e) =>
              setAppliesTo(e.target.value as Sale["appliesTo"])
            }
            className={adminInputClass}
          >
            <option value="all">All products</option>
            <option value="products">Specific products</option>
            <option value="categories">Specific categories</option>
          </select>
        </AdminField>
        {appliesTo === "products" && (
          <div className="max-h-48 space-y-1 overflow-y-auto rounded-lg border border-border p-3">
            {products.map((p) => (
              <label key={p.id} className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={selectedProducts.includes(p.id)}
                  onChange={(e) => {
                    if (e.target.checked)
                      setSelectedProducts([...selectedProducts, p.id]);
                    else
                      setSelectedProducts(
                        selectedProducts.filter((id) => id !== p.id),
                      );
                  }}
                />
                {p.name}
              </label>
            ))}
          </div>
        )}
        {appliesTo === "categories" && (
          <div className="space-y-1">
            {categories.map((c) => (
              <label key={c} className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={selectedCategories.includes(c)}
                  onChange={(e) => {
                    if (e.target.checked)
                      setSelectedCategories([...selectedCategories, c]);
                    else
                      setSelectedCategories(
                        selectedCategories.filter((x) => x !== c),
                      );
                  }}
                />
                {c}
              </label>
            ))}
          </div>
        )}
      </AdminFormSection>

      <AdminFormSection title="Schedule">
        <div className="grid gap-4 sm:grid-cols-2">
          <AdminField label="Start Date & Time">
            <input
              name="startDate"
              type="datetime-local"
              required
              defaultValue={toLocalDatetime(sale?.startDate)}
              className={adminInputClass}
            />
          </AdminField>
          <AdminField label="End Date & Time">
            <input
              name="endDate"
              type="datetime-local"
              required
              defaultValue={toLocalDatetime(sale?.endDate)}
              className={adminInputClass}
            />
          </AdminField>
        </div>
        <label className="flex items-center gap-2 text-sm">
          <input
            name="active"
            type="checkbox"
            defaultChecked={sale?.active ?? true}
            className="rounded border-border"
          />
          Active
        </label>
      </AdminFormSection>

      <div className="flex gap-3">
        <AdminPrimaryButton type="submit" disabled={loading}>
          {loading ? "Saving…" : sale ? "Save Changes" : "Create Sale"}
        </AdminPrimaryButton>
        <a href="/admin/sales" className="rounded-lg border border-border px-4 py-2 text-sm">
          Cancel
        </a>
      </div>
    </form>
  );
}
