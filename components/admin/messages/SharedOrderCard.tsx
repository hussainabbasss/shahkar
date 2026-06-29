"use client";

import { StatusBadge } from "@/components/admin/AdminUI";
import { formatPrice } from "@/lib/pricing";
import type { OrderEntitySnapshot } from "@/lib/admin/messages";

type SharedOrderCardProps = {
  snapshot: OrderEntitySnapshot;
  onClick: () => void;
};

export function SharedOrderCard({ snapshot, onClick }: SharedOrderCardProps) {
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
        Order
      </p>
      <div className="space-y-1 p-3 pt-1">
        <p
          className="text-sm font-bold"
          style={{ color: "var(--admin-text-heading)" }}
        >
          {snapshot.orderNumber}
        </p>
        <p className="text-sm" style={{ color: "var(--admin-text-muted)" }}>
          {snapshot.customerName}
        </p>
        <p
          className="text-sm font-semibold"
          style={{ color: "var(--admin-primary)" }}
        >
          {formatPrice(snapshot.total)}
        </p>
        <div className="flex flex-wrap gap-1.5 pt-1">
          <StatusBadge status={snapshot.status} variant="order" />
          <span
            className="inline-flex rounded-full px-2 py-0.5 text-[10px] font-semibold capitalize"
            style={{
              background: "color-mix(in srgb, var(--admin-text-muted) 12%, transparent)",
              color: "var(--admin-text-muted)",
            }}
          >
            {snapshot.source === "manual" ? "Manual" : "Website"}
          </span>
        </div>
      </div>
    </button>
  );
}
