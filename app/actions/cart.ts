"use server";

import { upsertCart, deleteCart } from "@/lib/db/carts";
import { getOrCreateSessionId } from "@/lib/cart/session";
import type { CartItem } from "@/lib/types";

export async function syncCartToServer(items: CartItem[]): Promise<void> {
  const sessionId = await getOrCreateSessionId();
  const stored = items.map((item) => ({
    product_id: item.productId,
    quantity: item.quantity,
    added_at: item.addedAt ?? new Date().toISOString(),
  }));
  await upsertCart(sessionId, stored);
}

export async function clearServerCart(): Promise<void> {
  const sessionId = await getOrCreateSessionId();
  await deleteCart(sessionId);
}

export async function loadCartFromServer(): Promise<CartItem[] | null> {
  const { getCartBySession } = await import("@/lib/db/carts");
  const { getProductsByIds } = await import("@/lib/db/products");
  const { getActiveSale } = await import("@/lib/db/sales");
  const { computeDisplayPrice } = await import("@/lib/pricing");
  const { getSessionId } = await import("@/lib/cart/session");

  const sessionId = await getSessionId();
  if (!sessionId) return null;

  const raw = await getCartBySession(sessionId);
  if (!raw || !Array.isArray(raw)) return null;

  // Rehydrate full cart items from product IDs stored in Supabase
  const stored = raw as unknown as {
    product_id: string;
    quantity: number;
    added_at?: string;
  }[];

  if (!stored.length) return [];

  const productIds = stored.map((s) => s.product_id);
  const [products, activeSale] = await Promise.all([
    getProductsByIds(productIds),
    getActiveSale(),
  ]);

  return stored
    .map((s) => {
      const product = products.find((p) => p.id === s.product_id);
      if (!product) return null;
      const { currentPrice } = computeDisplayPrice(product, activeSale);
      return {
        productId: product.id,
        slug: product.slug,
        name: product.name,
        price: currentPrice,
        image: product.images[0] ?? "",
        quantity: s.quantity,
        addedAt: s.added_at,
      } as CartItem;
    })
    .filter((item): item is CartItem => item !== null);
}
