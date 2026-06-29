"use server";

import { clearServerCart } from "@/app/actions/cart";
import { validateCoupon } from "@/app/actions/coupons";
import {
  decrementStock,
  getProductsByIds,
} from "@/lib/db/products";
import {
  getCouponByCode,
  recordCouponUsage,
} from "@/lib/db/coupons";
import { insertOrder } from "@/lib/db/orders";
import { getActiveSale } from "@/lib/db/sales";
import { generateUniqueOrderNumber } from "@/lib/orders/generate-order-number";
import { computeDisplayPrice } from "@/lib/pricing";
import { DELIVERY_FEE } from "@/lib/constants";
import type { CreateOrderInput, CreateOrderResult } from "@/lib/types";

const PAK_PHONE_REGEX = /^(?:\+92|0)?3[0-9]{9}$/;

function normalizePhone(phone: string): string {
  const digits = phone.replace(/\D/g, "");
  if (digits.startsWith("92") && digits.length === 12) return `+${digits}`;
  if (digits.startsWith("03") && digits.length === 11) return digits;
  if (digits.length === 10 && digits.startsWith("3")) return `0${digits}`;
  return phone.trim();
}

function validateInput(input: CreateOrderInput): string | null {
  if (!input.customerName.trim()) return "Apna naam likhein";
  if (!input.customerPhone.trim()) return "Phone number zaroori hai";
  if (!PAK_PHONE_REGEX.test(normalizePhone(input.customerPhone))) {
    return "Sahi Pakistani mobile number daalein (03XX-XXXXXXX)";
  }
  if (!input.city.trim()) return "Shehar ka naam likhein";
  if (!input.address.trim()) return "Pura address likhein";
  if (!input.items.length) return "Cart khali hai — pehle products add karein";
  return null;
}

export async function createOrder(
  input: CreateOrderInput,
): Promise<CreateOrderResult> {
  const validationError = validateInput(input);
  if (validationError) {
    return { success: false, error: validationError };
  }

  const phone = normalizePhone(input.customerPhone);
  const productIds = input.items.map((i) => i.productId);
  const [products, activeSale] = await Promise.all([
    getProductsByIds(productIds),
    getActiveSale(),
  ]);

  if (products.length !== productIds.length) {
    return {
      success: false,
      error: "Kuch products ab available nahi hain — cart check karein",
    };
  }

  const lineItems = input.items.map((item) => {
    const product = products.find((p) => p.id === item.productId)!;
    if (product.stock < item.quantity) {
      return { error: `${product.name} ab itni quantity mein available nahi` };
    }
    const { currentPrice } = computeDisplayPrice(product, activeSale);
    return {
      product_id: product.id,
      name: product.name,
      slug: product.slug,
      price: currentPrice,
      quantity: item.quantity,
      image: product.images[0] ?? "",
      stock: product.stock,
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
    stock: number;
  }[];

  const subtotal = validLines.reduce(
    (sum, l) => sum + l.price * l.quantity,
    0,
  );

  let discount = 0;
  let couponCode: string | null = null;

  if (input.couponCode?.trim()) {
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
  }

  const deliveryFee = DELIVERY_FEE;
  const total = subtotal - discount + deliveryFee;

  for (const line of validLines) {
    const ok = await decrementStock(line.product_id, line.quantity);
    if (!ok) {
      return {
        success: false,
        error: `${line.name} ab available nahi — dobara try karein`,
      };
    }
  }

  const orderNumber = await generateUniqueOrderNumber();

  const order = await insertOrder({
    order_number: orderNumber,
    customer_name: input.customerName.trim(),
    customer_phone: phone,
    city: input.city.trim(),
    address: input.address.trim(),
    instructions: input.instructions?.trim() || null,
    products: validLines.map(({ product_id, name, slug, price, quantity, image }) => ({
      product_id,
      name,
      slug,
      price,
      quantity,
      image,
    })),
    subtotal,
    discount,
    delivery_fee: deliveryFee,
    total,
    coupon_code: couponCode,
    notes: null,
  });

  if (!order) {
    return { success: false, error: "Order place nahi ho saka — dobara try karein" };
  }

  if (couponCode) {
    const coupon = await getCouponByCode(couponCode);
    if (coupon) {
      await recordCouponUsage(coupon.id, phone, order.id);
    }
  }

  await clearServerCart();

  return { success: true, orderNumber: order.orderNumber };
}
