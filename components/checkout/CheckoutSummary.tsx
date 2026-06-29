"use client";

import Image from "next/image";
import Link from "next/link";
import { formatPrice } from "@/lib/pricing";
import type { CartItem } from "@/lib/types";
import { DELIVERY_FEE } from "@/lib/constants";

type CheckoutSummaryProps = {
  items: CartItem[];
  subtotal: number;
  discount: number;
};

export function CheckoutSummary({
  items,
  subtotal,
  discount,
}: CheckoutSummaryProps) {
  const total = subtotal - discount + DELIVERY_FEE;

  return (
    <div className="box-border w-full min-w-0 max-w-full rounded-2xl border border-border bg-surface p-4 sm:p-6">
      <h2 className="mb-4 text-lg font-bold text-heading">Order Summary</h2>
      <ul className="mb-4 space-y-3 border-b border-border pb-4">
        {items.map((item) => (
          <li key={item.productId} className="flex min-w-0 gap-3">
            <div className="relative h-14 w-14 shrink-0 overflow-hidden rounded-lg">
              <Image
                src={item.image || "/products/placeholder.svg"}
                alt=""
                fill
                className="object-cover"
              />
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-semibold text-heading">
                {item.name}
              </p>
              <p className="text-sm text-muted">
                {item.quantity} × {formatPrice(item.price)}
              </p>
            </div>
            <p className="shrink-0 text-sm font-semibold text-heading">
              {formatPrice(item.price * item.quantity)}
            </p>
          </li>
        ))}
      </ul>
      <div className="space-y-2 text-sm">
        <div className="flex justify-between">
          <span>Subtotal</span>
          <span>{formatPrice(subtotal)}</span>
        </div>
        {discount > 0 && (
          <div className="flex justify-between text-success">
            <span>Discount</span>
            <span>−{formatPrice(discount)}</span>
          </div>
        )}
        <div className="flex justify-between">
          <span>Delivery</span>
          <span>{formatPrice(DELIVERY_FEE)}</span>
        </div>
        <div className="flex justify-between border-t border-border pt-2 text-base font-bold text-heading">
          <span>Total</span>
          <span className="text-primary">{formatPrice(total)}</span>
        </div>
      </div>
    </div>
  );
}
