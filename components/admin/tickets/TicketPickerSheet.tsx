"use client";

import { useEffect, useState } from "react";
import { X } from "lucide-react";
import { searchTicketsAction } from "@/app/actions/admin/tickets";
import { adminInputClass } from "@/components/admin/AdminUI";
import { STATUS_LABELS } from "@/lib/admin/tickets";
import type { TicketEntitySnapshot } from "@/lib/admin/tickets";

type TicketPickerSheetProps = {
  open: boolean;
  onClose: () => void;
  onSelect: (ticket: TicketEntitySnapshot) => void;
  selectedIds: string[];
  maxCount: number;
};

export function TicketPickerSheet({
  open,
  onClose,
  onSelect,
  selectedIds,
  maxCount,
}: TicketPickerSheetProps) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<TicketEntitySnapshot[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!open) return;
    const t = setTimeout(() => {
      setLoading(true);
      searchTicketsAction(query)
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
            Share a ticket
          </h3>
          <button type="button" onClick={onClose}>
            <X size={20} />
          </button>
        </div>
        <div className="p-4">
          <input
            type="search"
            placeholder="Search by key or title…"
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
                No tickets found
              </p>
            ) : (
              results.map((t) => {
                const selected = selectedIds.includes(t.id);
                const disabled = selected || selectedIds.length >= maxCount;
                return (
                  <button
                    key={t.id}
                    type="button"
                    disabled={disabled && !selected}
                    onClick={() => {
                      onSelect(t);
                      onClose();
                    }}
                    className="flex w-full flex-col rounded-lg px-3 py-2.5 text-left text-sm transition-colors hover:bg-[color-mix(in_srgb,var(--admin-primary)_6%,transparent)] disabled:opacity-50"
                  >
                    <span
                      className="font-semibold"
                      style={{ color: "var(--admin-text-heading)" }}
                    >
                      {t.ticketKey} — {t.title}
                    </span>
                    <span
                      className="text-xs"
                      style={{ color: "var(--admin-text-muted)" }}
                    >
                      {STATUS_LABELS[t.status]}
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
