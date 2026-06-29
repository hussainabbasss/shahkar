"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { PrimaryButton, SecondaryButton } from "@/components/ui/buttons";
import { useCart } from "@/lib/cart/cart-context";
import { formatPrice, computeDisplayPrice } from "@/lib/pricing";
import type { Product, Sale } from "@/lib/types";

type ProductActionsProps = {
  product: Product;
  activeSale: Sale | null;
};

export function ProductActions({ product, activeSale }: ProductActionsProps) {
  const { addItem } = useCart();
  const router = useRouter();
  const [message, setMessage] = useState<string | null>(null);

  const outOfStock = product.stock <= 0;
  const { currentPrice } = computeDisplayPrice(product, activeSale);

  const handleAddToCart = () => {
    if (outOfStock) return;
    const ok = addItem(product, activeSale);
    if (!ok) {
      setMessage("Out of stock");
      return;
    }
    setMessage("Added to cart ✅");
    window.setTimeout(() => setMessage(null), 2000);
  };

  const handleBuyNow = () => {
    if (outOfStock) return;
    router.push(`/checkout?buy=${encodeURIComponent(product.slug)}`);
  };

  if (outOfStock) {
    return (
      <div className="mt-6">
        <p className="mb-3 text-center font-semibold text-error">
          Out of Stock
        </p>
        <PrimaryButton disabled>Add to Cart</PrimaryButton>
      </div>
    );
  }

  return (
    <div className="mt-6 flex flex-col gap-3">
      <PrimaryButton onClick={handleAddToCart}>Add to Cart</PrimaryButton>
      <SecondaryButton onClick={handleBuyNow}>Order Now</SecondaryButton>
      {message && (
        <p className="text-center text-sm font-semibold text-success">
          {message}
        </p>
      )}
      <p className="text-center text-sm text-muted">
        {formatPrice(currentPrice)} · COD available
      </p>
    </div>
  );
}
