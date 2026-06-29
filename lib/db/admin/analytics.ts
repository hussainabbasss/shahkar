import { createAdminClient } from "@/lib/supabase/admin";
import { LOW_STOCK_THRESHOLD } from "@/lib/admin/utils";
import {
  countOrdersByStatus,
  getOrderStatsForPeriod,
} from "@/lib/db/admin/orders";
import { getLowStockProducts } from "@/lib/db/admin/products";
import { countActiveCoupons } from "@/lib/db/admin/coupons";

function startOfDay(d: Date): Date {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
}

function startOfWeek(d: Date): Date {
  const x = startOfDay(d);
  const day = x.getDay();
  const diff = day === 0 ? 6 : day - 1;
  x.setDate(x.getDate() - diff);
  return x;
}

function startOfMonth(d: Date): Date {
  return new Date(d.getFullYear(), d.getMonth(), 1);
}

function endOfPreviousDay(d: Date): Date {
  const x = startOfDay(d);
  x.setMilliseconds(-1);
  return x;
}

function startOfPreviousWeek(d: Date): Date {
  const x = startOfWeek(d);
  x.setDate(x.getDate() - 7);
  return x;
}

function endOfPreviousWeek(d: Date): Date {
  const x = startOfWeek(d);
  x.setMilliseconds(-1);
  return x;
}

function startOfPreviousMonth(d: Date): Date {
  return new Date(d.getFullYear(), d.getMonth() - 1, 1);
}

function endOfPreviousMonth(d: Date): Date {
  const x = startOfMonth(d);
  x.setMilliseconds(-1);
  return x;
}

function pctChange(current: number, previous: number): number | null {
  if (previous === 0) return current > 0 ? 100 : current === 0 ? 0 : null;
  return ((current - previous) / previous) * 100;
}

export type PeriodKey = "today" | "week" | "month";

export type PeriodMetric = {
  value: number;
  previous: number;
  changePercent: number | null;
  sparkline: number[];
};

export type DashboardKpiPayload = {
  orders: Record<PeriodKey, PeriodMetric>;
  revenue: Record<PeriodKey, PeriodMetric>;
  pendingOrders: number;
  deliveredOrders: number;
  returnedOrders: number;
  activeCoupons: number;
  lowStockCount: number;
  lowStockProducts: { id: string; name: string; stock: number }[];
  issueCount: number;
};

async function getDailySparkline(
  days: number,
): Promise<{ orders: number[]; revenue: number[] }> {
  const supabase = createAdminClient();
  if (!supabase) {
    return {
      orders: Array(days).fill(0),
      revenue: Array(days).fill(0),
    };
  }

  const start = new Date();
  start.setDate(start.getDate() - (days - 1));
  start.setHours(0, 0, 0, 0);

  const { data, error } = await supabase
    .from("orders")
    .select("total, created_at, status")
    .gte("created_at", start.toISOString())
    .order("created_at", { ascending: true });

  if (error) throw new Error(error.message);

  const orderBuckets = new Map<string, number>();
  const revenueBuckets = new Map<string, number>();

  for (let i = 0; i < days; i++) {
    const d = new Date(start);
    d.setDate(start.getDate() + i);
    const key = d.toISOString().slice(0, 10);
    orderBuckets.set(key, 0);
    revenueBuckets.set(key, 0);
  }

  for (const row of data ?? []) {
    const key = new Date(row.created_at).toISOString().slice(0, 10);
    if (!orderBuckets.has(key)) continue;
    orderBuckets.set(key, (orderBuckets.get(key) ?? 0) + 1);
    if (row.status !== "returned") {
      revenueBuckets.set(
        key,
        (revenueBuckets.get(key) ?? 0) + Number(row.total),
      );
    }
  }

  const keys = Array.from(orderBuckets.keys()).sort();
  return {
    orders: keys.map((k) => orderBuckets.get(k) ?? 0),
    revenue: keys.map((k) => revenueBuckets.get(k) ?? 0),
  };
}

