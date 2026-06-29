"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import { X } from "lucide-react";
import { fetchSharedProductAction } from "@/app/actions/admin/messages";
import { formatPrice } from "@/lib/pricing";
import { computeDisplayPrice } from "@/lib/pricing";
import { stockBadgeLabel, type ProductEntitySnapshot } from "@/lib/admin/messages";
import type { Sale } from "@/lib/types";

type SharedProductDetailDialogProps = {
  snapshot: ProductEntitySnapshot;
  canManageProducts: boolean;
  onClose: () => void;
};

export function SharedProductDetailDialog({
  snapshot,
  canManageProducts,
  onClose,
}: SharedProductDetailDialogProps) {
  const [loading, setLoading] = useState(true);
  const [snapshotOnly, setSnapshotOnly] = useState(false);
  const [product, setProduct] = useState<Awaited<
    ReturnType<typeof fetchSharedProductAction>
  >["product"]>(null);

  useEffect(() => {
    fetchSharedProductAction(snapshot.id)
      .then((res) => {
        setProduct(res.product);
        setSnapshotOnly(res.snapshotOnly);
      })
      .finally(() => setLoading(false));
  }, [snapshot.id]);

  const display = product
    ? computeDisplayPrice(product, null as Sale | null)
    : null;

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
            Product detail
          </h2>
          <button type="button" onClick={onClose} aria-label="Close">
            <X size={20} />
          </button>
        </div>

        {loading ? (
          <p style={{ color: "var(--admin-text-muted)" }}>Loading…</p>
        ) : (
          <>
            {!product && (
              <p
                className="mb-3 rounded-lg p-3 text-sm"
                style={{
                  background: "color-mix(in srgb, var(--admin-accent) 10%, transparent)",
                  color: "var(--admin-text-muted)",
                }}
              >
                {snapshotOnly
                  ? "You need permission to view full details."
                  : "Product is no longer available — showing snapshot."}
              </p>
            )}

            <div className="flex gap-4">
              {(product?.images[0] ?? snapshot.image) && (
                <div className="relative h-24 w-24 shrink-0 overflow-hidden rounded-lg">
                  <Image
                    src={product?.images[0] ?? snapshot.image}
                    alt={product?.name ?? snapshot.name}
                    fill
                    className="object-cover"
                    sizes="96px"
                  />
                </div>
              )}
              <div>
                <h3
                  className="font-bold"
                  style={{ color: "var(--admin-text-heading)" }}
                >
                  {product?.name ?? snapshot.name}
                </h3>
                <p
                  className="text-lg font-bold"
                  style={{ color: "var(--admin-primary)" }}
                >
                  {formatPrice(
                    display?.currentPrice ?? snapshot.displayPrice,
                  )}
                </p>
                <p className="text-sm" style={{ color: "var(--admin-text-muted)" }}>
                  Stock: {product?.stock ?? snapshot.stock} ·{" "}
                  {stockBadgeLabel(product?.stock ?? snapshot.stock)}
                </p>
                {product?.category && (
                  <p className="text-sm" style={{ color: "var(--admin-text-muted)" }}>
                    {product.category}
                  </p>
                )}
              </div>
            </div>

            {product?.description && (
              <p
                className="mt-4 line-clamp-4 text-sm"
                style={{ color: "var(--admin-text-muted)" }}
              >
                {product.description}
              </p>
            )}

            {product?.features?.length ? (
              <ul className="mt-3 list-inside list-disc text-sm" style={{ color: "var(--admin-text-muted)" }}>
                {product.features.slice(0, 5).map((f) => (
                  <li key={f}>{f}</li>
                ))}
              </ul>
            ) : null}

            {canManageProducts && product && (
              <Link
                href={`/admin/products/${product.id}/edit`}
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
