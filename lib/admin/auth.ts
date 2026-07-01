import { cache } from "react";
import { redirect } from "next/navigation";
import {
  parseCommissionConfig,
  parsePermissions,
  type AdminPermissions,
  type AdminRole,
  type CommissionConfig,
} from "@/lib/admin/permissions";
import { createAuthServerClient } from "@/lib/supabase/server-auth";
import { isSupabaseConfigured } from "@/lib/supabase/config";

export type AdminUser = {
  id: string;
  email: string;
  name: string;
  role: AdminRole;
  permissions: AdminPermissions;
  commissionEnabled: boolean;
  commissionConfig: CommissionConfig;
  active: boolean;
};

export const getAdminUser = cache(async (): Promise<AdminUser | null> => {
  if (!isSupabaseConfigured()) return null;

  const supabase = await createAuthServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user?.email) return null;

  const { data: profile } = await supabase
    .from("admin_profiles")
    .select(
      "id, email, name, role, permissions, commission_enabled, commission_config, active",
    )
    .eq("id", user.id)
    .maybeSingle();

  if (!profile || profile.active === false) return null;

  return {
    id: profile.id,
    email: profile.email,
    name: profile.name ?? "Admin",
    role: (profile.role ?? "admin") as AdminRole,
    permissions: parsePermissions(profile.permissions),
    commissionEnabled: profile.commission_enabled ?? false,
    commissionConfig: parseCommissionConfig(profile.commission_config),
    active: profile.active !== false,
  };
});

export async function requireAdmin(): Promise<AdminUser> {
  const admin = await getAdminUser();
  if (!admin) redirect("/admin/login");
  return admin;
}
