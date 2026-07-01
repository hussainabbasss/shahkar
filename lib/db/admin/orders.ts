import { mapOrder, type DbOrder } from "@/lib/db/mappers";
import { createAdminClient } from "@/lib/supabase/admin";
import type { Order, OrderStatus, OrderWithCreator } from "@/lib/types";
import {
  processCommissionOnDeliver,
  reverseCommissionForOrder,
} from "@/lib/admin/commission";

function requireAdmin() {
  const supabase = createAdminClient();
  if (!supabase) throw new Error("Supabase not configured");
  return supabase;
}

export type OrdersFilter = {
  status?: OrderStatus | "all";
  search?: string;
  createdBy?: string | "website" | "all";
  source?: "storefront" | "manual" | "all";
  limit?: number;
  offset?: number;
};

type DbOrderRow = DbOrder & {
  creator?: { name: string } | { name: string }[] | null;
};

function mapOrderWithCreator(row: DbOrderRow): OrderWithCreator {
  const order = mapOrder(row);
  const creator = row.creator;
  const creatorName = Array.isArray(creator)
    ? creator[0]?.name ?? null
    : creator?.name ?? null;
  return { ...order, creatorName };
}

const ORDER_LIST_COLUMNS =
  "id, order_number, customer_name, customer_phone, city, total, status, created_at, source, created_by";

type DbOrderListRow = {
  id: string;
  order_number: string;
  customer_name: string;
  customer_phone: string;
  city: string;
  total: number;
  status: string;
  created_at: string;
  source?: string;
  created_by?: string | null;
  creator?: { name: string } | { name: string }[] | null;
};

function mapOrderListRow(row: DbOrderListRow): OrderWithCreator {
  const creator = row.creator;
  const creatorName = Array.isArray(creator)
    ? creator[0]?.name ?? null
    : creator?.name ?? null;
  return {
    id: row.id,
    orderNumber: row.order_number,
    customerName: row.customer_name,
    customerPhone: row.customer_phone,
    city: row.city,
    address: "",
    instructions: null,
    products: [],
    subtotal: Number(row.total),
    discount: 0,
    deliveryFee: 0,
    total: Number(row.total),
    couponCode: null,
    status: row.status as Order["status"],
    postexTracking: null,
    notes: null,
    source: (row.source ?? "storefront") as Order["source"],
    createdBy: row.created_by ?? null,
    createdAt: row.created_at,
    creatorName,
  };
}

export async function listOrdersAdmin(
  filter: OrdersFilter = {},
): Promise<{ orders: OrderWithCreator[]; total: number }> {
  const supabase = requireAdmin();
  const {
    status = "all",
    search,
    createdBy = "all",
    source = "all",
    limit = 50,
    offset = 0,
  } = filter;

  let query = supabase
    .from("orders")
    .select(
      `${ORDER_LIST_COLUMNS}, creator:admin_profiles!orders_created_by_fkey(name)`,
      { count: "exact" },
    )
    .order("created_at", { ascending: false })
    .range(offset, offset + limit - 1);

  if (status !== "all") {
    query = query.eq("status", status);
  }

  if (source !== "all") {
    query = query.eq("source", source);
  }

  if (createdBy === "website") {
    query = query.is("created_by", null);
  } else if (createdBy !== "all") {
    query = query.eq("created_by", createdBy);
  }

  if (search?.trim()) {
    const term = search.trim();
    query = query.or(
      `order_number.ilike.%${term}%,customer_phone.ilike.%${term}%`,
    );
  }

  const { data, error, count } = await query;
  if (error) throw new Error(error.message);

  return {
    orders: (data as DbOrderListRow[]).map(mapOrderListRow),
    total: count ?? 0,
  };
}

export async function getRecentOrdersAdmin(limit = 10): Promise<OrderWithCreator[]> {
  const { orders } = await listOrdersAdmin({ limit });
  return orders;
}

export async function getOrderByNumberAdmin(
  orderNumber: string,
): Promise<OrderWithCreator | null> {
  const supabase = requireAdmin();
  const { data, error } = await supabase
    .from("orders")
    .select("*, creator:admin_profiles!orders_created_by_fkey(name)")
    .eq("order_number", orderNumber)
    .maybeSingle();

  if (error) throw new Error(error.message);
  if (!data) return null;
  return mapOrderWithCreator(data as DbOrderRow);
}

