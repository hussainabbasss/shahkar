"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useMemo, useState, useTransition } from "react";
import { createOrder } from "@/app/actions/orders";
import { validateCoupon } from "@/app/actions/coupons";
import { CheckoutSummary } from "@/components/checkout/CheckoutSummary";
import { CodPaymentBadge } from "@/components/checkout/CodPaymentBadge";
import { TrustReassurance } from "@/components/checkout/TrustReassurance";
import { CouponInput } from "@/components/cart/CouponInput";
import { PrimaryButton } from "@/components/ui/buttons";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { useCart } from "@/lib/cart/cart-context";
import type { CartItem } from "@/lib/types";

type FormState = {
  customerName: string;
  customerPhone: string;
  city: string;
  address: string;
  instructions: string;
};

type FieldErrors = Partial<Record<keyof FormState, string>>;

type CheckoutFormProps = {
  buyNowItem?: CartItem | null;
};

export function CheckoutForm({ buyNowItem = null }: CheckoutFormProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const isBuyNow = buyNowItem !== null;
  const { items, clearCart, hydrated } = useCart();
  const [pending, startTransition] = useTransition();
  const [formError, setFormError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [couponCode, setCouponCode] = useState<string | null>(null);
  const [discount, setDiscount] = useState(0);
  const [form, setForm] = useState<FormState>({
    customerName: "",
    customerPhone: "",
    city: "",
    address: "",
    instructions: "",
  });

  const checkoutItems = useMemo(
    () => (isBuyNow ? [buyNowItem] : items),
    [isBuyNow, buyNowItem, items],
  );

  const checkoutSubtotal = useMemo(
    () =>
      checkoutItems.reduce((sum, item) => sum + item.price * item.quantity, 0),
    [checkoutItems],
  );

  useEffect(() => {
    const code = searchParams.get("coupon");
    if (!code || !checkoutSubtotal) return;
    void validateCoupon(
      code,
      checkoutSubtotal,
      form.customerPhone.trim() || undefined,
    ).then((result) => {
      if (result.valid) {
        setCouponCode(result.code);
        setDiscount(result.discount);
      }
    });
  }, [searchParams, checkoutSubtotal, form.customerPhone]);

  useEffect(() => {
    if (isBuyNow) return;
    if (hydrated && items.length === 0) {
      router.replace("/cart");
    }
  }, [isBuyNow, hydrated, items.length, router]);

  const updateField = (key: keyof FormState, value: string) => {
    setForm((prev) => ({ ...prev, [key]: value }));
    setFieldErrors((prev) => ({ ...prev, [key]: undefined }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    setFieldErrors({});

    const errors: FieldErrors = {};
    if (!form.customerName.trim()) errors.customerName = "Apna naam likhein";
    if (!form.customerPhone.trim()) errors.customerPhone = "Phone number zaroori hai";
    if (!form.city.trim()) errors.city = "Shehar ka naam likhein";
    if (!form.address.trim()) errors.address = "Pura address likhein";

    if (Object.keys(errors).length) {
      setFieldErrors(errors);
      return;
    }

    startTransition(async () => {
      const result = await createOrder({
        ...form,
        items: checkoutItems,
        couponCode: couponCode ?? undefined,
      });

      if (!result.success) {
        setFormError(result.error);
        return;
      }

      if (!isBuyNow) {
        clearCart();
      }

      router.push(`/order/${result.orderNumber}`);
    });
  };

  const isLoading = isBuyNow ? false : !hydrated || checkoutItems.length === 0;

  if (isLoading) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-12">
        <p className="text-body">Loading...</p>
      </div>
    );
  }

  const inputClass =
    "box-border min-h-[52px] w-full max-w-full min-w-0 rounded-[10px] border border-border bg-surface px-4 text-base focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary";

  return (
    <div className="box-border mx-auto w-full max-w-4xl min-w-0 overflow-x-clip px-4 py-12 md:px-8">
      <SectionHeading className="mb-8">Checkout</SectionHeading>

      <div className="grid w-full min-w-0 gap-8 lg:grid-cols-2">
        <form onSubmit={handleSubmit} className="w-full min-w-0 max-w-full space-y-4">
          <div className="min-w-0">
            <label htmlFor="name" className="mb-1 block text-sm font-semibold">
              Full Name *
            </label>
            <input
              id="name"
              className={inputClass}
              value={form.customerName}
              onChange={(e) => updateField("customerName", e.target.value)}
              autoComplete="name"
            />
            {fieldErrors.customerName && (
              <p className="mt-1 text-sm text-error">{fieldErrors.customerName}</p>
            )}
          </div>

          <div className="min-w-0">
            <label htmlFor="phone" className="mb-1 block text-sm font-semibold">
              Phone *
            </label>
            <input
              id="phone"
              type="tel"
              className={inputClass}
              placeholder="03XX-XXXXXXX"
              value={form.customerPhone}
              onChange={(e) => updateField("customerPhone", e.target.value)}
              autoComplete="tel"
            />
            {fieldErrors.customerPhone && (
              <p className="mt-1 text-sm text-error">{fieldErrors.customerPhone}</p>
            )}
          </div>

          <div className="min-w-0">
            <label htmlFor="city" className="mb-1 block text-sm font-semibold">
              City *
            </label>
            <input
              id="city"
              className={inputClass}
              value={form.city}
              onChange={(e) => updateField("city", e.target.value)}
            />
            {fieldErrors.city && (
              <p className="mt-1 text-sm text-error">{fieldErrors.city}</p>
            )}
          </div>

          <div className="min-w-0">
            <label htmlFor="address" className="mb-1 block text-sm font-semibold">
              Address *
            </label>
            <textarea
              id="address"
              rows={3}
              className={`${inputClass} min-h-[80px] py-3`}
              value={form.address}
              onChange={(e) => updateField("address", e.target.value)}
            />
            {fieldErrors.address && (
              <p className="mt-1 text-sm text-error">{fieldErrors.address}</p>
            )}
          </div>

          <div className="min-w-0">
            <label
              htmlFor="instructions"
              className="mb-1 block text-sm font-semibold"
            >
              Special Instructions (optional)
            </label>
            <textarea
              id="instructions"
              rows={2}
              className={`${inputClass} min-h-[60px] py-3`}
              placeholder="Landmark, timing, etc."
              value={form.instructions}
              onChange={(e) => updateField("instructions", e.target.value)}
            />
          </div>

          <TrustReassurance />

          {formError && (
            <p className="text-center text-sm font-semibold text-error" role="alert">
              {formError}
            </p>
          )}

          <CodPaymentBadge />

          <PrimaryButton type="submit" disabled={pending}>
            {pending ? "Placing order..." : "Place Order"}
          </PrimaryButton>
        </form>

        <div className="min-w-0 max-w-full space-y-4">
          <CouponInput
            inputId="checkout-coupon"
            subtotal={checkoutSubtotal}
            appliedCode={couponCode}
            discount={discount}
            customerPhone={form.customerPhone}
            onApply={(code, amount) => {
              setCouponCode(code);
              setDiscount(amount);
              setFormError(null);
            }}
            onRemove={() => {
              setCouponCode(null);
              setDiscount(0);
            }}
          />
          <CheckoutSummary
            items={checkoutItems}
            subtotal={checkoutSubtotal}
            discount={discount}
          />
        </div>
      </div>
    </div>
  );
}
