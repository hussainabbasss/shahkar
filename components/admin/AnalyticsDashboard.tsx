"use client";

import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import { useState } from "react";
import { StatCard } from "@/components/admin/StatCard";
import { SegmentedControl } from "@/components/admin/SegmentedControl";
import {
  AdminEmptyState,
  AdminTable,
  AdminTableBody,
  AdminTableHead,
} from "@/components/admin/AdminUI";
import { useAdminTheme } from "@/components/admin/AdminThemeProvider";
import { formatCurrency } from "@/lib/admin/utils";
import type { AnalyticsData } from "@/lib/db/admin/analytics";

type AnalyticsDashboardProps = {
  data: AnalyticsData;
};

export function AnalyticsDashboard({ data }: AnalyticsDashboardProps) {
  const [period, setPeriod] = useState<"daily" | "weekly" | "monthly">("daily");
  const { theme } = useAdminTheme();

  const chartPrimary = theme === "dark" ? "#34d399" : "#1b6b3a";
  const chartDelivered = theme === "dark" ? "#4ade80" : "#16a34a";
  const chartReturned = theme === "dark" ? "#f87171" : "#dc2626";
  const gridStroke = "var(--admin-chart-grid)";
  const tickColor = "var(--admin-chart-text)";

  const tooltipStyle = {
    background: "var(--admin-surface-raised)",
    border: "1px solid var(--admin-border-solid)",
    borderRadius: "8px",
    color: "var(--admin-text-body)",
    fontSize: "12px",
  };

  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Average Order Value" value={formatCurrency(data.averageOrderValue)} />
        <StatCard label="Return Rate" value={`${data.returnRate.toFixed(1)}%`} />
        <StatCard
          label="Top City"
          value={data.topCities[0]?.city ?? "—"}
          sub={data.topCities[0] ? `${data.topCities[0].count} orders` : undefined}
        />
        <StatCard
          label="Conversion Rate"
          value="—"
          sub="Requires tracking (future)"
        />
      </div>

      <SegmentedControl
        options={[
          { value: "daily" as const, label: "Daily" },
          { value: "weekly" as const, label: "Weekly" },
          { value: "monthly" as const, label: "Monthly" },
        ]}
        value={period}
        onChange={setPeriod}
        size="sm"
      />

      <div className="grid gap-6 lg:grid-cols-2">
        <section className="admin-card p-4">
          <h3
            className="mb-4 font-semibold"
            style={{ color: "var(--admin-text-heading)" }}
          >
            Revenue
          </h3>
          {data.revenueSeries.length === 0 ? (
            <AdminEmptyState message="No revenue data yet" />
          ) : (
            <ResponsiveContainer width="100%" height={260}>
              <LineChart data={data.revenueSeries}>
                <CartesianGrid strokeDasharray="3 3" stroke={gridStroke} />
                <XAxis dataKey="label" tick={{ fontSize: 11, fill: tickColor }} />
                <YAxis tick={{ fontSize: 11, fill: tickColor }} />
                <Tooltip
                  formatter={(v) => formatCurrency(Number(v))}
                  contentStyle={tooltipStyle}
                />
                <Line
                  type="monotone"
                  dataKey="revenue"
                  stroke={chartPrimary}
                  strokeWidth={2}
                  dot={false}
                />
              </LineChart>
            </ResponsiveContainer>
          )}
        </section>

        <section className="admin-card p-4">
          <h3
            className="mb-4 font-semibold"
            style={{ color: "var(--admin-text-heading)" }}
          >
            Orders
          </h3>
          {data.ordersSeries.length === 0 ? (
            <AdminEmptyState message="No order data yet" />
          ) : (
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={data.ordersSeries}>
                <CartesianGrid strokeDasharray="3 3" stroke={gridStroke} />
                <XAxis dataKey="label" tick={{ fontSize: 11, fill: tickColor }} />
                <YAxis tick={{ fontSize: 11, fill: tickColor }} />
                <Tooltip contentStyle={tooltipStyle} />
                <Legend wrapperStyle={{ color: tickColor, fontSize: "12px" }} />
                <Bar dataKey="placed" fill={chartPrimary} name="Placed" />
                <Bar dataKey="delivered" fill={chartDelivered} name="Delivered" />
                <Bar dataKey="returned" fill={chartReturned} name="Returned" />
              </BarChart>
            </ResponsiveContainer>
          )}
        </section>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <section>
          <h3
            className="mb-3 font-semibold"
            style={{ color: "var(--admin-text-heading)" }}
          >
            Top Products
          </h3>
          <AdminTable>
            <AdminTableHead>
              <th className="px-4 py-3">Product</th>
              <th className="px-4 py-3">Qty</th>
              <th className="px-4 py-3">Revenue</th>
            </AdminTableHead>
            <AdminTableBody>
              {data.topProducts.length === 0 ? (
                <tr>
                  <td
                    colSpan={3}
                    className="px-4 py-8 text-center"
                    style={{ color: "var(--admin-text-muted)" }}
                  >
                    No sales yet
                  </td>
                </tr>
              ) : (
                data.topProducts.map((p) => (
                  <tr key={p.name} className="admin-table-row">
                    <td className="px-4 py-3 font-medium">{p.name}</td>
                    <td className="px-4 py-3 tabular-nums">{p.quantity}</td>
                    <td className="px-4 py-3 tabular-nums">{formatCurrency(p.revenue)}</td>
                  </tr>
                ))
              )}
            </AdminTableBody>
          </AdminTable>
        </section>

        <section className="space-y-6">
          <div>
            <h3
              className="mb-3 font-semibold"
              style={{ color: "var(--admin-text-heading)" }}
            >
              Top Cities
            </h3>
            <ul
              className="admin-card divide-y overflow-hidden"
              style={{ borderColor: "var(--admin-border)" }}
            >
              {data.topCities.length === 0 ? (
                <li
                  className="px-4 py-6 text-center text-sm"
                  style={{ color: "var(--admin-text-muted)" }}
                >
                  No data
                </li>
              ) : (
                data.topCities.map((c) => (
                  <li
                    key={c.city}
                    className="flex justify-between px-4 py-3 text-sm transition-colors hover:bg-[var(--admin-row-hover)]"
                  >
                    <span style={{ color: "var(--admin-text-body)" }}>{c.city}</span>
                    <span
                      className="font-medium tabular-nums"
                      style={{ color: "var(--admin-text-heading)" }}
                    >
                      {c.count} orders
                    </span>
                  </li>
                ))
              )}
            </ul>
          </div>
          <div>
            <h3
              className="mb-3 font-semibold"
              style={{ color: "var(--admin-text-heading)" }}
            >
              Most Used Coupons
            </h3>
            <ul
              className="admin-card divide-y overflow-hidden"
              style={{ borderColor: "var(--admin-border)" }}
            >
              {data.topCoupons.length === 0 ? (
                <li
                  className="px-4 py-6 text-center text-sm"
                  style={{ color: "var(--admin-text-muted)" }}
                >
                  No coupon usage yet
                </li>
              ) : (
                data.topCoupons.map((c) => (
                  <li
                    key={c.code}
                    className="flex justify-between px-4 py-3 text-sm font-mono transition-colors hover:bg-[var(--admin-row-hover)]"
                  >
                    <span style={{ color: "var(--admin-text-body)" }}>{c.code}</span>
                    <span
                      className="font-medium tabular-nums"
                      style={{ color: "var(--admin-text-heading)" }}
                    >
                      {c.uses} uses
                    </span>
                  </li>
                ))
              )}
            </ul>
          </div>
        </section>
      </div>
    </div>
  );
}
