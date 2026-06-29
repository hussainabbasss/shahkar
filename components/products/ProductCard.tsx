"use client";

import Image from "next/image";
import Link from "next/link";
import { PrimaryButton } from "@/components/ui/buttons";
import { useCart } from "@/lib/cart/cart-context";
import type { Product, Sale } from "@/lib/types";
import { formatPrice, getProductDisplayPrice } from "@/lib/utils/pricing";

type ProductCardProps = {
  product: Product;
  activeSale: Sale | null;
  priority?: boolean;
};

export function ProductCard({ product, activeSale, priority = false }: ProductCardProps) {
  const { addItem } = useCart();
  const { currentPrice, originalPrice, onSale } = getProductDisplayPrice(
    product,
    activeSale,
  );

  return (
    <article className="group flex flex-col rounded-2xl border border-border bg-surface p-3 shadow-[0_2px_8px_rgba(0,0,0,0.06)] transition-all duration-150 hover:-translate-y-0.5 hover:shadow-[0_8px_24px_rgba(0,0,0,0.12)]">
      <Link href={`/products/${product.slug}`} className="relative block">
        <div className="relative aspect-square overflow-hidden rounded-xl bg-background">
          <Image
            src={product.images[0] ?? "/products/placeholder.svg"}
            alt={product.name}
            fill
            sizes="(max-width: 640px) 50vw, 25vw"
            className="object-cover"
            priority={priority}
          />
          {onSale && (
            <span className="animate-sale-pulse absolute left-2 top-2 rounded-md bg-accent px-2 py-1 text-[11px] font-bold uppercase text-white">
              Sale
            </span>
          )}
        </div>
      </Link>

      <div className="mt-3 flex flex-1 flex-col gap-2">
        <Link href={`/products/${product.slug}`}>
          <h3 className="line-clamp-2 text-lg font-semibold leading-snug text-heading">
            {product.name}
          </h3>
        </Link>

        <div className="flex items-baseline gap-2">
          <span className="text-2xl font-bold text-primary md:text-[32px]">
            {formatPrice(currentPrice)}
          </span>
          {onSale && (
            <span className="text-base text-muted line-through">
              {formatPrice(originalPrice)}
            </span>
          )}
        </div>

        <PrimaryButton
          className="mt-auto active:scale-[0.98]"
          onClick={() => addItem(product, activeSale)}
        >
          Add to Cart
        </PrimaryButton>

        <Link
          href={`/products/${product.slug}`}
          className="text-center text-sm font-semibold text-primary underline-offset-2 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
        >
          View Product
        </Link>
      </div>
    </article>
  );
}
