"use server";

import { revalidatePath } from "next/cache";
import { requirePermission } from "@/lib/admin/guards";
import {
  createSaleAdmin,
  deleteSaleAdmin,
  duplicateSaleAdmin,
  updateSaleAdmin,
  type SaleInput,
} from "@/lib/db/admin/sales";

export type ActionResult = { success: true; id?: string } | { success: false; error: string };

function parseSaleForm(formData: FormData): SaleInput {
  const productIdsRaw = String(formData.get("productIds") ?? "");
  const categoryNamesRaw = String(formData.get("categoryNames") ?? "");
  const couponCode = String(formData.get("couponCode") ?? "").trim() || null;

  return {
    name: String(formData.get("name") ?? "").trim(),
    discountType: formData.get("discountType") as "percentage" | "fixed",
    discountValue: Number(formData.get("discountValue")),
    appliesTo: formData.get("appliesTo") as "all" | "products" | "categories",
    productIds: productIdsRaw ? productIdsRaw.split(",").filter(Boolean) : [],
    categoryNames: categoryNamesRaw
      ? categoryNamesRaw.split(",").filter(Boolean)
      : [],
    couponCode,
    startDate: new Date(String(formData.get("startDate"))).toISOString(),
    endDate: new Date(String(formData.get("endDate"))).toISOString(),
    active: formData.get("active") === "on",
  };
}

export async function createSaleAction(formData: FormData): Promise<ActionResult> {
  try {
    await requirePermission("manage_sales");
    const sale = await createSaleAdmin(parseSaleForm(formData));
    revalidatePath("/admin/sales");
    revalidatePath("/");
    return { success: true, id: sale.id };
  } catch (e) {
    return { success: false, error: (e as Error).message };
  }
}

export async function updateSaleAction(
  id: string,
  formData: FormData,
): Promise<ActionResult> {
  try {
    await requirePermission("manage_sales");
    await updateSaleAdmin(id, parseSaleForm(formData));
    revalidatePath("/admin/sales");
    revalidatePath("/");
    return { success: true };
  } catch (e) {
    return { success: false, error: (e as Error).message };
  }
}

export async function deleteSaleAction(id: string): Promise<ActionResult> {
  try {
    await requirePermission("manage_sales");
    await deleteSaleAdmin(id);
    revalidatePath("/admin/sales");
    revalidatePath("/");
    return { success: true };
  } catch (e) {
    return { success: false, error: (e as Error).message };
  }
}

export async function duplicateSaleAction(id: string): Promise<ActionResult> {
  try {
    await requirePermission("manage_sales");
    const sale = await duplicateSaleAdmin(id);
    revalidatePath("/admin/sales");
    return { success: true, id: sale.id };
  } catch (e) {
    return { success: false, error: (e as Error).message };
  }
}
