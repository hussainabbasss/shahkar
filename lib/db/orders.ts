import { mapOrder, type DbOrder } from "@/lib/db/mappers";
import { createAdminClient } from "@/lib/supabase/admin";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import type { Order } from "@/lib/types";

const devOrders = new Map<string, Order>();

export async function getOrderByNumber(
  orderNumber: string,
): Promise<Order | null> {
  if (!isSupabaseConfigured()) {
    return devOrders.get(orderNumber) ?? null;
  }

  const supabase = createAdminClient()!;
  const { data, error } = await supabase
    .from("orders")
    .select("*")
    .eq("order_number", orderNumber)
    .maybeSingle();

  if (error) {
    console.error("[getOrderByNumber]", error.message);
    return null;
  }
  if (!data) return null;
  return mapOrder(data as DbOrder);
}

export async function insertOrder(
  order: Omit<DbOrder, "id" | "created_at" | "status" | "postex_tracking">,
): Promise<Order | null> {
  if (!isSupabaseConfigured()) {
    console.warn(
      "[insertOrder] Supabase env vars missing — order saved in memory only. Copy .env.example to .env.local and restart the dev server.",
    );
    const mapped: Order = {
      id: "local-order",
      orderNumber: order.order_number,
      customerName: order.customer_name,
      customerPhone: order.customer_phone,
      city: order.city,
      address: order.address,
      instructions: order.instructions,
      products: order.products,
      subtotal: Number(order.subtotal),
      discount: Number(order.discount),
      deliveryFee: Number(order.delivery_fee),
      total: Number(order.total),
      couponCode: order.coupon_code,
      status: "pending",
      postexTracking: null,
      notes: null,
      source: "storefront",
      createdBy: null,
      createdAt: new Date().toISOString(),
    };
    devOrders.set(order.order_number, mapped);
    return mapped;
  }

  const supabase = createAdminClient()!;
  const { data, error } = await supabase
    .from("orders")
    .insert({
      order_number: order.order_number,
      customer_name: order.customer_name,
      customer_phone: order.customer_phone,
      city: order.city,
      address: order.address,
      instructions: order.instructions,
      products: order.products,
      subtotal: order.subtotal,
      discount: order.discount,
      delivery_fee: order.delivery_fee,
      total: order.total,
      coupon_code: order.coupon_code,
      notes: order.notes,
      source: "storefront",
      status: "pending",
      updated_at: new Date().toISOString(),
    })
    .select()
    .single();

  if (error) {
    console.error("[insertOrder] Supabase error:", error.message, error.details, error.hint);
    return null;
  }
  if (!data) return null;
  return mapOrder(data as DbOrder);
}
