"use client";

import { PrimaryButton } from "@/components/ui/buttons";
import { formatPrice, computeDisplayPrice } from "@/lib/pricing";
import type { Product, Sale } from "@/lib/types";

type StickyAddToCartBarProps = {
  product: Product;
  activeSale: Sale | null;
  onAdd: () => void;
};

export function StickyAddToCartBar({
  product,
  activeSale,
  onAdd,
}: StickyAddToCartBarProps) {
  const { currentPrice } = computeDisplayPrice(product, activeSale);
  const outOfStock = product.stock <= 0;

  return (
    <div className="fixed inset-x-0 bottom-0 z-40 border-t border-border bg-surface p-4 shadow-[0_-4px_20px_rgba(0,0,0,0.08)] md:hidden">
      <div className="mx-auto flex max-w-lg items-center gap-4">
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-semibold text-heading">
            {product.name}
          </p>
          <p className="text-lg font-bold text-primary">
            {formatPrice(currentPrice)}
          </p>
        </div>
        <PrimaryButton
          fullWidth={false}
          className="min-w-[120px] shrink-0 px-4 text-sm"
          onClick={onAdd}
          disabled={outOfStock}
        >
          {outOfStock ? "Out of Stock" : "Add to Cart"}
        </PrimaryButton>
      </div>
    </div>
  );
}
