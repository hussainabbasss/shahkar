"use client";

import {
  PERMISSION_LABELS,
  type AdminPermissions,
  type AdminRole,
  type AnalyticsScope,
  type PermissionKey,
} from "@/lib/admin/permissions";
import { adminInputClass } from "@/components/admin/AdminUI";

const PERMISSION_KEYS = Object.keys(PERMISSION_LABELS) as PermissionKey[];
const STANDARD_PERMISSION_KEYS = PERMISSION_KEYS.filter(
  (k) =>
    k !== "manage_team" &&
    k !== "mark_order_delivered" &&
    k !== "create_message_groups",
);

type PermissionMatrixProps = {
  permissions: AdminPermissions;
  role: AdminRole;
  disabled?: boolean;
};

export function PermissionMatrix({
  permissions,
  role,
  disabled = false,
}: PermissionMatrixProps) {
  const scope = permissions.analytics_scope ?? "own";

  return (
    <div className="space-y-4">
      <p className="text-sm" style={{ color: "var(--admin-text-muted)" }}>
        Role template: <strong>{role}</strong> — toggles below override the template.
      </p>
      <div className="grid gap-2 sm:grid-cols-2">
        {STANDARD_PERMISSION_KEYS.map((key) => (
          <label
            key={key}
            className="flex items-center gap-2 rounded-lg px-2 py-1.5 text-sm"
            style={{ color: "var(--admin-text-heading)" }}
          >
            <input
              type="checkbox"
              name={`perm_${key}`}
              defaultChecked={permissions[key] === true}
              disabled={disabled}
              className="rounded"
            />
            {PERMISSION_LABELS[key]}
          </label>
        ))}
      </div>

      <div
        className="rounded-lg p-4"
        style={{
          border: "1px solid var(--admin-border)",
          background: "color-mix(in srgb, var(--admin-accent) 6%, transparent)",
        }}
      >
        <p className="mb-1 text-sm font-semibold">Super Admin approval</p>
        <p className="mb-3 text-xs" style={{ color: "var(--admin-text-muted)" }}>
          Staff can set pending and confirmed on their own. Enable below to also
          allow delivered or returned.
        </p>
        <label
          className="flex items-center gap-2 text-sm"
          style={{ color: "var(--admin-text-heading)" }}
        >
          <input
            type="checkbox"
            name="perm_mark_order_delivered"
            defaultChecked={permissions.mark_order_delivered === true}
            disabled={disabled}
            className="rounded"
          />
          {PERMISSION_LABELS.mark_order_delivered}
        </label>
      </div>

      <div
        className="rounded-lg p-4"
        style={{
          border: "1px solid var(--admin-border)",
          background: "color-mix(in srgb, var(--admin-primary) 4%, transparent)",
        }}
      >
        <p className="mb-1 text-sm font-semibold">Messages</p>
        <p className="mb-3 text-xs" style={{ color: "var(--admin-text-muted)" }}>
          All staff can DM each other. Enable below to allow creating group chats.
        </p>
        <label
          className="flex items-center gap-2 text-sm"
          style={{ color: "var(--admin-text-heading)" }}
        >
          <input
            type="checkbox"
            name="perm_create_message_groups"
            defaultChecked={permissions.create_message_groups === true}
            disabled={disabled}
            className="rounded"
          />
          {PERMISSION_LABELS.create_message_groups}
        </label>
      </div>

      <div>
        <p className="mb-2 text-sm font-medium">Analytics scope</p>
        <div className="flex gap-4 text-sm">
          <label className="flex items-center gap-2">
            <input
              type="radio"
              name="analytics_scope"
              value="own"
              defaultChecked={scope === "own"}
              disabled={disabled}
            />
            Own inserted orders only
          </label>
          <label className="flex items-center gap-2">
            <input
              type="radio"
              name="analytics_scope"
              value="global"
              defaultChecked={scope === "global"}
              disabled={disabled}
            />
            Global (all orders)
          </label>
        </div>
      </div>
    </div>
  );
}

export function RoleTemplateSelect({
  defaultValue,
  disabled,
}: {
  defaultValue: AdminRole;
  disabled?: boolean;
}) {
  return (
    <select
      name="role"
      defaultValue={defaultValue}
      disabled={disabled}
      className={adminInputClass}
    >
      <option value="manager">Manager</option>
      <option value="sales">Sales</option>
      <option value="custom">Custom</option>
    </select>
  );
}

export type { AnalyticsScope };
