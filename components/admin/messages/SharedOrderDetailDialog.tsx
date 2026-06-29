"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import { X } from "lucide-react";
import { fetchSharedOrderAction } from "@/app/actions/admin/messages";
import { StatusBadge } from "@/components/admin/AdminUI";
import { formatPrice } from "@/lib/pricing";
import type { OrderEntitySnapshot } from "@/lib/admin/messages";

type SharedOrderDetailDialogProps = {
  snapshot: OrderEntitySnapshot;
  canViewOrders: boolean;
  onClose: () => void;
};

export function SharedOrderDetailDialog({
  snapshot,
  canViewOrders,
  onClose,
}: SharedOrderDetailDialogProps) {
  const [loading, setLoading] = useState(true);
  const [snapshotOnly, setSnapshotOnly] = useState(false);
  const [order, setOrder] = useState<Awaited<
    ReturnType<typeof fetchSharedOrderAction>
  >["order"]>(null);

  useEffect(() => {
    fetchSharedOrderAction(snapshot.id)
      .then((res) => {
        setOrder(res.order);
        setSnapshotOnly(res.snapshotOnly);
      })
      .finally(() => setLoading(false));
  }, [snapshot.id]);

  const data = order ?? null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: "rgba(0,0,0,0.5)" }}
      onClick={onClose}
    >
      <div
        className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-xl p-6"
        style={{
          background: "var(--admin-surface)",
          border: "1px solid var(--admin-border)",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-4 flex items-start justify-between">
          <h2
            className="text-lg font-bold"
            style={{ color: "var(--admin-text-heading)" }}
          >
            Order detail
          </h2>
          <button type="button" onClick={onClose} aria-label="Close">
            <X size={20} />
          </button>
        </div>

        {loading ? (
          <p style={{ color: "var(--admin-text-muted)" }}>Loading…</p>
        ) : (
          <>
            {snapshotOnly && (
              <p
                className="mb-3 rounded-lg p-3 text-sm"
                style={{
                  background: "color-mix(in srgb, var(--admin-accent) 10%, transparent)",
                  color: "var(--admin-text-muted)",
                }}
              >
                You need permission to view full details.
              </p>
            )}

            {!data && !snapshotOnly && (
              <p className="mb-3 text-sm" style={{ color: "var(--admin-text-muted)" }}>
                Order not found — showing snapshot.
              </p>
            )}

            <div className="space-y-2">
              <p className="text-lg font-bold" style={{ color: "var(--admin-text-heading)" }}>
                {data?.orderNumber ?? snapshot.orderNumber}
              </p>
              <StatusBadge status={data?.status ?? snapshot.status} variant="order" />
              <p className="text-sm" style={{ color: "var(--admin-text-muted)" }}>
                {data?.customerName ?? snapshot.customerName} ·{" "}
                {data?.customerPhone ?? snapshot.customerPhone}
              </p>
              {data?.city && (
                <p className="text-sm" style={{ color: "var(--admin-text-muted)" }}>
                  {data.city} — {data.address}
                </p>
              )}
            </div>

            {data?.products?.length ? (
              <div className="mt-4 space-y-2">
                <p className="text-xs font-semibold uppercase" style={{ color: "var(--admin-text-subtle)" }}>
                  Line items
                </p>
                {data.products.map((line) => (
                  <div key={line.product_id} className="flex gap-3 text-sm">
                    {line.image && (
                      <div className="relative h-10 w-10 shrink-0 overflow-hidden rounded">
                        <Image src={line.image} alt="" fill className="object-cover" sizes="40px" />
                      </div>
                    )}
                    <div className="flex-1">
                      <p style={{ color: "var(--admin-text-heading)" }}>{line.name}</p>
                      <p style={{ color: "var(--admin-text-muted)" }}>
                        {line.quantity} × {formatPrice(line.price)}
                      </p>
                    </div>
                  </div>
                ))}
                <div
                  className="mt-2 space-y-1 border-t pt-2 text-sm"
                  style={{ borderColor: "var(--admin-border)" }}
                >
                  <div className="flex justify-between">
                    <span>Subtotal</span>
                    <span>{formatPrice(data.subtotal)}</span>
                  </div>
                  {data.discount > 0 && (
                    <div className="flex justify-between">
                      <span>Discount</span>
                      <span>-{formatPrice(data.discount)}</span>
                    </div>
                  )}
                  <div className="flex justify-between">
                    <span>Delivery</span>
                    <span>{formatPrice(data.deliveryFee)}</span>
                  </div>
                  <div className="flex justify-between font-bold">
                    <span>Total</span>
                    <span style={{ color: "var(--admin-primary)" }}>
                      {formatPrice(data.total)}
                    </span>
                  </div>
                </div>
              </div>
            ) : (
              <p className="mt-4 text-sm font-semibold" style={{ color: "var(--admin-primary)" }}>
                Total: {formatPrice(data?.total ?? snapshot.total)}
              </p>
            )}

            {data?.postexTracking && (
              <p className="mt-2 text-sm" style={{ color: "var(--admin-text-muted)" }}>
                PostEx: {data.postexTracking}
              </p>
            )}
            {data?.notes && (
              <p className="mt-2 text-sm italic" style={{ color: "var(--admin-text-muted)" }}>
                Notes: {data.notes}
              </p>
            )}

            {canViewOrders && data && (
              <Link
                href={`/admin/orders/${data.orderNumber}`}
                className="mt-4 inline-block text-sm font-semibold"
                style={{ color: "var(--admin-primary)" }}
              >
                Open in admin →
              </Link>
            )}
          </>
        )}
      </div>
    </div>
  );
}
