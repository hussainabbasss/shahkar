"use client";

import { useEffect, useState } from "react";
import { X } from "lucide-react";
import { searchProductsAction } from "@/app/actions/admin/messages";
import { adminInputClass } from "@/components/admin/AdminUI";
import { formatPrice } from "@/lib/pricing";
import type { ProductEntitySnapshot } from "@/lib/admin/messages";

type ProductPickerSheetProps = {
  open: boolean;
  onClose: () => void;
  onSelect: (product: ProductEntitySnapshot) => void;
  selectedIds: string[];
  maxCount: number;
};

export function ProductPickerSheet({
  open,
  onClose,
  onSelect,
  selectedIds,
  maxCount,
}: ProductPickerSheetProps) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<ProductEntitySnapshot[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!open) return;
    const t = setTimeout(() => {
      setLoading(true);
      searchProductsAction(query)
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
            Share a product
          </h3>
          <button type="button" onClick={onClose}>
            <X size={20} />
          </button>
        </div>
        <div className="p-4">
          <input
            type="search"
            placeholder="Search products…"
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
                No products found
              </p>
            ) : (
              results.map((p) => {
                const selected = selectedIds.includes(p.id);
                const disabled =
                  selected || selectedIds.length >= maxCount;
                return (
                  <button
                    key={p.id}
                    type="button"
                    disabled={disabled && !selected}
                    onClick={() => {
                      onSelect(p);
                      onClose();
                    }}
                    className="flex w-full items-center justify-between rounded-lg px-3 py-2.5 text-left text-sm transition-colors hover:bg-[color-mix(in_srgb,var(--admin-primary)_6%,transparent)] disabled:opacity-50"
                  >
                    <span style={{ color: "var(--admin-text-heading)" }}>
                      {p.name}
                    </span>
                    <span style={{ color: "var(--admin-primary)" }}>
                      {formatPrice(p.displayPrice)}
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
