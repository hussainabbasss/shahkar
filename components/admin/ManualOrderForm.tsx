"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { createManualOrderAction } from "@/app/actions/admin/orders";
import {
  AdminField,
  AdminFormSection,
  AdminPrimaryButton,
  adminInputClass,
} from "@/components/admin/AdminUI";
import { useToast } from "@/components/admin/ToastProvider";
import { DELIVERY_FEE } from "@/lib/constants";
import { formatCurrency } from "@/lib/admin/utils";
import type { OrderStatus } from "@/lib/types";

type ProductOption = {
  id: string;
  name: string;
  slug: string;
  stock: number;
  originalPrice: number;
  salePrice: number | null;
  image: string;
};

type ManualOrderFormProps = {
  products: ProductOption[];
  canMarkDelivered: boolean;
  allowedStatuses: OrderStatus[];
};

type LineItem = {
  productId: string;
  quantity: number;
};

export function ManualOrderForm({
  products,
  canMarkDelivered,
  allowedStatuses,
}: ManualOrderFormProps) {
  const router = useRouter();
  const { showToast } = useToast();
  const [loading, setLoading] = useState(false);
  const [lines, setLines] = useState<LineItem[]>([]);
  const [selectedProductId, setSelectedProductId] = useState("");
  const [deliveryFee, setDeliveryFee] = useState(DELIVERY_FEE);

  const productMap = useMemo(
    () => new Map(products.map((p) => [p.id, p])),
    [products],
  );

  const subtotal = lines.reduce((sum, line) => {
    const product = productMap.get(line.productId);
    if (!product) return sum;
    const price = product.salePrice ?? product.originalPrice;
    return sum + price * line.quantity;
  }, 0);

  const total = subtotal + deliveryFee;

  function addLine() {
    if (!selectedProductId) return;
    const existing = lines.find((l) => l.productId === selectedProductId);
    if (existing) {
      setLines(
        lines.map((l) =>
          l.productId === selectedProductId
            ? { ...l, quantity: l.quantity + 1 }
            : l,
        ),
      );
    } else {
      setLines([...lines, { productId: selectedProductId, quantity: 1 }]);
    }
    setSelectedProductId("");
  }

  function updateQty(productId: string, quantity: number) {
    if (quantity < 1) {
      setLines(lines.filter((l) => l.productId !== productId));
      return;
    }
    setLines(
      lines.map((l) => (l.productId === productId ? { ...l, quantity } : l)),
    );
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    const form = e.currentTarget;
    const formData = new FormData(form);

    const result = await createManualOrderAction({
      customerName: String(formData.get("customerName")),
      customerPhone: String(formData.get("customerPhone")),
      city: String(formData.get("city")),
      address: String(formData.get("address")),
      instructions: String(formData.get("instructions") ?? ""),
      couponCode: String(formData.get("couponCode") ?? ""),
      status: String(formData.get("status") ?? "pending") as OrderStatus,
      deliveryFee,
      items: lines.map((l) => ({
        productId: l.productId,
        quantity: l.quantity,
      })),
    });

    setLoading(false);
    if (result.success && result.orderNumber) {
      showToast("Order created");
      router.push(`/admin/orders/${result.orderNumber}`);
    } else if (!result.success) {
      showToast(result.error ?? "Failed to create order", "error");
    }
  }

  return (
    <form onSubmit={handleSubmit} className="mx-auto max-w-3xl space-y-6">
      <AdminFormSection title="Customer">
        <div className="grid gap-4 sm:grid-cols-2">
          <AdminField label="Name">
            <input name="customerName" required className={adminInputClass} />
          </AdminField>
          <AdminField label="Phone">
            <input name="customerPhone" required className={adminInputClass} placeholder="03XX-XXXXXXX" />
          </AdminField>
          <AdminField label="City">
            <input name="city" required className={adminInputClass} />
          </AdminField>
          <AdminField label="Address">
            <input name="address" required className={adminInputClass} />
          </AdminField>
        </div>
        <AdminField label="Instructions (optional)">
          <textarea name="instructions" rows={2} className={adminInputClass} />
        </AdminField>
      </AdminFormSection>

      <AdminFormSection title="Products">
        <div className="flex flex-wrap gap-2">
          <select
            value={selectedProductId}
            onChange={(e) => setSelectedProductId(e.target.value)}
            className={`${adminInputClass} min-w-[240px] flex-1`}
          >
            <option value="">Select product…</option>
            {products.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name} (stock: {p.stock})
              </option>
            ))}
          </select>
          <button
            type="button"
            onClick={addLine}
            className="rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-white"
          >
            Add
          </button>
        </div>

        {lines.length === 0 ? (
          <p className="text-sm" style={{ color: "var(--admin-text-muted)" }}>
            Add catalog products only — no custom line items.
          </p>
        ) : (
          <div className="divide-y" style={{ borderColor: "var(--admin-border)" }}>
            {lines.map((line) => {
              const product = productMap.get(line.productId)!;
              const price = product.salePrice ?? product.originalPrice;
              return (
                <div key={line.productId} className="flex items-center gap-3 py-3">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={product.image} alt="" className="h-10 w-10 rounded object-cover" />
                  <div className="flex-1">
                    <p className="font-medium">{product.name}</p>
                    <p className="text-xs" style={{ color: "var(--admin-text-muted)" }}>
                      {formatCurrency(price)} each
                    </p>
                  </div>
                  <input
                    type="number"
                    min={1}
                    max={product.stock}
                    value={line.quantity}
                    onChange={(e) =>
                      updateQty(line.productId, Number(e.target.value))
                    }
                    className={`${adminInputClass} w-20`}
                  />
                  <p className="w-24 text-right font-medium">
                    {formatCurrency(price * line.quantity)}
                  </p>
                </div>
              );
            })}
          </div>
        )}
      </AdminFormSection>

      <AdminFormSection title="Totals">
        <div className="grid gap-4 sm:grid-cols-2">
          <AdminField label="Coupon code (optional)">
            <input name="couponCode" className={adminInputClass} />
          </AdminField>
          <AdminField label="Delivery fee (Rs.)">
            <input
              type="number"
              min={0}
              value={deliveryFee}
              onChange={(e) => setDeliveryFee(Number(e.target.value))}
              className={adminInputClass}
            />
          </AdminField>
          <AdminField label="Initial status">
            <select name="status" defaultValue="pending" className={adminInputClass}>
              {allowedStatuses.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </AdminField>
        </div>
        <dl className="mt-4 space-y-1 text-sm">
          <div className="flex justify-between">
            <dt>Subtotal</dt>
            <dd>{formatCurrency(subtotal)}</dd>
          </div>
          <div className="flex justify-between">
            <dt>Delivery</dt>
            <dd>{formatCurrency(deliveryFee)}</dd>
          </div>
          <div className="flex justify-between border-t pt-2 text-base font-bold">
            <dt>Total</dt>
            <dd>{formatCurrency(total)}</dd>
          </div>
        </dl>
        {!canMarkDelivered && (
          <p className="mt-2 text-xs" style={{ color: "var(--admin-text-muted)" }}>
            You can set pending or confirmed. Delivered and returned require Super
            Admin approval on your account.
          </p>
        )}
      </AdminFormSection>

      <AdminPrimaryButton type="submit" disabled={loading || lines.length === 0}>
        {loading ? "Creating…" : "Create order"}
      </AdminPrimaryButton>
    </form>
  );
}
