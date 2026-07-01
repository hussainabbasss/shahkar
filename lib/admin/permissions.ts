import type { AdminUser } from "@/lib/admin/auth";
import type { OrderStatus } from "@/lib/types";

export type AdminRole = "admin" | "manager" | "sales" | "custom";
export type AnalyticsScope = "own" | "global";

export type PermissionKey =
  | "view_dashboard"
  | "view_products"
  | "manage_products"
  | "view_orders"
  | "create_orders"
  | "update_order_status"
  | "mark_order_delivered"
  | "view_sales"
  | "manage_sales"
  | "view_coupons"
  | "manage_coupons"
  | "view_analytics"
  | "manage_team"
  | "create_message_groups"
  | "view_tickets"
  | "manage_tickets";

export type AdminPermissions = {
  view_dashboard?: boolean;
  view_products?: boolean;
  manage_products?: boolean;
  view_orders?: boolean;
  create_orders?: boolean;
  update_order_status?: boolean;
  mark_order_delivered?: boolean;
  view_sales?: boolean;
  manage_sales?: boolean;
  view_coupons?: boolean;
  manage_coupons?: boolean;
  view_analytics?: boolean;
  analytics_scope?: AnalyticsScope;
  manage_team?: boolean;
  create_message_groups?: boolean;
  view_tickets?: boolean;
  manage_tickets?: boolean;
};

export type CommissionTier = {
  from_order: number;
  to_order: number | null;
  rate: number;
};

export type CommissionConfig = {
  reset_period: "monthly";
  timezone: string;
  tiers: CommissionTier[];
};

export const DEFAULT_COMMISSION_CONFIG: CommissionConfig = {
  reset_period: "monthly",
  timezone: "Asia/Karachi",
  tiers: [
    { from_order: 1, to_order: 14, rate: 50 },
    { from_order: 15, to_order: null, rate: 100 },
  ],
};

export const PERMISSION_LABELS: Record<PermissionKey, string> = {
  view_dashboard: "View dashboard",
  view_products: "View products",
  manage_products: "Manage products",
  view_orders: "View orders",
  create_orders: "Create manual orders (pending / confirmed)",
  update_order_status: "Update to dispatched",
  mark_order_delivered: "Allow delivered / returned (Super Admin approval)",
  view_sales: "View sales",
  manage_sales: "Manage sales",
  view_coupons: "View coupons",
  manage_coupons: "Manage coupons",
  view_analytics: "View analytics",
  manage_team: "Manage team (Super Admin only)",
  create_message_groups: "Create message groups",
  view_tickets: "View tickets",
  manage_tickets: "Manage tickets",
};

export const ROLE_TEMPLATES: Record<
  Exclude<AdminRole, "admin">,
  AdminPermissions
> = {
  manager: {
    view_dashboard: true,
    view_products: true,
    manage_products: true,
    view_orders: true,
    create_orders: true,
    update_order_status: true,
    mark_order_delivered: true,
    view_sales: true,
    manage_sales: true,
    view_coupons: true,
    manage_coupons: true,
    view_analytics: true,
    analytics_scope: "global",
    create_message_groups: true,
    view_tickets: true,
    manage_tickets: true,
  },
  sales: {
    view_dashboard: true,
    view_orders: true,
    create_orders: true,
    view_analytics: true,
    analytics_scope: "own",
    view_tickets: true,
    manage_tickets: true,
  },
  custom: {},
};

export function isSuperAdmin(user: AdminUser): boolean {
  return user.role === "admin";
}

export function hasPermission(
  user: AdminUser,
  key: PermissionKey,
): boolean {
  if (isSuperAdmin(user)) return true;
  if (key === "manage_team") return false;
  return user.permissions[key] === true;
}

export function getAnalyticsScope(user: AdminUser): AnalyticsScope {
  if (isSuperAdmin(user)) return "global";
  return user.permissions.analytics_scope ?? "own";
}

const STATUS_ORDER: OrderStatus[] = [
  "pending",
  "confirmed",
  "dispatched",
  "delivered",
  "returned",
];

function uniqueStatuses(lists: OrderStatus[][]): OrderStatus[] {
  const seen = new Set<OrderStatus>();
  const result: OrderStatus[] = [];
  for (const list of lists) {
    for (const status of list) {
      if (!seen.has(status)) {
        seen.add(status);
        result.push(status);
      }
    }
  }
  return result.sort(
    (a, b) => STATUS_ORDER.indexOf(a) - STATUS_ORDER.indexOf(b),
  );
}

