import { redirect } from "next/navigation";
import { getAdminUser } from "@/lib/admin/auth";
import {
  hasPermission,
  isSuperAdmin,
  type PermissionKey,
} from "@/lib/admin/permissions";
import type { AdminUser } from "@/lib/admin/auth";

export async function requireSuperAdmin(): Promise<AdminUser> {
  const user = await getAdminUser();
  if (!user || !user.active) redirect("/admin/login");
  if (!isSuperAdmin(user)) redirect("/admin/dashboard");
  return user;
}

export async function requirePermission(
  key: PermissionKey,
): Promise<AdminUser> {
  const user = await getAdminUser();
  if (!user || !user.active) redirect("/admin/login");
  if (!hasPermission(user, key)) redirect("/admin/dashboard");
  return user;
}
