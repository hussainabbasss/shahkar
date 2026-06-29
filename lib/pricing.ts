import type { Product, ProductDisplayPrice, Sale } from "@/lib/types";

export function formatPrice(amount: number): string {
  return `Rs. ${amount.toLocaleString("en-PK")}`;
}

export function saleAppliesToProduct(product: Product, sale: Sale): boolean {
  switch (sale.appliesTo) {
    case "all":
      return true;
    case "products":
      return sale.productIds.includes(product.id);
    case "categories":
      return sale.categoryNames.includes(product.category);
    default:
      return false;
  }
}

/** Applies product-level sale_price and active site-wide sale rules */
export function computeDisplayPrice(
  product: Product,
  activeSale: Sale | null,
): ProductDisplayPrice {
  const originalPrice = product.originalPrice;
  let currentPrice = product.salePrice ?? product.originalPrice;
  let onSale =
    product.salePrice !== null && product.salePrice < product.originalPrice;

  if (activeSale && saleAppliesToProduct(product, activeSale)) {
    const salePrice =
      activeSale.discountType === "percentage"
        ? Math.round(
            product.originalPrice * (1 - activeSale.discountValue / 100),
          )
        : Math.max(0, product.originalPrice - activeSale.discountValue);

    if (salePrice < currentPrice) {
      currentPrice = salePrice;
      onSale = true;
    }
  }

  return { currentPrice, originalPrice, onSale };
}

/** @deprecated Use computeDisplayPrice */
export const getProductDisplayPrice = computeDisplayPrice;

export function computeCouponDiscount(
  subtotal: number,
  coupon: { discountType: "percentage" | "fixed"; discountValue: number },
): number {
  if (coupon.discountType === "percentage") {
    const pct = Math.min(100, coupon.discountValue);
    return Math.round(subtotal * (pct / 100));
  }
  return Math.min(subtotal, coupon.discountValue);
}