export async function updateOrderAdmin(
  orderNumber: string,
  updates: {
    status?: OrderStatus;
    postexTracking?: string | null;
    notes?: string | null;
  },
  options?: { actorId?: string },
): Promise<OrderWithCreator> {
  const supabase = requireAdmin();

  const { data: existing, error: fetchError } = await supabase
    .from("orders")
    .select("*")
    .eq("order_number", orderNumber)
    .single();

  if (fetchError) throw new Error(fetchError.message);

  const previousStatus = existing.status as OrderStatus;
  const payload: Record<string, unknown> = {
    updated_at: new Date().toISOString(),
  };
  if (updates.status !== undefined) payload.status = updates.status;
  if (updates.postexTracking !== undefined)
    payload.postex_tracking = updates.postexTracking;
  if (updates.notes !== undefined) payload.notes = updates.notes;

  const { data, error } = await supabase
    .from("orders")
    .update(payload)
    .eq("order_number", orderNumber)
    .select("*, creator:admin_profiles!orders_created_by_fkey(name)")
    .single();

  if (error) throw new Error(error.message);

  const newStatus = (updates.status ?? previousStatus) as OrderStatus;

  if (newStatus === "delivered" && previousStatus !== "delivered") {
    await processCommissionOnDeliver(
      {
        id: data.id,
        source: data.source ?? "storefront",
        created_by: data.created_by,
        status: "delivered",
      },
      new Date(),
    );
  }

  if (
    newStatus === "returned" &&
    (previousStatus === "delivered" || previousStatus === "returned")
  ) {
    await reverseCommissionForOrder(data.id);
  }

  if (newStatus === "returned" && previousStatus !== "returned") {
    const order = mapOrderWithCreator(data as DbOrderRow);
    const { maybeCreateReturnInvestigationTicket } = await import(
      "@/lib/db/admin/ticket-automation"
    );
    await maybeCreateReturnInvestigationTicket(order, options?.actorId);
  }

  return mapOrderWithCreator(data as DbOrderRow);
}

export async function insertManualOrderAdmin(
  order: Omit<DbOrder, "id" | "created_at"> & {
    created_by: string;
    status: OrderStatus;
  },
): Promise<OrderWithCreator> {
  const supabase = requireAdmin();
  const now = new Date().toISOString();

  const { data, error } = await supabase
    .from("orders")
    .insert({
      ...order,
      source: "manual",
      updated_at: now,
    })
    .select("*, creator:admin_profiles!orders_created_by_fkey(name)")
    .single();

  if (error) throw new Error(error.message);

  if (order.status === "delivered") {
    await processCommissionOnDeliver(
      {
        id: data.id,
        source: "manual",
        created_by: order.created_by,
        status: "delivered",
      },
      new Date(now),
    );
  }

  return mapOrderWithCreator(data as DbOrderRow);
}

export async function countOrdersByStatus(
  status: OrderStatus,
): Promise<number> {
  const supabase = requireAdmin();
  const { count, error } = await supabase
    .from("orders")
    .select("*", { count: "exact", head: true })
    .eq("status", status);

  if (error) throw new Error(error.message);
  return count ?? 0;
}

export async function getOrderStatsForPeriod(
  start: Date,
  end: Date,
  filter?: { createdBy?: string; manualOnly?: boolean },
): Promise<{ count: number; revenue: number }> {
  const supabase = requireAdmin();

  const { data, error } = await supabase.rpc("get_order_stats_for_period", {
    p_start: start.toISOString(),
    p_end: end.toISOString(),
    p_created_by: filter?.createdBy ?? null,
    p_manual_only: filter?.manualOnly ?? false,
  });

  if (error) {
    // Fallback when migration 010 not applied yet
    let query = supabase
      .from("orders")
      .select("total", { count: "exact", head: true })
      .gte("created_at", start.toISOString())
      .lte("created_at", end.toISOString())
      .neq("status", "returned");

    if (filter?.createdBy) {
      query = query.eq("created_by", filter.createdBy);
    }
    if (filter?.manualOnly) {
      query = query.eq("source", "manual");
    }

    const { count, error: countError } = await query;
    if (countError) throw new Error(countError.message);

    let sumQuery = supabase
      .from("orders")
      .select("total")
      .gte("created_at", start.toISOString())
      .lte("created_at", end.toISOString())
      .neq("status", "returned");

    if (filter?.createdBy) {
      sumQuery = sumQuery.eq("created_by", filter.createdBy);
    }
    if (filter?.manualOnly) {
      sumQuery = sumQuery.eq("source", "manual");
    }

    const { data: sumRows, error: sumError } = await sumQuery;
    if (sumError) throw new Error(sumError.message);

    const rows = sumRows ?? [];
    return {
      count: count ?? 0,
      revenue: rows.reduce((sum, r) => sum + Number(r.total), 0),
    };
  }

  const row = Array.isArray(data) ? data[0] : data;
  return {
    count: Number(row?.order_count ?? 0),
    revenue: Number(row?.order_revenue ?? 0),
  };
}

export async function listStaffForFilter(): Promise<
  { id: string; name: string }[]
> {
  const supabase = requireAdmin();
  const { data, error } = await supabase
    .from("admin_profiles")
    .select("id, name")
    .neq("role", "admin")
    .eq("active", true)
    .order("name");

  if (error) throw new Error(error.message);
  return (data ?? []).map((r) => ({ id: r.id, name: r.name }));
}

export async function countManualOrdersByStaff(userId: string): Promise<number> {
  const supabase = requireAdmin();
  const { count, error } = await supabase
    .from("orders")
    .select("*", { count: "exact", head: true })
    .eq("created_by", userId)
    .eq("source", "manual");

  if (error) throw new Error(error.message);
  return count ?? 0;
}
