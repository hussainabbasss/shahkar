"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { updateOrderAction } from "@/app/actions/admin/orders";
import { useToast } from "@/components/admin/ToastProvider";
import {
  AdminField,
  AdminFormSection,
  AdminPrimaryButton,
  StatusBadge,
  adminInputClass,
} from "@/components/admin/AdminUI";
import { ORDER_STATUSES, formatCurrency, formatDate } from "@/lib/admin/utils";
import type { OrderStatus, OrderWithCreator } from "@/lib/types";

type OrderDetailFormProps = {
  order: OrderWithCreator;
  allowedStatuses: OrderStatus[];
  canEdit: boolean;
};

export function OrderDetailForm({
  order,
  allowedStatuses,
  canEdit,
}: OrderDetailFormProps) {
  const router = useRouter();
  const { showToast } = useToast();
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    const result = await updateOrderAction(
      order.orderNumber,
      new FormData(e.currentTarget),
    );
    setLoading(false);
    if (result.success) {
      showToast("Order updated");
      router.refresh();
    } else {
      showToast(result.error ?? "Update failed", "error");
    }
  }

  const statusOptions = ORDER_STATUSES.filter(
    (s) => allowedStatuses.includes(s) || s === order.status,
  );

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-heading">{order.orderNumber}</h2>
          <p className="text-sm text-muted">{formatDate(order.createdAt)}</p>
          <div className="mt-2 flex flex-wrap items-center gap-2 text-sm">
            <StatusBadge
              status={order.source === "manual" ? "active" : "draft"}
              variant="product"
            />
            <span className="capitalize text-muted">
              {order.source === "manual" ? "Manual order" : "Website order"}
            </span>
            {order.source === "manual" && (
              <span className="text-muted">
                · Created by {order.creatorName ?? "Staff"}
              </span>
            )}
          </div>
        </div>
        <StatusBadge status={order.status} />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <AdminFormSection title="Customer">
          <dl className="space-y-2 text-sm">
            <div><dt className="text-muted">Name</dt><dd className="font-medium">{order.customerName}</dd></div>
            <div><dt className="text-muted">Phone</dt><dd className="font-medium">{order.customerPhone}</dd></div>
            <div><dt className="text-muted">City</dt><dd className="font-medium">{order.city}</dd></div>
            <div><dt className="text-muted">Address</dt><dd className="font-medium">{order.address}</dd></div>
            {order.instructions && (
              <div><dt className="text-muted">Instructions</dt><dd>{order.instructions}</dd></div>
            )}
          </dl>
        </AdminFormSection>

        <AdminFormSection title="Amount Breakdown">
          <dl className="space-y-2 text-sm">
            <div className="flex justify-between"><dt>Subtotal</dt><dd>{formatCurrency(order.subtotal)}</dd></div>
            {order.discount > 0 && (
              <div className="flex justify-between text-primary">
                <dt>Discount {order.couponCode && `(${order.couponCode})`}</dt>
                <dd>-{formatCurrency(order.discount)}</dd>
              </div>
            )}
            <div className="flex justify-between"><dt>Delivery</dt><dd>{formatCurrency(order.deliveryFee)}</dd></div>
            <div className="flex justify-between border-t border-border pt-2 font-bold">
              <dt>Total</dt><dd>{formatCurrency(order.total)}</dd>
            </div>
          </dl>
        </AdminFormSection>
      </div>

      <AdminFormSection title="Products Ordered">
        <div className="divide-y divide-border">
          {order.products.map((p, i) => (
            <div key={i} className="flex items-center gap-3 py-3">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={p.image} alt="" className="h-12 w-12 rounded object-cover" />
              <div className="flex-1">
                <p className="font-medium">{p.name}</p>
                <p className="text-xs text-muted">Qty: {p.quantity}</p>
              </div>
              <p className="font-medium">{formatCurrency(p.price * p.quantity)}</p>
            </div>
          ))}
        </div>
      </AdminFormSection>

      {canEdit ? (
        <form onSubmit={handleSubmit}>
          <AdminFormSection title="Admin Actions">
            <AdminField label="Status">
              <select
                name="status"
                defaultValue={order.status}
                className={adminInputClass}
              >
                {statusOptions.map((s) => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
            </AdminField>
            <AdminField label="PostEx Tracking Number">
              <input
                name="postexTracking"
                defaultValue={order.postexTracking ?? ""}
                className={adminInputClass}
                placeholder="Manual entry"
              />
            </AdminField>
            <AdminField label="Internal Notes">
              <textarea
                name="notes"
                rows={3}
                defaultValue={order.notes ?? ""}
                className={adminInputClass}
              />
            </AdminField>
            <div className="pt-2">
              <AdminPrimaryButton type="submit" disabled={loading}>
                {loading ? "Saving…" : "Save Changes"}
              </AdminPrimaryButton>
            </div>
          </AdminFormSection>
        </form>
      ) : (
        <AdminFormSection title="Admin Actions">
          <p className="text-sm text-muted">Read-only — you do not have permission to update this order.</p>
        </AdminFormSection>
      )}
    </div>
  );
}
