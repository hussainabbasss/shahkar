import type { AdminUser } from "@/lib/admin/auth";
import {
  hasPermission,
  isSuperAdmin,
  type PermissionKey,
} from "@/lib/admin/permissions";

export type AdminNavIconName =
  | "dashboard"
  | "products"
  | "orders"
  | "sales"
  | "coupons"
  | "team"
  | "compare"
  | "analytics"
  | "messages";

export type AdminNavItem = {
  href: string;
  label: string;
  icon: AdminNavIconName;
  permission?: PermissionKey;
  superAdminOnly?: boolean;
};

export type AdminNavGroup = {
  label: string;
  items: AdminNavItem[];
};

const ALL_NAV_GROUPS: AdminNavGroup[] = [
  {
    label: "Overview",
    items: [
      {
        href: "/admin/dashboard",
        label: "Dashboard",
        icon: "dashboard",
        permission: "view_dashboard",
      },
    ],
  },
  {
    label: "Catalog",
    items: [
      {
        href: "/admin/products",
        label: "Products",
        icon: "products",
        permission: "view_products",
      },
    ],
  },
  {
    label: "Operations",
    items: [
      {
        href: "/admin/orders",
        label: "Orders",
        icon: "orders",
        permission: "view_orders",
      },
      {
        href: "/admin/messages",
        label: "Messages",
        icon: "messages",
      },
    ],
  },
  {
    label: "Marketing",
    items: [
      {
        href: "/admin/sales",
        label: "Sales",
        icon: "sales",
        permission: "view_sales",
      },
      {
        href: "/admin/coupons",
        label: "Coupons",
        icon: "coupons",
        permission: "view_coupons",
      },
    ],
  },
  {
    label: "Team",
    items: [
      {
        href: "/admin/team",
        label: "Team",
        icon: "team",
        superAdminOnly: true,
      },
      {
        href: "/admin/team/compare",
        label: "Compare",
        icon: "compare",
        superAdminOnly: true,
      },
    ],
  },
  {
    label: "Insights",
    items: [
      {
        href: "/admin/analytics",
        label: "Analytics",
        icon: "analytics",
        permission: "view_analytics",
      },
    ],
  },
];

export function buildAdminNavGroups(user: AdminUser): AdminNavGroup[] {
  return ALL_NAV_GROUPS.map((group) => ({
    ...group,
    items: group.items.filter((item) => {
      if (item.superAdminOnly) return isSuperAdmin(user);
      if (!item.permission) return true;
      return hasPermission(user, item.permission);
    }),
  })).filter((group) => group.items.length > 0);
}

/** @deprecated Use buildAdminNavGroups(user) for permission-aware nav */
export const ADMIN_NAV_GROUPS = ALL_NAV_GROUPS;