export function getAllowedOrderStatuses(user: AdminUser): OrderStatus[] {
  if (isSuperAdmin(user)) {
    return STATUS_ORDER;
  }

  const lists: OrderStatus[][] = [];

  if (hasPermission(user, "create_orders")) {
    lists.push(["pending", "confirmed"]);
  }
  if (hasPermission(user, "update_order_status")) {
    lists.push(["pending", "confirmed", "dispatched"]);
  }
  if (hasPermission(user, "mark_order_delivered")) {
    lists.push(["delivered", "returned"]);
  }

  return uniqueStatuses(lists);
}

export function canSetOrderStatus(
  user: AdminUser,
  currentStatus: OrderStatus,
  newStatus: OrderStatus,
): boolean {
  if (currentStatus === newStatus) return true;
  if (isSuperAdmin(user)) return true;

  if (newStatus === "pending" || newStatus === "confirmed") {
    return (
      hasPermission(user, "create_orders") ||
      hasPermission(user, "update_order_status")
    );
  }
  if (newStatus === "dispatched") {
    return hasPermission(user, "update_order_status");
  }
  if (newStatus === "delivered" || newStatus === "returned") {
    return hasPermission(user, "mark_order_delivered");
  }
  return false;
}

export function validateCommissionTiers(
  tiers: CommissionTier[],
): string | null {
  if (!tiers.length) return "At least one commission tier is required.";

  const sorted = [...tiers].sort((a, b) => a.from_order - b.from_order);

  for (let i = 0; i < sorted.length; i++) {
    const tier = sorted[i];
    if (tier.from_order < 1) {
      return "Tier start order must be at least 1.";
    }
    if (tier.rate < 0) return "Tier rate cannot be negative.";
    if (tier.to_order !== null && tier.to_order < tier.from_order) {
      return "Tier end order must be greater than or equal to start order.";
    }

    if (i > 0) {
      const prev = sorted[i - 1];
      const prevEnd = prev.to_order ?? Infinity;
      if (tier.from_order !== prevEnd + 1) {
        return "Commission tiers must be contiguous with no gaps or overlaps.";
      }
    }
  }

  const last = sorted[sorted.length - 1];
  if (last.to_order !== null) {
    const nextStart = last.to_order + 1;
    const hasOpenEnded = sorted.some(
      (t) => t.from_order === nextStart && t.to_order === null,
    );
    if (!hasOpenEnded && sorted.length === 1) {
      // single tier with upper bound is ok
    }
  }

  return null;
}

export function parseCommissionConfig(raw: unknown): CommissionConfig {
  if (!raw || typeof raw !== "object") return DEFAULT_COMMISSION_CONFIG;
  const obj = raw as Partial<CommissionConfig>;
  const tiers = Array.isArray(obj.tiers)
    ? obj.tiers.map((t) => ({
        from_order: Number((t as CommissionTier).from_order),
        to_order:
          (t as CommissionTier).to_order === null ||
          (t as CommissionTier).to_order === undefined
            ? null
            : Number((t as CommissionTier).to_order),
        rate: Number((t as CommissionTier).rate),
      }))
    : DEFAULT_COMMISSION_CONFIG.tiers;

  return {
    reset_period: "monthly",
    timezone: obj.timezone ?? "Asia/Karachi",
    tiers,
  };
}

export function parsePermissions(raw: unknown): AdminPermissions {
  if (!raw || typeof raw !== "object") return {};
  const obj = raw as Record<string, unknown>;
  const scope =
    obj.analytics_scope === "global" || obj.analytics_scope === "own"
      ? obj.analytics_scope
      : undefined;

  const result: AdminPermissions = {};
  for (const key of Object.keys(PERMISSION_LABELS) as PermissionKey[]) {
    if (typeof obj[key] === "boolean") {
      result[key] = obj[key] as boolean;
    }
  }
  if (scope) result.analytics_scope = scope;
  return result;
}

export function permissionsFromForm(formData: FormData): AdminPermissions {
  const keys = Object.keys(PERMISSION_LABELS) as PermissionKey[];
  const permissions: AdminPermissions = {};
  for (const key of keys) {
    if (key === "manage_team") continue;
    permissions[key] = formData.get(`perm_${key}`) === "on";
  }
  const scope = formData.get("analytics_scope");
  if (scope === "own" || scope === "global") {
    permissions.analytics_scope = scope;
  }
  return permissions;
}

export function commissionTiersFromForm(
  formData: FormData,
): CommissionTier[] {
  const count = Number(formData.get("tier_count") ?? 0);
  const tiers: CommissionTier[] = [];
  for (let i = 0; i < count; i++) {
    const from = Number(formData.get(`tier_${i}_from`));
    const toRaw = String(formData.get(`tier_${i}_to`) ?? "").trim();
    const rate = Number(formData.get(`tier_${i}_rate`));
    if (!from || !rate) continue;
    tiers.push({
      from_order: from,
      to_order: toRaw ? Number(toRaw) : null,
      rate,
    });
  }
  return tiers.length ? tiers : DEFAULT_COMMISSION_CONFIG.tiers;
}
