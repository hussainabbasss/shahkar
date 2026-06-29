export function slugify(name: string): string {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, "")
    .replace(/[\s_-]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export function formatCurrency(amount: number): string {
  return `Rs. ${amount.toLocaleString("en-PK")}`;
}

export function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-PK", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function formatDateShort(iso: string): string {
  return new Date(iso).toLocaleDateString("en-PK", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export function getSaleStatus(sale: {
  active: boolean;
  startDate: string;
  endDate: string;
}): "Active" | "Scheduled" | "Expired" | "Inactive" {
  if (!sale.active) return "Inactive";
  const now = Date.now();
  const start = new Date(sale.startDate).getTime();
  const end = new Date(sale.endDate).getTime();
  if (now < start) return "Scheduled";
  if (now > end) return "Expired";
  return "Active";
}

export function getCouponStatus(coupon: {
  active: boolean;
  expiryDate: string | null;
  usageLimit: number | null;
  usesCount: number;
}): "Active" | "Expired" | "Limit Reached" | "Inactive" {
  if (!coupon.active) return "Inactive";
  if (coupon.expiryDate && new Date(coupon.expiryDate).getTime() < Date.now()) {
    return "Expired";
  }
  if (
    coupon.usageLimit !== null &&
    coupon.usesCount >= coupon.usageLimit
  ) {
    return "Limit Reached";
  }
  return "Active";
}

export const ORDER_STATUSES = [
  "pending",
  "confirmed",
  "dispatched",
  "delivered",
  "returned",
] as const;

export const LOW_STOCK_THRESHOLD = 5;

export const ADMIN_NAV = [
  { href: "/admin/dashboard", label: "Dashboard", icon: "📊" },
  { href: "/admin/products", label: "Products", icon: "📦" },
  { href: "/admin/orders", label: "Orders", icon: "🛒" },
  { href: "/admin/sales", label: "Sales", icon: "🏷️" },
  { href: "/admin/coupons", label: "Coupons", icon: "🎟️" },
  { href: "/admin/analytics", label: "Analytics", icon: "📈" },
] as const;
