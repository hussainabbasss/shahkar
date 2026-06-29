"use client";

import { useEffect, useState } from "react";
import { X } from "lucide-react";
import { searchOrdersAction } from "@/app/actions/admin/messages";
import { adminInputClass } from "@/components/admin/AdminUI";
import { formatPrice } from "@/lib/pricing";
import type { OrderEntitySnapshot } from "@/lib/admin/messages";

type OrderPickerSheetProps = {
  open: boolean;
  onClose: () => void;
  onSelect: (order: OrderEntitySnapshot) => void;
  selectedIds: string[];
  maxCount: number;
};

export function OrderPickerSheet({
  open,
  onClose,
  onSelect,
  selectedIds,
  maxCount,
}: OrderPickerSheetProps) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<OrderEntitySnapshot[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!open) return;
    const t = setTimeout(() => {
      setLoading(true);
      searchOrdersAction(query)
        .then(setResults)
        .finally(() => setLoading(false));
    }, 200);
    return () => clearTimeout(t);
  }, [query, open]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-40 flex items-end justify-center sm:items-center"
      style={{ background: "rgba(0,0,0,0.4)" }}
      onClick={onClose}
    >
      <div
        className="max-h-[70vh] w-full max-w-md overflow-hidden rounded-t-xl sm:rounded-xl"
        style={{ background: "var(--admin-surface)" }}
        onClick={(e) => e.stopPropagation()}
      >
        <div
          className="flex items-center justify-between border-b p-4"
          style={{ borderColor: "var(--admin-border)" }}
        >
          <h3 className="font-bold" style={{ color: "var(--admin-text-heading)" }}>
            Share an order
          </h3>
          <button type="button" onClick={onClose}>
            <X size={20} />
          </button>
        </div>
        <div className="p-4">
          <input
            type="search"
            placeholder="Order #, phone, name…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className={adminInputClass}
            autoFocus
          />
          <div className="mt-3 max-h-64 overflow-y-auto">
            {loading ? (
              <p className="text-sm" style={{ color: "var(--admin-text-muted)" }}>
                Loading…
              </p>
            ) : results.length === 0 ? (
              <p className="text-sm" style={{ color: "var(--admin-text-muted)" }}>
                No orders found
              </p>
            ) : (
              results.map((o) => {
                const selected = selectedIds.includes(o.id);
                const disabled =
                  selected || selectedIds.length >= maxCount;
                return (
                  <button
                    key={o.id}
                    type="button"
                    disabled={disabled && !selected}
                    onClick={() => {
                      onSelect(o);
                      onClose();
                    }}
                    className="flex w-full flex-col rounded-lg px-3 py-2.5 text-left text-sm transition-colors hover:bg-[color-mix(in_srgb,var(--admin-primary)_6%,transparent)] disabled:opacity-50"
                  >
                    <span className="font-semibold" style={{ color: "var(--admin-text-heading)" }}>
                      {o.orderNumber} · {o.customerName}
                    </span>
                    <span style={{ color: "var(--admin-primary)" }}>
                      {formatPrice(o.total)}
                    </span>
                  </button>
                );
              })
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
