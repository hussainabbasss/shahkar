import {
  DEFAULT_COMMISSION_CONFIG,
  type CommissionConfig,
  type CommissionTier,
  validateCommissionTiers,
} from "@/lib/admin/permissions";
import { createAdminClient } from "@/lib/supabase/admin";

const PKT = "Asia/Karachi";

export function getPeriodMonthPKT(date: Date = new Date()): string {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: PKT,
    year: "numeric",
    month: "2-digit",
  }).formatToParts(date);

  const year = parts.find((p) => p.type === "year")?.value ?? "1970";
  const month = parts.find((p) => p.type === "month")?.value ?? "01";
  return `${year}-${month}-01`;
}

export function getTierForOrderNumber(
  orderNumber: number,
  config: CommissionConfig = DEFAULT_COMMISSION_CONFIG,
): CommissionTier | null {
  const sorted = [...config.tiers].sort(
    (a, b) => a.from_order - b.from_order,
  );
  for (const tier of sorted) {
    const upper = tier.to_order ?? Infinity;
    if (orderNumber >= tier.from_order && orderNumber <= upper) {
      return tier;
    }
  }
  return null;
}

export async function countDeliveredManualOrdersInPeriod(
  userId: string,
  periodMonth: string,
  excludeOrderId?: string,
): Promise<number> {
  const supabase = createAdminClient();
  if (!supabase) return 0;

  const start = new Date(`${periodMonth}T00:00:00+05:00`);
  const end = new Date(start);
  end.setMonth(end.getMonth() + 1);

  let query = supabase
    .from("orders")
    .select("id", { count: "exact", head: true })
    .eq("created_by", userId)
    .eq("source", "manual")
    .eq("status", "delivered")
    .gte("updated_at", start.toISOString())
    .lt("updated_at", end.toISOString());

  if (excludeOrderId) {
    query = query.neq("id", excludeOrderId);
  }

  const { count, error } = await query;
  if (error) throw new Error(error.message);
  return count ?? 0;
}

type OrderForCommission = {
  id: string;
  source: string;
  created_by: string | null;
  status: string;
};

type CreatorProfile = {
  commission_enabled: boolean;
  commission_config: unknown;
};

export async function processCommissionOnDeliver(
  order: OrderForCommission,
  deliveredAt: Date = new Date(),
): Promise<void> {
  if (
    order.source !== "manual" ||
    !order.created_by ||
    order.status !== "delivered"
  ) {
    return;
  }

  const supabase = createAdminClient();
  if (!supabase) return;

  const { data: profile, error: profileError } = await supabase
    .from("admin_profiles")
    .select("commission_enabled, commission_config")
    .eq("id", order.created_by)
    .maybeSingle();

  if (profileError) throw new Error(profileError.message);
  if (!profile?.commission_enabled) return;

  const config =
    profile.commission_config &&
    typeof profile.commission_config === "object"
      ? (profile.commission_config as CommissionConfig)
      : DEFAULT_COMMISSION_CONFIG;

  const tierError = validateCommissionTiers(config.tiers);
  if (tierError) return;

  const periodMonth = getPeriodMonthPKT(deliveredAt);
  const existingCount = await countDeliveredManualOrdersInPeriod(
    order.created_by,
    periodMonth,
    order.id,
  );
  const periodOrderNumber = existingCount + 1;
  const tier = getTierForOrderNumber(periodOrderNumber, config);
  if (!tier) return;

  const { error } = await supabase.from("commission_entries").upsert(
    {
      user_id: order.created_by,
      order_id: order.id,
      amount: tier.rate,
      period_month: periodMonth,
      period_order_number: periodOrderNumber,
      tier_from_order: tier.from_order,
      tier_to_order: tier.to_order,
      tier_rate: tier.rate,
      delivered_at: deliveredAt.toISOString(),
    },
    { onConflict: "order_id" },
  );

  if (error) throw new Error(error.message);
}

export async function reverseCommissionForOrder(orderId: string): Promise<void> {
  const supabase = createAdminClient();
  if (!supabase) return;

  const { error } = await supabase
    .from("commission_entries")
    .delete()
    .eq("order_id", orderId);

  if (error) throw new Error(error.message);
}

export type CommissionSummary = {
  periodMonth: string;
  totalEarned: number;
  deliveredCount: number;
  currentTier: CommissionTier | null;
  nextPeriodReset: string;
  byTier: { label: string; count: number; amount: number }[];
};

export async function getCommissionSummaryForUser(
  userId: string,
  config: CommissionConfig = DEFAULT_COMMISSION_CONFIG,
): Promise<CommissionSummary> {
  const supabase = createAdminClient();
  const periodMonth = getPeriodMonthPKT();

  if (!supabase) {
    return {
      periodMonth,
      totalEarned: 0,
      deliveredCount: 0,
      currentTier: null,
      nextPeriodReset: getNextPeriodResetPKT(),
      byTier: [],
    };
  }

  const { data, error } = await supabase
    .from("commission_entries")
    .select("*")
    .eq("user_id", userId)
    .eq("period_month", periodMonth)
    .order("period_order_number", { ascending: true });

  if (error) throw new Error(error.message);

  const entries = data ?? [];
  const totalEarned = entries.reduce((s, e) => s + Number(e.amount), 0);
  const deliveredCount = entries.length;
  const currentTier = getTierForOrderNumber(
    deliveredCount + 1,
    config,
  );

  const tierMap = new Map<string, { count: number; amount: number }>();
  for (const e of entries) {
    const label =
      e.tier_to_order === null
        ? `${e.tier_from_order}+ @ Rs. ${e.tier_rate}`
        : `${e.tier_from_order}–${e.tier_to_order} @ Rs. ${e.tier_rate}`;
    const existing = tierMap.get(label) ?? { count: 0, amount: 0 };
    existing.count += 1;
    existing.amount += Number(e.amount);
    tierMap.set(label, existing);
  }

  return {
    periodMonth,
    totalEarned,
    deliveredCount,
    currentTier,
    nextPeriodReset: getNextPeriodResetPKT(),
    byTier: Array.from(tierMap.entries()).map(([label, v]) => ({
      label,
      ...v,
    })),
  };
}

function getNextPeriodResetPKT(): string {
  const now = new Date();
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: PKT,
    year: "numeric",
    month: "numeric",
  }).formatToParts(now);
  const year = Number(parts.find((p) => p.type === "year")?.value ?? 2026);
  const month = Number(parts.find((p) => p.type === "month")?.value ?? 1);
  const next = month === 12 ? `${year + 1}-01-01` : `${year}-${String(month + 1).padStart(2, "0")}-01`;
  return next;
}
