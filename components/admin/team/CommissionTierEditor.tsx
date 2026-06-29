"use client";

import { useState } from "react";
import type { CommissionTier } from "@/lib/admin/permissions";
import { DEFAULT_COMMISSION_CONFIG } from "@/lib/admin/permissions";
import { adminInputClass } from "@/components/admin/AdminUI";

type CommissionTierEditorProps = {
  tiers?: CommissionTier[];
  enabled?: boolean;
};

export function CommissionTierEditor({
  tiers = DEFAULT_COMMISSION_CONFIG.tiers,
  enabled = false,
}: CommissionTierEditorProps) {
  const [rows, setRows] = useState<CommissionTier[]>(tiers);
  const [isEnabled, setIsEnabled] = useState(enabled);

  function addRow() {
    const last = rows[rows.length - 1];
    const nextFrom = last?.to_order ? last.to_order + 1 : (last?.from_order ?? 0) + 1;
    setRows([...rows, { from_order: nextFrom, to_order: null, rate: 100 }]);
  }

  function removeRow(index: number) {
    setRows(rows.filter((_, i) => i !== index));
  }

  function updateRow(
    index: number,
    field: keyof CommissionTier,
    value: string,
  ) {
    setRows(
      rows.map((row, i) => {
        if (i !== index) return row;
        if (field === "to_order") {
          return {
            ...row,
            to_order: value.trim() ? Number(value) : null,
          };
        }
        return { ...row, [field]: Number(value) };
      }),
    );
  }

  return (
    <div className="space-y-3">
      <label className="flex items-center gap-2 text-sm font-medium">
        <input
          type="checkbox"
          name="commission_enabled"
          checked={isEnabled}
          onChange={(e) => setIsEnabled(e.target.checked)}
        />
        Enable commission on delivered manual orders
      </label>

      {isEnabled && (
        <>
          <p className="text-xs" style={{ color: "var(--admin-text-muted)" }}>
            Tiers reset each calendar month (Pakistan time). Blank &quot;To order #&quot; means unlimited.
          </p>
          <input type="hidden" name="tier_count" value={rows.length} />
          <div className="space-y-2">
            {rows.map((tier, i) => (
              <div key={i} className="flex flex-wrap items-end gap-2">
                <div>
                  <label className="mb-1 block text-xs">From #</label>
                  <input
                    name={`tier_${i}_from`}
                    type="number"
                    min={1}
                    value={tier.from_order}
                    onChange={(e) => updateRow(i, "from_order", e.target.value)}
                    className={`${adminInputClass} w-24`}
                  />
                </div>
                <div>
                  <label className="mb-1 block text-xs">To #</label>
                  <input
                    name={`tier_${i}_to`}
                    type="number"
                    min={tier.from_order}
                    value={tier.to_order ?? ""}
                    placeholder="∞"
                    onChange={(e) => updateRow(i, "to_order", e.target.value)}
                    className={`${adminInputClass} w-24`}
                  />
                </div>
                <div>
                  <label className="mb-1 block text-xs">Rate (Rs.)</label>
                  <input
                    name={`tier_${i}_rate`}
                    type="number"
                    min={0}
                    value={tier.rate}
                    onChange={(e) => updateRow(i, "rate", e.target.value)}
                    className={`${adminInputClass} w-28`}
                  />
                </div>
                {rows.length > 1 && (
                  <button
                    type="button"
                    onClick={() => removeRow(i)}
                    className="rounded-lg px-2 py-2 text-xs text-red-600 hover:bg-red-50"
                  >
                    Remove
                  </button>
                )}
              </div>
            ))}
          </div>
          <button
            type="button"
            onClick={addRow}
            className="text-sm font-medium"
            style={{ color: "var(--admin-primary-text)" }}
          >
            + Add tier
          </button>
        </>
      )}
    </div>
  );
}