export async function getDashboardKpiPayload(): Promise<DashboardKpiPayload> {
  const now = new Date();
  const [
    todayCurrent,
    todayPrevious,
    weekCurrent,
    weekPrevious,
    monthCurrent,
    monthPrevious,
    pending,
    delivered,
    returned,
    activeCoupons,
    lowStock,
    sparkline,
  ] = await Promise.all([
    getOrderStatsForPeriod(startOfDay(now), now),
    getOrderStatsForPeriod(
      startOfDay(new Date(now.getTime() - 86400000)),
      endOfPreviousDay(now),
    ),
    getOrderStatsForPeriod(startOfWeek(now), now),
    getOrderStatsForPeriod(startOfPreviousWeek(now), endOfPreviousWeek(now)),
    getOrderStatsForPeriod(startOfMonth(now), now),
    getOrderStatsForPeriod(startOfPreviousMonth(now), endOfPreviousMonth(now)),
    countOrdersByStatus("pending"),
    countOrdersByStatus("delivered"),
    countOrdersByStatus("returned"),
    countActiveCoupons(),
    getLowStockProducts(LOW_STOCK_THRESHOLD),
    getDailySparkline(14),
  ]);

  const issueCount =
    (lowStock.length > 0 ? 1 : 0) + (pending > 5 ? 1 : 0);

  return {
    orders: {
      today: {
        value: todayCurrent.count,
        previous: todayPrevious.count,
        changePercent: pctChange(todayCurrent.count, todayPrevious.count),
        sparkline: sparkline.orders,
      },
      week: {
        value: weekCurrent.count,
        previous: weekPrevious.count,
        changePercent: pctChange(weekCurrent.count, weekPrevious.count),
        sparkline: sparkline.orders,
      },
      month: {
        value: monthCurrent.count,
        previous: monthPrevious.count,
        changePercent: pctChange(monthCurrent.count, monthPrevious.count),
        sparkline: sparkline.orders,
      },
    },
    revenue: {
      today: {
        value: todayCurrent.revenue,
        previous: todayPrevious.revenue,
        changePercent: pctChange(todayCurrent.revenue, todayPrevious.revenue),
        sparkline: sparkline.revenue,
      },
      week: {
        value: weekCurrent.revenue,
        previous: weekPrevious.revenue,
        changePercent: pctChange(weekCurrent.revenue, weekPrevious.revenue),
        sparkline: sparkline.revenue,
      },
      month: {
        value: monthCurrent.revenue,
        previous: monthPrevious.revenue,
        changePercent: pctChange(monthCurrent.revenue, monthPrevious.revenue),
        sparkline: sparkline.revenue,
      },
    },
    pendingOrders: pending,
    deliveredOrders: delivered,
    returnedOrders: returned,
    activeCoupons,
    lowStockCount: lowStock.length,
    lowStockProducts: lowStock.map((p) => ({
      id: p.id,
      name: p.name,
      stock: p.stock,
    })),
    issueCount,
  };
}

export type DashboardStats = {
  ordersToday: number;
  ordersWeek: number;
  ordersMonth: number;
  revenueToday: number;
  revenueWeek: number;
  revenueMonth: number;
  pendingOrders: number;
  deliveredOrders: number;
  returnedOrders: number;
  activeCoupons: number;
  lowStockCount: number;
  lowStockProducts: { id: string; name: string; stock: number }[];
};

export async function getDashboardStats(): Promise<DashboardStats> {
  const now = new Date();
  const [today, week, month] = await Promise.all([
    getOrderStatsForPeriod(startOfDay(now), now),
    getOrderStatsForPeriod(startOfWeek(now), now),
    getOrderStatsForPeriod(startOfMonth(now), now),
  ]);

  const [pending, delivered, returned, activeCoupons, lowStock] =
    await Promise.all([
      countOrdersByStatus("pending"),
      countOrdersByStatus("delivered"),
      countOrdersByStatus("returned"),
      countActiveCoupons(),
      getLowStockProducts(LOW_STOCK_THRESHOLD),
    ]);

  return {
    ordersToday: today.count,
    ordersWeek: week.count,
    ordersMonth: month.count,
    revenueToday: today.revenue,
    revenueWeek: week.revenue,
    revenueMonth: month.revenue,
    pendingOrders: pending,
    deliveredOrders: delivered,
    returnedOrders: returned,
    activeCoupons,
    lowStockCount: lowStock.length,
    lowStockProducts: lowStock.map((p) => ({
      id: p.id,
      name: p.name,
      stock: p.stock,
    })),
  };
}

export type AnalyticsData = {
  revenueSeries: { label: string; revenue: number }[];
  ordersSeries: { label: string; placed: number; delivered: number; returned: number }[];
  topProducts: { name: string; quantity: number; revenue: number }[];
  averageOrderValue: number;
  returnRate: number;
  topCities: { city: string; count: number }[];
  topCoupons: { code: string; uses: number }[];
};

