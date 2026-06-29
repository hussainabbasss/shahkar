"use server";

import { getCouponByCode, countCouponUsageByPhone } from "@/lib/db/coupons";
import { computeCouponDiscount } from "@/lib/pricing";
import type { CouponValidationResult } from "@/lib/types";

export async function validateCoupon(
  code: string,
  subtotal: number,
  customerPhone?: string,
): Promise<CouponValidationResult> {
  const normalized = code.trim().toUpperCase();
  if (!normalized) {
    return { valid: false, error: "Enter a voucher code first" };
  }

  const coupon = await getCouponByCode(normalized);
  if (!coupon || !coupon.active) {
    return { valid: false, error: "This voucher code is not valid" };
  }

  if (coupon.expiryDate && new Date(coupon.expiryDate).getTime() <= Date.now()) {
    return { valid: false, error: "This voucher has expired" };
  }

  if (coupon.usageLimit !== null && coupon.usesCount >= coupon.usageLimit) {
    return { valid: false, error: "This voucher is no longer available" };
  }

  if (coupon.minOrder !== null && subtotal < coupon.minOrder) {
    return {
      valid: false,
      error: `Minimum order Rs. ${coupon.minOrder.toLocaleString("en-PK")} required`,
    };
  }

  if (customerPhone) {
    const usageCount = await countCouponUsageByPhone(coupon.id, customerPhone);
    if (usageCount >= coupon.perUserLimit) {
      return {
        valid: false,
        error: "You have already used this voucher",
      };
    }
  }

  const discount = computeCouponDiscount(subtotal, coupon);
  return { valid: true, discount, code: coupon.code };
}
