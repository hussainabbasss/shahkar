import {
  OPEN_AUTOMATION_STATUSES,
  RETURN_TICKET_DEPARTMENT,
  RESTOCK_TICKET_DEPARTMENT,
  automationKey,
  buildRestockTicketDescription,
  buildReturnTicketDescription,
  crossedIntoLowStock,
  returnInvestigationTitle,
  restockTicketTitle,
} from "@/lib/admin/ticket-automation";
import { createAdminClient } from "@/lib/supabase/admin";
import { getProductByIdAdmin } from "@/lib/db/admin/products";
import type { AdminTicket } from "@/lib/db/admin/tickets";
import type { Order } from "@/lib/types";

function requireAdmin() {
  const supabase = createAdminClient();
  if (!supabase) throw new Error("Supabase not configured");
  return supabase;
}

let cachedReporterId: string | null = null;

async function resolveReporterId(explicitId?: string): Promise<string | null> {
  if (explicitId) return explicitId;

  if (cachedReporterId) return cachedReporterId;

  const supabase = requireAdmin();
  const { data } = await supabase
    .from("admin_profiles")
    .select("id")
    .eq("role", "admin")
    .eq("active", true)
    .order("created_at", { ascending: true })
    .limit(1)
    .maybeSingle();

  if (data?.id) {
    cachedReporterId = data.id as string;
    return cachedReporterId;
  }

  const { data: fallback } = await supabase
    .from("admin_profiles")
    .select("id")
    .eq("active", true)
    .order("created_at", { ascending: true })
    .limit(1)
    .maybeSingle();

  cachedReporterId = (fallback?.id as string) ?? null;
  return cachedReporterId;
}

async function hasOpenAutomationTicket(key: string): Promise<boolean> {
  const supabase = requireAdmin();
  const { data, error } = await supabase
    .from("admin_tickets")
    .select("id")
    .eq("automation_key", key)
    .in("status", [...OPEN_AUTOMATION_STATUSES])
    .limit(1)
    .maybeSingle();

  if (error) throw new Error(error.message);
  return !!data;
}

async function insertAutomationTicket(input: {
  title: string;
  description: string;
  department: string;
  reporterId: string;
  linkedOrderId?: string | null;
  linkedProductId?: string | null;
  automationKey: string;
}): Promise<AdminTicket | null> {
  const supabase = requireAdmin();
  const { data, error } = await supabase
    .from("admin_tickets")
    .insert({
      issue_type: "task",
      department: input.department,
      parent_id: null,
      title: input.title,
      description: input.description,
      status: "todo",
      priority: "medium",
      assignee_id: null,
      reporter_id: input.reporterId,
      linked_order_id: input.linkedOrderId ?? null,
      linked_product_id: input.linkedProductId ?? null,
      automation_key: input.automationKey,
    })
    .select("id")
    .single();

  if (error) {
    console.error("[ticket-automation] insert failed:", error.message);
    return null;
  }

  const { getTicketById } = await import("@/lib/db/admin/tickets");
  return getTicketById(data.id as string);
}

export async function maybeCreateReturnInvestigationTicket(
  order: Order,
  actorId?: string,
): Promise<AdminTicket | null> {
  try {
    const key = automationKey("order_return", order.id);
    if (await hasOpenAutomationTicket(key)) return null;

    const reporterId = await resolveReporterId(actorId);
    if (!reporterId) {
      console.error("[ticket-automation] no reporter for return ticket");
      return null;
    }

    return insertAutomationTicket({
      title: returnInvestigationTitle(order.orderNumber),
      description: buildReturnTicketDescription(order),
      department: RETURN_TICKET_DEPARTMENT,
      reporterId,
      linkedOrderId: order.id,
      automationKey: key,
    });
  } catch (err) {
    console.error("[ticket-automation] return ticket failed:", err);
    return null;
  }
}

export async function maybeCreateRestockTicket(
  productId: string,
  previousStock: number,
  newStock: number,
  actorId?: string,
): Promise<AdminTicket | null> {
  if (!crossedIntoLowStock(previousStock, newStock)) return null;

  try {
    const key = automationKey("low_stock", productId);
    if (await hasOpenAutomationTicket(key)) return null;

    const product = await getProductByIdAdmin(productId);
    if (!product || !product.active) return null;

    const reporterId = await resolveReporterId(actorId);
    if (!reporterId) {
      console.error("[ticket-automation] no reporter for restock ticket");
      return null;
    }

    return insertAutomationTicket({
      title: restockTicketTitle(product.name),
      description: buildRestockTicketDescription({ ...product, stock: newStock }),
      department: RESTOCK_TICKET_DEPARTMENT,
      reporterId,
      linkedProductId: product.id,
      automationKey: key,
    });
  } catch (err) {
    console.error("[ticket-automation] restock ticket failed:", err);
    return null;
  }
}

export async function notifyStockChange(
  productId: string,
  previousStock: number,
  newStock: number,
  actorId?: string,
): Promise<void> {
  await maybeCreateRestockTicket(productId, previousStock, newStock, actorId);
}