export async function getAnalyticsData(
  period: "daily" | "weekly" | "monthly" = "daily",
  filter?: { createdBy?: string; manualOnly?: boolean },
): Promise<AnalyticsData> {
  const supabase = createAdminClient();
  if (!supabase) throw new Error("Supabase not configured");

  let query = supabase
    .from("orders")
    .select("total, status, city, products, coupon_code, created_at, source, created_by")
    .order("created_at", { ascending: true });

  if (filter?.createdBy) {
    query = query.eq("created_by", filter.createdBy);
  }
  if (filter?.manualOnly) {
    query = query.eq("source", "manual");
  }

  const { data: orders, error } = await query;

  if (error) throw new Error(error.message);

  const rows = orders ?? [];
  const totalOrders = rows.length;
  const returnedCount = rows.filter((o) => o.status === "returned").length;
  const totalRevenue = rows
    .filter((o) => o.status !== "returned")
    .reduce((s, o) => s + Number(o.total), 0);

  const productMap = new Map<string, { name: string; qty: number; rev: number }>();
  const cityMap = new Map<string, number>();

  for (const o of rows) {
    cityMap.set(o.city, (cityMap.get(o.city) ?? 0) + 1);
    const products = o.products as { name: string; quantity: number; price: number }[];
    for (const p of products ?? []) {
      const existing = productMap.get(p.name) ?? { name: p.name, qty: 0, rev: 0 };
      existing.qty += p.quantity;
      existing.rev += p.price * p.quantity;
      productMap.set(p.name, existing);
    }
  }

  const { data: coupons } = await supabase
    .from("coupons")
    .select("code, uses_count")
    .gt("uses_count", 0)
    .order("uses_count", { ascending: false })
    .limit(5);

  const revenueSeries = buildRevenueSeries(rows, period);
  const ordersSeries = buildOrdersSeries(rows, period);

  return {
    revenueSeries,
    ordersSeries,
    topProducts: Array.from(productMap.values())
      .sort((a, b) => b.qty - a.qty)
      .slice(0, 10)
      .map((p) => ({ name: p.name, quantity: p.qty, revenue: p.rev })),
    averageOrderValue: totalOrders > 0 ? totalRevenue / totalOrders : 0,
    returnRate: totalOrders > 0 ? (returnedCount / totalOrders) * 100 : 0,
    topCities: Array.from(cityMap.entries())
      .map(([city, count]) => ({ city, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5),
    topCoupons: (coupons ?? []).map((c) => ({
      code: c.code,
      uses: c.uses_count,
    })),
  };
}

type OrderRow = {
  total: number;
  status: string;
  created_at: string;
};

function buildRevenueSeries(
  rows: OrderRow[],
  period: "daily" | "weekly" | "monthly",
): { label: string; revenue: number }[] {
  const buckets = new Map<string, number>();
  const now = new Date();
  const days = period === "daily" ? 14 : period === "weekly" ? 84 : 365;
  const start = new Date(now);
  start.setDate(start.getDate() - days);

  for (const o of rows) {
    const d = new Date(o.created_at);
    if (d < start || o.status === "returned") continue;
    const key = bucketKey(d, period);
    buckets.set(key, (buckets.get(key) ?? 0) + Number(o.total));
  }

  return Array.from(buckets.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([label, revenue]) => ({ label, revenue }));
}

function buildOrdersSeries(
  rows: OrderRow[],
  period: "daily" | "weekly" | "monthly",
): { label: string; placed: number; delivered: number; returned: number }[] {
  const buckets = new Map<
    string,
    { placed: number; delivered: number; returned: number }
  >();
  const now = new Date();
  const days = period === "daily" ? 14 : period === "weekly" ? 84 : 365;
  const start = new Date(now);
  start.setDate(start.getDate() - days);

  for (const o of rows) {
    const d = new Date(o.created_at);
    if (d < start) continue;
    const key = bucketKey(d, period);
    const b = buckets.get(key) ?? { placed: 0, delivered: 0, returned: 0 };
    b.placed += 1;
    if (o.status === "delivered") b.delivered += 1;
    if (o.status === "returned") b.returned += 1;
    buckets.set(key, b);
  }

  return Array.from(buckets.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([label, v]) => ({ label, ...v }));
}

function bucketKey(d: Date, period: "daily" | "weekly" | "monthly"): string {
  if (period === "daily") return d.toISOString().slice(0, 10);
  if (period === "weekly") {
    const start = weekStart(d);
    return start.toISOString().slice(0, 10);
  }
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

function weekStart(d: Date): Date {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  const day = x.getDay();
  const diff = day === 0 ? 6 : day - 1;
  x.setDate(x.getDate() - diff);
  return x;
}
