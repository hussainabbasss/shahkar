"use client";

import { ChevronDown, Loader2 } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { ORDER_STATUSES } from "@/lib/admin/utils";
import type { OrderStatus } from "@/lib/types";

const STATUS_STYLES: Record<
  OrderStatus,
  { dot: string; bg: string; text: string }
> = {
  pending: {
    dot: "#D4820A",
    bg: "var(--admin-accent-muted)",
    text: "var(--admin-accent)",
  },
  confirmed: {
    dot: "#2563EB",
    bg: "color-mix(in srgb, var(--admin-info) 12%, transparent)",
    text: "var(--admin-info)",
  },
  dispatched: {
    dot: "#7C3AED",
    bg: "color-mix(in srgb, #7C3AED 12%, transparent)",
    text: "#7C3AED",
  },
  delivered: {
    dot: "var(--admin-success)",
    bg: "var(--admin-primary-muted)",
    text: "var(--admin-success)",
  },
  returned: {
    dot: "var(--admin-error)",
    bg: "color-mix(in srgb, var(--admin-error) 12%, transparent)",
    text: "var(--admin-error)",
  },
};

type StatusDropdownProps = {
  value: OrderStatus;
  onChange: (status: OrderStatus) => void | Promise<void>;
  loading?: boolean;
  compact?: boolean;
  allowedStatuses?: OrderStatus[];
};

export function StatusDropdown({
  value,
  onChange,
  loading = false,
  compact = false,
  allowedStatuses = [...ORDER_STATUSES],
}: StatusDropdownProps) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const style = STATUS_STYLES[value];

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  async function select(status: OrderStatus) {
    setOpen(false);
    await onChange(status);
  }

  return (
    <div ref={ref} className="relative inline-block">
      <button
        type="button"
        disabled={loading}
        onClick={() => setOpen((o) => !o)}
        className={`inline-flex items-center gap-1.5 rounded-full border font-semibold capitalize transition-opacity ${
          compact ? "px-2 py-0.5 text-[11px]" : "px-2.5 py-1 text-xs"
        }`}
        style={{
          background: style.bg,
          color: style.text,
          borderColor: "var(--admin-border)",
        }}
        aria-haspopup="listbox"
        aria-expanded={open}
      >
        <span
          className="h-1.5 w-1.5 shrink-0 rounded-full"
          style={{ background: style.dot }}
        />
        {value}
        {loading ? (
          <Loader2 size={12} className="animate-spin opacity-70" />
        ) : (
          <ChevronDown size={12} className="opacity-60" />
        )}
      </button>

      {open && (
        <ul
          role="listbox"
          className="absolute right-0 z-50 mt-1 min-w-[140px] overflow-hidden rounded-lg py-1"
          style={{
            background: "var(--admin-surface-raised)",
            border: "1px solid var(--admin-border)",
            boxShadow: "var(--admin-shadow-md)",
          }}
        >
          {ORDER_STATUSES.filter(
            (s) => allowedStatuses.includes(s) || s === value,
          ).map((s) => {
            const opt = STATUS_STYLES[s];
            const selected = s === value;
            return (
              <li key={s}>
                <button
                  type="button"
                  role="option"
                  aria-selected={selected}
                  onClick={() => select(s)}
                  className="flex w-full items-center gap-2 px-3 py-2 text-left text-xs font-medium capitalize transition-colors hover:bg-[color-mix(in_srgb,var(--admin-primary)_6%,transparent)]"
                  style={{ color: "var(--admin-text-body)" }}
                >
                  <span
                    className="h-2 w-2 rounded-full"
                    style={{ background: opt.dot }}
                  />
                  {s}
                  {selected && (
                    <span className="ml-auto text-[10px]" style={{ color: "var(--admin-primary-text)" }}>
                      ✓
                    </span>
                  )}
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}

export function OrderStatusBadge({ status }: { status: OrderStatus }) {
  const style = STATUS_STYLES[status];
  return (
    <span
      className="inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-semibold capitalize"
      style={{
        background: style.bg,
        color: style.text,
        borderColor: "var(--admin-border)",
      }}
    >
      <span
        className="h-1.5 w-1.5 rounded-full"
        style={{ background: style.dot }}
      />
      {status}
    </span>
  );
}
