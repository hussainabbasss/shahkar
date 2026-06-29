"use server";

import { revalidatePath } from "next/cache";
import { requirePermission } from "@/lib/admin/guards";
import {
  createCouponAdmin,
  deleteCouponAdmin,
  updateCouponAdmin,
  type CouponInput,
} from "@/lib/db/admin/coupons";

export type ActionResult = { success: true } | { success: false; error: string };

function parseCouponForm(formData: FormData): CouponInput {
  const minOrderRaw = String(formData.get("minOrder") ?? "").trim();
  const usageLimitRaw = String(formData.get("usageLimit") ?? "").trim();
  const expiryRaw = String(formData.get("expiryDate") ?? "").trim();

  return {
    code: String(formData.get("code") ?? "").trim().toUpperCase(),
    discountType: formData.get("discountType") as "percentage" | "fixed",
    discountValue: Number(formData.get("discountValue")),
    minOrder: minOrderRaw ? Number(minOrderRaw) : null,
    usageLimit: usageLimitRaw ? Number(usageLimitRaw) : null,
    perUserLimit: Number(formData.get("perUserLimit") ?? 1),
    expiryDate: expiryRaw ? new Date(expiryRaw).toISOString() : null,
    active: formData.get("active") === "on",
  };
}

export async function createCouponAction(
  formData: FormData,
): Promise<ActionResult> {
  try {
    await requirePermission("manage_coupons");
    await createCouponAdmin(parseCouponForm(formData));
    revalidatePath("/admin/coupons");
    return { success: true };
  } catch (e) {
    return { success: false, error: (e as Error).message };
  }
}

export async function updateCouponAction(
  id: string,
  formData: FormData,
): Promise<ActionResult> {
  try {
    await requirePermission("manage_coupons");
    await updateCouponAdmin(id, parseCouponForm(formData));
    revalidatePath("/admin/coupons");
    return { success: true };
  } catch (e) {
    return { success: false, error: (e as Error).message };
  }
}

export async function deleteCouponAction(id: string): Promise<ActionResult> {
  try {
    await requirePermission("manage_coupons");
    await deleteCouponAdmin(id);
    revalidatePath("/admin/coupons");
    return { success: true };
  } catch (e) {
    return { success: false, error: (e as Error).message };
  }
}

export async function deactivateCouponAction(id: string): Promise<ActionResult> {
  try {
    await requirePermission("manage_coupons");
    const { getCouponByIdAdmin } = await import("@/lib/db/admin/coupons");
    const coupon = await getCouponByIdAdmin(id);
    if (!coupon) return { success: false, error: "Coupon not found." };
    await updateCouponAdmin(id, {
      code: coupon.code,
      discountType: coupon.discountType,
      discountValue: coupon.discountValue,
      minOrder: coupon.minOrder,
      usageLimit: coupon.usageLimit,
      perUserLimit: coupon.perUserLimit,
      expiryDate: coupon.expiryDate,
      active: false,
    });
    revalidatePath("/admin/coupons");
    return { success: true };
  } catch (e) {
    return { success: false, error: (e as Error).message };
  }
}
