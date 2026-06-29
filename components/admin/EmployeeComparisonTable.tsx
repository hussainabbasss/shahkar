"use client";

import { useRouter } from "next/navigation";
import {
  AdminTable,
  AdminTableBody,
  AdminTableHead,
  adminInputClass,
} from "@/components/admin/AdminUI";
import { formatCurrency } from "@/lib/admin/utils";
import type { EmployeeComparisonRow } from "@/lib/db/admin/team";

type EmployeeComparisonTableProps = {
  rows: EmployeeComparisonRow[];
  range: string;
};

export function EmployeeComparisonTable({
  rows,
  range,
}: EmployeeComparisonTableProps) {
  const router = useRouter();

  function applyRange(next: string) {
    router.push(`/admin/team/compare?range=${next}`);
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2">
        {[
          { value: "week", label: "This week" },
          { value: "month", label: "This month" },
        ].map((opt) => (
          <button
            key={opt.value}
            type="button"
            onClick={() => applyRange(opt.value)}
            className={`rounded-lg px-4 py-2 text-sm font-medium ${
              range === opt.value ? "admin-nav-active" : ""
            }`}
            style={
              range === opt.value
                ? undefined
                : {
                    border: "1px solid var(--admin-border)",
                    color: "var(--admin-text-muted)",
                  }
            }
          >
            {opt.label}
          </button>
        ))}
      </div>

      <AdminTable>
        <AdminTableHead>
          <th className="px-4 py-3">Employee</th>
          <th className="px-4 py-3">Created</th>
          <th className="px-4 py-3">Delivered</th>
          <th className="px-4 py-3">Revenue</th>
          <th className="px-4 py-3">Commission</th>
          <th className="px-4 py-3">Delivered %</th>
        </AdminTableHead>
        <AdminTableBody>
          {rows.length === 0 ? (
            <tr>
              <td colSpan={6} className="px-4 py-8 text-center text-sm" style={{ color: "var(--admin-text-muted)" }}>
                No manual orders in this period.
              </td>
            </tr>
          ) : (
            rows.map((row) => (
              <tr key={row.id} className="admin-table-row">
                <td className="px-4 py-3 font-medium">{row.name}</td>
                <td className="px-4 py-3">{row.ordersCreated}</td>
                <td className="px-4 py-3">{row.ordersDelivered}</td>
                <td className="px-4 py-3">{formatCurrency(row.revenue)}</td>
                <td className="px-4 py-3">{formatCurrency(row.commission)}</td>
                <td className="px-4 py-3">{row.conversionPercent.toFixed(1)}%</td>
              </tr>
            ))
          )}
        </AdminTableBody>
      </AdminTable>
    </div>
  );
}
