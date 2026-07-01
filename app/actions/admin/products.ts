"use server";

import { revalidatePath } from "next/cache";
import { requirePermission } from "@/lib/admin/guards";
import { slugify } from "@/lib/admin/utils";
import {
  createProductAdmin,
  deleteProductAdmin,
  updateProductAdmin,
  uploadProductImage,
  type ProductInput,
} from "@/lib/db/admin/products";

export type ActionResult = { success: true } | { success: false; error: string };

function parseProductForm(formData: FormData): ProductInput {
  const features = formData
    .getAll("features")
    .map((f) => String(f).trim())
    .filter(Boolean);

  const imagesRaw = String(formData.get("images") ?? "");
  const images = imagesRaw
    .split("\n")
    .map((u) => u.trim())
    .filter(Boolean);

  const salePriceRaw = String(formData.get("salePrice") ?? "").trim();

  return {
    name: String(formData.get("name") ?? "").trim(),
    slug: String(formData.get("slug") ?? "").trim() || slugify(String(formData.get("name") ?? "")),
    description: String(formData.get("description") ?? "").trim(),
    features,
    images,
    category: String(formData.get("category") ?? "").trim(),
    originalPrice: Number(formData.get("originalPrice")),
    salePrice: salePriceRaw ? Number(salePriceRaw) : null,
    stock: Number(formData.get("stock") ?? 0),
    featured: formData.get("featured") === "on",
    active: formData.get("active") === "on",
  };
}

export async function createProductAction(
  formData: FormData,
): Promise<ActionResult> {
  try {
    await requirePermission("manage_products");
    const input = parseProductForm(formData);
    if (!input.name || !input.slug) {
      return { success: false, error: "Name and slug are required." };
    }
    await createProductAdmin(input);
    revalidatePath("/admin/products");
    revalidatePath("/admin/tickets");
    revalidatePath("/");
    return { success: true };
  } catch (e) {
    return { success: false, error: (e as Error).message };
  }
}

export async function updateProductAction(
  id: string,
  formData: FormData,
): Promise<ActionResult> {
  try {
    const admin = await requirePermission("manage_products");
    const input = parseProductForm(formData);
    await updateProductAdmin(id, input, { actorId: admin.id });
    revalidatePath("/admin/products");
    revalidatePath("/admin/tickets");
    revalidatePath("/");
    revalidatePath(`/products/${input.slug}`);
    return { success: true };
  } catch (e) {
    return { success: false, error: (e as Error).message };
  }
}

export async function deleteProductAction(id: string): Promise<ActionResult> {
  try {
    await requirePermission("manage_products");
    await deleteProductAdmin(id);
    revalidatePath("/admin/products");
    revalidatePath("/admin/tickets");
    revalidatePath("/");
    return { success: true };
  } catch (e) {
    return { success: false, error: (e as Error).message };
  }
}

export async function uploadProductImageAction(
  formData: FormData,
): Promise<{ success: true; url: string } | { success: false; error: string }> {
  try {
    await requirePermission("manage_products");
    const file = formData.get("file") as File | null;
    if (!file?.size) return { success: false, error: "No file provided." };
    const url = await uploadProductImage(file);
    return { success: true, url };
  } catch (e) {
    return { success: false, error: (e as Error).message };
  }
}
