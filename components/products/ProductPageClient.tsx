"use client";

import { ProductActions } from "@/components/products/ProductActions";
import { StickyAddToCartBar } from "@/components/products/StickyAddToCartBar";
import { useCart } from "@/lib/cart/cart-context";
import type { Product, Sale } from "@/lib/types";

type ProductPageClientProps = {
  product: Product;
  activeSale: Sale | null;
};

export function ProductPageClient({
  product,
  activeSale,
}: ProductPageClientProps) {
  const { addItem } = useCart();

  const handleStickyAdd = () => {
    addItem(product, activeSale);
  };

  return (
    <>
      <ProductActions product={product} activeSale={activeSale} />
      <StickyAddToCartBar
        product={product}
        activeSale={activeSale}
        onAdd={handleStickyAdd}
      />
    </>
  );
}
