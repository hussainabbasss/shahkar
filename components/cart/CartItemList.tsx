"use client";

import Image from "next/image";
import Link from "next/link";
import { useCart } from "@/lib/cart/cart-context";
import { formatPrice } from "@/lib/pricing";
import type { CartItem } from "@/lib/types";

type CartItemListProps = {
  items: CartItem[];
};

export function CartItemList({ items }: CartItemListProps) {
  const { updateQuantity, removeItem } = useCart();

  return (
    <ul className="space-y-4">
      {items.map((item) => (
        <li
          key={item.productId}
          className="flex gap-4 rounded-2xl border border-border bg-surface p-4"
        >
          <div className="relative h-20 w-20 shrink-0 overflow-hidden rounded-xl">
            <Image
              src={item.image || "/products/placeholder.svg"}
              alt={item.name}
              fill
              className="object-cover"
            />
          </div>
          <div className="flex flex-1 flex-col gap-2">
            <Link
              href={`/products/${item.slug}`}
              className="font-semibold text-heading hover:text-primary"
            >
              {item.name}
            </Link>
            <p className="font-bold text-primary">{formatPrice(item.price)}</p>
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() =>
                  updateQuantity(item.productId, item.quantity - 1)
                }
                className="flex h-10 w-10 items-center justify-center rounded-lg border border-border font-bold"
                aria-label="Decrease quantity"
              >
                −
              </button>
              <span className="min-w-[2ch] text-center font-semibold">
                {item.quantity}
              </span>
              <button
                type="button"
                onClick={() =>
                  updateQuantity(item.productId, item.quantity + 1)
                }
                className="flex h-10 w-10 items-center justify-center rounded-lg border border-border font-bold"
                aria-label="Increase quantity"
              >
                +
              </button>
              <button
                type="button"
                onClick={() => removeItem(item.productId)}
                className="ml-auto text-sm font-semibold text-error"
              >
                Remove
              </button>
            </div>
          </div>
        </li>
      ))}
    </ul>
  );
}
