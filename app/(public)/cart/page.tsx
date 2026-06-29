"use client";

import Link from "next/link";
import { useState } from "react";
import { CartEmptyState } from "@/components/cart/CartEmptyState";
import { CartItemList } from "@/components/cart/CartItemList";
import { CouponInput } from "@/components/cart/CouponInput";
import {
  getOrderTotal,
  OrderSummary,
} from "@/components/cart/OrderSummary";
import { PrimaryButton } from "@/components/ui/buttons";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { useCart } from "@/lib/cart/cart-context";

export default function CartPage() {
  const { items, subtotal, hydrated } = useCart();
  const [couponCode, setCouponCode] = useState<string | null>(null);
  const [discount, setDiscount] = useState(0);

  if (!hydrated) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-12 md:px-8">
        <SectionHeading className="mb-8">Aapka Cart</SectionHeading>
        <p className="text-body">Loading...</p>
      </div>
    );
  }

  if (items.length === 0) {
    return <CartEmptyState />;
  }

  const total = getOrderTotal(subtotal, discount);

  return (
    <div className="mx-auto max-w-2xl px-4 py-12 md:px-8">
      <SectionHeading className="mb-8">Aapka Cart</SectionHeading>
      <CartItemList items={items} />

      <div className="mt-8 space-y-6">
        <CouponInput
          subtotal={subtotal}
          appliedCode={couponCode}
          discount={discount}
          onApply={(code, amount) => {
            setCouponCode(code);
            setDiscount(amount);
          }}
          onRemove={() => {
            setCouponCode(null);
            setDiscount(0);
          }}
        />

        <OrderSummary subtotal={subtotal} discount={discount} />

        <Link
          href={
            couponCode
              ? `/checkout?coupon=${encodeURIComponent(couponCode)}`
              : "/checkout"
          }
          className="block"
        >
          <PrimaryButton>Proceed to Checkout</PrimaryButton>
        </Link>

        <Link
          href="/#products"
          className="block text-center text-sm font-semibold text-primary"
        >
          Continue Shopping
        </Link>

        <p className="text-center text-sm text-muted">
          Total: Rs. {total.toLocaleString("en-PK")} (delivery included)
        </p>
      </div>
    </div>
  );
}
