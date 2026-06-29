"use client";

import type { LucideIcon } from "lucide-react";
import { TrendingDown, TrendingUp } from "lucide-react";
import { formatCurrency } from "@/lib/admin/utils";

type SparklineProps = {
  data: number[];
  color?: string;
};

function Sparkline({ data, color = "var(--admin-primary)" }: SparklineProps) {
  if (!data.length) return null;

  const max = Math.max(...data, 1);
  const min = Math.min(...data, 0);
  const range = max - min || 1;
  const w = 120;
  const h = 40;
  const points = data
    .map((v, i) => {
      const x = (i / Math.max(data.length - 1, 1)) * w;
      const y = h - ((v - min) / range) * (h - 4) - 2;
      return `${x},${y}`;
    })
    .join(" ");

  const areaPoints = `0,${h} ${points} ${w},${h}`;

  return (
    <svg
      viewBox={`0 0 ${w} ${h}`}
      className="h-10 w-full max-w-[140px]"
      preserveAspectRatio="none"
      aria-hidden
    >
      <defs>
        <linearGradient id="spark-fill" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.2" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>
      <polygon points={areaPoints} fill="url(#spark-fill)" />
      <polyline
        points={points}
        fill="none"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

type TrendBadgeProps = {
  changePercent: number | null;
};

function TrendBadge({ changePercent }: TrendBadgeProps) {
  if (changePercent === null) {
    return (
      <span className="text-xs font-medium" style={{ color: "var(--admin-text-subtle)" }}>
        —
      </span>
    );
  }

  const positive = changePercent >= 0;
  const Icon = positive ? TrendingUp : TrendingDown;
  const color = positive ? "var(--admin-success)" : "var(--admin-error)";

  return (
    <span
      className="inline-flex items-center gap-0.5 text-xs font-semibold tabular-nums"
      style={{ color }}
      title="vs previous period"
    >
      <Icon size={14} />
      {Math.abs(changePercent).toFixed(1)}%
    </span>
  );
}

export type KpiHeroPanelProps = {
  title: string;
  icon: LucideIcon;
  metric: {
    value: number;
    previous: number;
    changePercent: number | null;
    sparkline: number[];
  };
  format?: "number" | "currency";
  unitLabel?: string;
};

export function KpiHeroPanel({
  title,
  icon: Icon,
  metric,
  format = "number",
  unitLabel,
}: KpiHeroPanelProps) {
  const displayValue =
    format === "currency"
      ? formatCurrency(metric.value)
      : metric.value.toLocaleString("en-PK");

  return (
    <div className="admin-card admin-card-hover flex min-h-[148px] flex-col p-5">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-2">
          <div
            className="flex h-8 w-8 items-center justify-center rounded-lg"
            style={{
              background: "var(--admin-primary-muted)",
              color: "var(--admin-primary-text)",
            }}
          >
            <Icon size={16} />
          </div>
          <span
            className="text-sm font-semibold"
            style={{ color: "var(--admin-text-heading)" }}
          >
            {title}
          </span>
        </div>
        <TrendBadge changePercent={metric.changePercent} />
      </div>

      <div className="mt-4 flex items-end justify-between gap-4">
        <div>
          <p
            className="text-[32px] font-bold leading-none tabular-nums"
            style={{ color: "var(--admin-text-heading)" }}
          >
            {displayValue}
          </p>
          <p className="mt-1.5 text-xs" style={{ color: "var(--admin-text-muted)" }}>
            {unitLabel ?? (format === "currency" ? "this period" : "orders this period")}
          </p>
        </div>
        <Sparkline data={metric.sparkline} />
      </div>
    </div>
  );
}
