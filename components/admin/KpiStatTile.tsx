"use client";

import type { LucideIcon } from "lucide-react";
import Link from "next/link";

type KpiStatTileProps = {
  label: string;
  value: number;
  subtitle: string;
  icon: LucideIcon;
  href?: string;
  accent?: "primary" | "accent" | "success" | "error" | "info";
};

const ACCENT_MAP = {
  primary: {
    bg: "var(--admin-primary-muted)",
    dot: "var(--admin-primary)",
    text: "var(--admin-primary-text)",
  },
  accent: {
    bg: "var(--admin-accent-muted)",
    dot: "var(--admin-accent)",
    text: "var(--admin-accent)",
  },
  success: {
    bg: "color-mix(in srgb, var(--admin-success) 12%, transparent)",
    dot: "var(--admin-success)",
    text: "var(--admin-success)",
  },
  error: {
    bg: "color-mix(in srgb, var(--admin-error) 12%, transparent)",
    dot: "var(--admin-error)",
    text: "var(--admin-error)",
  },
  info: {
    bg: "color-mix(in srgb, var(--admin-info) 12%, transparent)",
    dot: "var(--admin-info)",
    text: "var(--admin-info)",
  },
};

export function KpiStatTile({
  label,
  value,
  subtitle,
  icon: Icon,
  href,
  accent = "primary",
}: KpiStatTileProps) {
  const colors = ACCENT_MAP[accent];
  const inner = (
    <div className="admin-card admin-card-hover flex items-center gap-4 p-4">
      <div
        className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full"
        style={{ background: colors.bg, color: colors.text }}
      >
        <Icon size={18} />
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <span
            className="h-2 w-2 shrink-0 rounded-full"
            style={{ background: colors.dot }}
          />
          <span
            className="text-sm font-semibold"
            style={{ color: "var(--admin-text-heading)" }}
          >
            {label}
          </span>
        </div>
        <p
          className="mt-0.5 text-xl font-bold tabular-nums"
          style={{ color: "var(--admin-text-heading)" }}
        >
          {value.toLocaleString("en-PK")}
        </p>
        <p className="truncate text-xs" style={{ color: "var(--admin-text-muted)" }}>
          {subtitle}
        </p>
      </div>
    </div>
  );

  if (href) {
    return (
      <Link href={href} className="block">
        {inner}
      </Link>
    );
  }

  return inner;
}
