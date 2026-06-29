"use server";

import { revalidatePath } from "next/cache";
import {
  commissionTiersFromForm,
  permissionsFromForm,
  ROLE_TEMPLATES,
  validateCommissionTiers,
  type AdminRole,
  DEFAULT_COMMISSION_CONFIG,
} from "@/lib/admin/permissions";
import { requireSuperAdmin } from "@/lib/admin/guards";
import {
  createTeamMember,
  updateTeamMember,
} from "@/lib/db/admin/team";

export type ActionResult = { success: true } | { success: false; error: string };

export async function createTeamMemberAction(
  _prev: ActionResult | null,
  formData: FormData,
): Promise<ActionResult> {
  try {
    await requireSuperAdmin();

    const email = String(formData.get("email") ?? "").trim();
    const password = String(formData.get("password") ?? "");
    const name = String(formData.get("name") ?? "").trim();
    const role = String(formData.get("role") ?? "sales") as AdminRole;

    if (!email || !password || !name) {
      return { success: false, error: "Email, password, and name are required." };
    }
    if (role === "admin") {
      return { success: false, error: "Cannot create another Super Admin here." };
    }

    const permissions =
      role === "custom"
        ? permissionsFromForm(formData)
        : { ...ROLE_TEMPLATES[role as Exclude<AdminRole, "admin" | "custom">] };

    const commissionEnabled = formData.get("commission_enabled") === "on";
    const commissionConfig = commissionEnabled
      ? { ...DEFAULT_COMMISSION_CONFIG, tiers: commissionTiersFromForm(formData) }
      : DEFAULT_COMMISSION_CONFIG;

    if (commissionEnabled) {
      const tierError = validateCommissionTiers(commissionConfig.tiers);
      if (tierError) return { success: false, error: tierError };
    }

    await createTeamMember({
      email,
      password,
      name,
      role,
      permissions,
      commissionEnabled,
      commissionConfig,
    });

    revalidatePath("/admin/team");
    return { success: true };
  } catch (e) {
    return { success: false, error: (e as Error).message };
  }
}

export async function updateTeamMemberAction(
  id: string,
  _prev: ActionResult | null,
  formData: FormData,
): Promise<ActionResult> {
  try {
    await requireSuperAdmin();

    const name = String(formData.get("name") ?? "").trim();
    const role = String(formData.get("role") ?? "sales") as AdminRole;
    const password = String(formData.get("password") ?? "").trim();
    const active = formData.get("active") === "on";

    if (!name) return { success: false, error: "Name is required." };
    if (role === "admin") {
      return { success: false, error: "Cannot change role to Super Admin here." };
    }

    const permissions =
      role === "custom"
        ? permissionsFromForm(formData)
        : { ...ROLE_TEMPLATES[role as Exclude<AdminRole, "admin" | "custom">] };

    const commissionEnabled = formData.get("commission_enabled") === "on";
    const commissionConfig = commissionEnabled
      ? { ...DEFAULT_COMMISSION_CONFIG, tiers: commissionTiersFromForm(formData) }
      : DEFAULT_COMMISSION_CONFIG;

    if (commissionEnabled) {
      const tierError = validateCommissionTiers(commissionConfig.tiers);
      if (tierError) return { success: false, error: tierError };
    }

    await updateTeamMember(id, {
      name,
      role,
      permissions,
      commissionEnabled,
      commissionConfig,
      active,
      password: password || undefined,
    });

    revalidatePath("/admin/team");
    revalidatePath(`/admin/team/${id}`);
    return { success: true };
  } catch (e) {
    return { success: false, error: (e as Error).message };
  }
}
