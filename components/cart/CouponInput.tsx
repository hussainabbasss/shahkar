"use client";

import { useState, useTransition } from "react";
import { validateCoupon } from "@/app/actions/coupons";
import { PrimaryButton } from "@/components/ui/buttons";

type CouponInputProps = {
  subtotal: number;
  appliedCode: string | null;
  discount: number;
  customerPhone?: string;
  inputId?: string;
  onApply: (code: string, discount: number) => void;
  onRemove: () => void;
};

export function CouponInput({
  subtotal,
  appliedCode,
  discount,
  customerPhone,
  inputId = "coupon",
  onApply,
  onRemove,
}: CouponInputProps) {
  const [code, setCode] = useState(appliedCode ?? "");
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const handleApply = () => {
    setError(null);
    startTransition(async () => {
      const result = await validateCoupon(
        code,
        subtotal,
        customerPhone?.trim() || undefined,
      );
      if (!result.valid) {
        setError(result.error);
        return;
      }
      onApply(result.code, result.discount);
    });
  };

  if (appliedCode) {
    return (
      <div className="rounded-xl border border-success/30 bg-primary-light p-4">
        <div className="flex items-center justify-between gap-3">
          <p className="min-w-0 text-sm font-semibold text-success">
            &quot;{appliedCode}&quot; applied — Rs.{" "}
            {discount.toLocaleString("en-PK")} off
          </p>
          <button
            type="button"
            onClick={onRemove}
            className="shrink-0 text-sm font-semibold text-error"
          >
            Remove
          </button>
        </div>
      </div>
    );
  }

  const fieldClass =
    "box-border min-h-[52px] min-w-0 flex-1 rounded-[10px] border border-border bg-surface px-4 text-base uppercase focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary";

  return (
    <div className="min-w-0 space-y-2">
      <label htmlFor={inputId} className="text-sm font-semibold text-heading">
        Voucher / discount code
      </label>
      <div className="flex min-w-0 gap-2">
        <input
          id={inputId}
          type="text"
          value={code}
          onChange={(e) => setCode(e.target.value.toUpperCase())}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              handleApply();
            }
          }}
          placeholder="EID20"
          className={fieldClass}
        />
        <PrimaryButton
          fullWidth={false}
          type="button"
          className="min-w-[88px] shrink-0 px-4"
          onClick={handleApply}
          disabled={pending || !code.trim()}
        >
          {pending ? "..." : "Apply"}
        </PrimaryButton>
      </div>
      {error && (
        <p className="text-sm font-medium text-error" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}
