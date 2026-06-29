"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createAuthServerClient } from "@/lib/supabase/server-auth";

export type AuthActionResult =
  | { success: true }
  | { success: false; error: string };

export async function loginAdmin(
  _prev: AuthActionResult | null,
  formData: FormData,
): Promise<AuthActionResult> {
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");

  if (!email || !password) {
    return { success: false, error: "Email and password are required." };
  }

  const supabase = await createAuthServerClient();
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    return { success: false, error: "Invalid email or password." };
  }

  const { data: profile } = await supabase
    .from("admin_profiles")
    .select("id, active")
    .eq("id", data.user.id)
    .maybeSingle();

  if (!profile || profile.active === false) {
    await supabase.auth.signOut();
    return {
      success: false,
      error: profile ? "Your account has been deactivated." : "You are not authorized as an admin.",
    };
  }

  redirect("/admin/dashboard");
}

export async function logoutAdmin(): Promise<void> {
  const supabase = await createAuthServerClient();
  await supabase.auth.signOut();
  redirect("/admin/login");
}

export async function updateOrderStatusAction(
  orderNumber: string,
  status: string,
): Promise<{ success: boolean; error?: string }> {
  try {
    const { requirePermission } = await import("@/lib/admin/guards");
    const { canSetOrderStatus } = await import("@/lib/admin/permissions");
    const admin = await requirePermission("view_orders");
    const { getOrderByNumberAdmin, updateOrderAdmin } = await import(
      "@/lib/db/admin/orders"
    );
    const existing = await getOrderByNumberAdmin(orderNumber);
    if (!existing) return { success: false, error: "Order not found." };

    const newStatus = status as import("@/lib/types").OrderStatus;
    if (!canSetOrderStatus(admin, existing.status, newStatus)) {
      return { success: false, error: "Permission denied for this status." };
    }

    await updateOrderAdmin(orderNumber, { status: newStatus });
    revalidatePath("/admin/dashboard");
    revalidatePath("/admin/orders");
    revalidatePath(`/admin/orders/${orderNumber}`);
    return { success: true };
  } catch (e) {
    return { success: false, error: (e as Error).message };
  }
}
