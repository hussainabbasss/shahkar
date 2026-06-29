"use server";

import { revalidatePath } from "next/cache";
import { validateCoupon } from "@/app/actions/coupons";
import {
  canSetOrderStatus,
  getAllowedOrderStatuses,
  hasPermission,
} from "@/lib/admin/permissions";
import { requirePermission } from "@/lib/admin/guards";
import { requireAdmin } from "@/lib/admin/auth";
import {
  getOrderByNumberAdmin,
  insertManualOrderAdmin,
  updateOrderAdmin,
} from "@/lib/db/admin/orders";
import { decrementStock, getProductsByIds } from "@/lib/db/products";
import { getCouponByCode, recordCouponUsage } from "@/lib/db/coupons";
import { getActiveSale } from "@/lib/db/sales";
import { generateUniqueOrderNumber } from "@/lib/orders/generate-order-number";
import { computeDisplayPrice } from "@/lib/pricing";
import { DELIVERY_FEE } from "@/lib/constants";
import type { CreateManualOrderInput, OrderStatus } from "@/lib/types";

export type ActionResult = { success: true } | { success: false; error: string };

const PAK_PHONE_REGEX = /^(?:\+92|0)?3[0-9]{9}$/;

function normalizePhone(phone: string): string {
  const digits = phone.replace(/\D/g, "");
  if (digits.startsWith("92") && digits.length === 12) return `+${digits}`;
  if (digits.startsWith("03") && digits.length === 11) return digits;
  if (digits.length === 10 && digits.startsWith("3")) return `0${digits}`;
  return phone.trim();
}

export async function updateOrderAction(
  orderNumber: string,
  formData: FormData,
): Promise<ActionResult> {
  try {
    const admin = await requirePermission("view_orders");
    const existing = await getOrderByNumberAdmin(orderNumber);
    if (!existing) return { success: false, error: "Order not found." };

    const status = formData.get("status") as OrderStatus | null;
    const postexTracking =
      String(formData.get("postexTracking") ?? "").trim() || null;
    const notes = String(formData.get("notes") ?? "").trim() || null;

    if (status && status !== existing.status) {
      if (!canSetOrderStatus(admin, existing.status, status)) {
        return {
          success: false,
          error: "You do not have permission to set this status.",
        };
      }
    }

    await updateOrderAdmin(orderNumber, {
      ...(status ? { status } : {}),
      postexTracking,
      notes,
    });

    revalidatePath("/admin/orders");
    revalidatePath("/admin/dashboard");
    revalidatePath(`/admin/orders/${orderNumber}`);
    return { success: true };
  } catch (e) {
    return { success: false, error: (e as Error).message };
  }
}

export async function createManualOrderAction(
  input: CreateManualOrderInput,
): Promise<ActionResult & { orderNumber?: string }> {
  try {
    const admin = await requirePermission("create_orders");

    if (!input.customerName.trim()) {
      return { success: false, error: "Customer name is required." };
    }
    if (!PAK_PHONE_REGEX.test(normalizePhone(input.customerPhone))) {
      return { success: false, error: "Enter a valid Pakistani mobile number." };
    }
    if (!input.city.trim() || !input.address.trim()) {
      return { success: false, error: "City and address are required." };
    }
    if (!input.items.length) {
      return { success: false, error: "Add at least one product." };
    }

    const status = input.status ?? "pending";
    const allowed = getAllowedOrderStatuses(admin);
    if (!allowed.includes(status)) {
      return {
        success: false,
        error: "You cannot set the initial status to that value.",
      };
    }

    const productIds = input.items.map((i) => i.productId);
    const [products, activeSale] = await Promise.all([
      getProductsByIds(productIds),
      getActiveSale(),
    ]);

    if (products.length !== productIds.length) {
      return { success: false, error: "One or more products are unavailable." };
    }

    const lineItems = input.items.map((item) => {
      const product = products.find((p) => p.id === item.productId)!;
      if (product.stock < item.quantity) {
        return { error: `${product.name} is out of stock for that quantity.` };
      }
      const { currentPrice } = computeDisplayPrice(product, activeSale);
      return {
        product_id: product.id,
        name: product.name,
        slug: product.slug,
        price: currentPrice,
        quantity: item.quantity,
        image: product.images[0] ?? "",
      };
    });

    const stockError = lineItems.find(
      (l): l is { error: string } => "error" in l,
    );
    if (stockError) {
      return { success: false, error: stockError.error };
    }

    const validLines = lineItems as {
      product_id: string;
      name: string;
      slug: string;
      price: number;
      quantity: number;
      image: string;
    }[];

    const subtotal = validLines.reduce(
      (sum, l) => sum + l.price * l.quantity,
      0,
    );

    let discount = 0;
    let couponCode: string | null = null;
    const phone = normalizePhone(input.customerPhone);

    if (input.couponCode?.trim()) {
      if (hasPermission(admin, "manage_coupons")) {
        const couponResult = await validateCoupon(
          input.couponCode,
          subtotal,
          phone,
        );
        if (!couponResult.valid) {
          return { success: false, error: couponResult.error };
        }
        discount = couponResult.discount;
        couponCode = couponResult.code;
      } else {
        couponCode = input.couponCode.trim().toUpperCase();
      }
    }

    const deliveryFee = input.deliveryFee ?? DELIVERY_FEE;
    const total = subtotal - discount + deliveryFee;

    for (const line of validLines) {
      const ok = await decrementStock(line.product_id, line.quantity);
      if (!ok) {
        return {
          success: false,
          error: `${line.name} is no longer available.`,
        };
      }
    }

    const orderNumber = await generateUniqueOrderNumber();

    const order = await insertManualOrderAdmin({
      order_number: orderNumber,
      customer_name: input.customerName.trim(),
      customer_phone: phone,
      city: input.city.trim(),
      address: input.address.trim(),
      instructions: input.instructions?.trim() || null,
      products: validLines,
      subtotal,
      discount,
      delivery_fee: deliveryFee,
      total,
      coupon_code: couponCode,
      notes: null,
      postex_tracking: null,
      created_by: admin.id,
      status,
      source: "manual",
    });

    if (couponCode && hasPermission(admin, "manage_coupons")) {
      const coupon = await getCouponByCode(couponCode);
      if (coupon) {
        await recordCouponUsage(coupon.id, phone, order.id);
      }
    }

    revalidatePath("/admin/orders");
    revalidatePath("/admin/dashboard");
    revalidatePath("/admin/analytics");

    return { success: true, orderNumber: order.orderNumber };
  } catch (e) {
    return { success: false, error: (e as Error).message };
  }
}

export async function getManualOrderProductsAction() {
  await requirePermission("create_orders");
  const { listAllProductsAdmin } = await import("@/lib/db/admin/products");
  const products = await listAllProductsAdmin();
  return products
    .filter((p) => p.active)
    .map((p) => ({
      id: p.id,
      name: p.name,
      slug: p.slug,
      stock: p.stock,
      originalPrice: p.originalPrice,
      salePrice: p.salePrice,
      image: p.images[0] ?? "",
    }));
}
