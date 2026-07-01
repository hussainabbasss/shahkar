import { LOW_STOCK_THRESHOLD } from "@/lib/admin/utils";
import type { Order, Product } from "@/lib/types";

export type AutomationType = "order_return" | "low_stock";

export const OPEN_AUTOMATION_STATUSES = ["backlog", "todo", "in_progress"] as const;

export const RETURN_TICKET_DEPARTMENT = "sales";
export const RESTOCK_TICKET_DEPARTMENT = "development";

export function automationKey(type: AutomationType, sourceId: string): string {
  return `${type}:${sourceId}`;
}

export function returnInvestigationTitle(orderNumber: string): string {
  return `Investigate return: ${orderNumber}`;
}

export function restockTicketTitle(productName: string): string {
  return `Restock: ${productName}`;
}

export function isLowStock(stock: number): boolean {
  return stock < LOW_STOCK_THRESHOLD;
}

/** Stock dropped from at/above threshold to below threshold. */
export function crossedIntoLowStock(
  previousStock: number,
  newStock: number,
): boolean {
  return previousStock >= LOW_STOCK_THRESHOLD && newStock < LOW_STOCK_THRESHOLD;
}

export function buildReturnTicketDescription(order: Order): string {
  const lines = [
    "Auto-created when order was marked returned.",
    "",
    `Order: ${order.orderNumber}`,
    `Customer: ${order.customerName}`,
    `Phone: ${order.customerPhone}`,
    `City: ${order.city}`,
    `Status: ${order.status}`,
    `Total: PKR ${order.total.toLocaleString("en-PK")}`,
    "",
    "Line items:",
    ...order.products.map(
      (p) => `• ${p.name} × ${p.quantity} — PKR ${p.price.toLocaleString("en-PK")}`,
    ),
  ];
  return lines.join("\n");
}

export function buildRestockTicketDescription(product: Product): string {
  return [
    "Auto-created when stock fell below the low threshold.",
    "",
    `Product: ${product.name}`,
    `Current stock: ${product.stock}`,
    `Low threshold: below ${LOW_STOCK_THRESHOLD} units`,
    `Slug: ${product.slug}`,
  ].join("\n");
}
