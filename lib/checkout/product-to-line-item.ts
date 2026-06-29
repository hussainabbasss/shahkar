import type { CartItem, Product, Sale } from "@/lib/types";
import { computeDisplayPrice } from "@/lib/pricing";

export function productToCheckoutItem(
  product: Product,
  activeSale: Sale | null,
  quantity = 1,
): CartItem {
  const { currentPrice } = computeDisplayPrice(product, activeSale);
  return {
    productId: product.id,
    slug: product.slug,
    name: product.name,
    price: currentPrice,
    image: product.images[0] ?? "",
    quantity,
  };
}
