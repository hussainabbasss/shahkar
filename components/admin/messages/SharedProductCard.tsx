"use client";

import Image from "next/image";
import { formatPrice } from "@/lib/pricing";
import { stockBadgeLabel, type ProductEntitySnapshot } from "@/lib/admin/messages";

type SharedProductCardProps = {
  snapshot: ProductEntitySnapshot;
  onClick: () => void;
};

export function SharedProductCard({ snapshot, onClick }: SharedProductCardProps) {
  const stockLabel = stockBadgeLabel(snapshot.stock);
  const stockColor =
    snapshot.stock <= 0
      ? "var(--admin-error)"
      : snapshot.stock <= 10
        ? "var(--admin-accent)"
        : "var(--admin-success)";

  return (
    <button
      type="button"
      onClick={onClick}
      className="mt-2 w-full max-w-[280px] rounded-lg text-left transition-opacity hover:opacity-90"
      style={{
        border: "1px solid var(--admin-border)",
        background: "var(--admin-surface)",
      }}
    >
      <p
        className="px-3 pt-2 text-[10px] font-semibold uppercase tracking-wide"
        style={{ color: "var(--admin-text-subtle)" }}
      >
        Product
      </p>
      <div className="flex gap-3 p-3 pt-1">
        {snapshot.image ? (
          <div className="relative h-14 w-14 shrink-0 overflow-hidden rounded-md">
            <Image
              src={snapshot.image}
              alt={snapshot.name}
              fill
              className="object-cover"
              sizes="56px"
            />
          </div>
        ) : (
          <div
            className="flex h-14 w-14 shrink-0 items-center justify-center rounded-md text-xs"
            style={{ background: "var(--admin-border)" }}
          >
            📦
          </div>
        )}
        <div className="min-w-0 flex-1">
          <p
            className="truncate text-sm font-semibold"
            style={{ color: "var(--admin-text-heading)" }}
          >
            {snapshot.name}
          </p>
          <p
            className="text-sm font-bold"
            style={{ color: "var(--admin-primary)" }}
          >
            {formatPrice(snapshot.displayPrice)}
          </p>
          <span
            className="mt-1 inline-block rounded-full px-2 py-0.5 text-[10px] font-semibold"
            style={{
              background: `color-mix(in srgb, ${stockColor} 15%, transparent)`,
              color: stockColor,
            }}
          >
            {stockLabel}
          </span>
        </div>
      </div>
    </button>
  );
}
