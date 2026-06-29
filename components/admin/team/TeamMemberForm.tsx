"use client";

import { useActionState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  createTeamMemberAction,
  updateTeamMemberAction,
  type ActionResult,
} from "@/app/actions/admin/team";
import {
  AdminField,
  AdminFormSection,
  AdminPrimaryButton,
  adminInputClass,
} from "@/components/admin/AdminUI";
import { useToast } from "@/components/admin/ToastProvider";
import { CommissionTierEditor } from "@/components/admin/team/CommissionTierEditor";
import {
  PermissionMatrix,
  RoleTemplateSelect,
} from "@/components/admin/team/PermissionMatrix";
import {
  ROLE_TEMPLATES,
  type AdminPermissions,
  type AdminRole,
  type CommissionConfig,
} from "@/lib/admin/permissions";

type TeamMemberFormProps = {
  mode: "create" | "edit";
  member?: {
    id: string;
    email: string;
    name: string;
    role: AdminRole;
    permissions: AdminPermissions;
    commissionEnabled: boolean;
    commissionConfig: CommissionConfig;
    active: boolean;
  };
};

export function TeamMemberForm({ mode, member }: TeamMemberFormProps) {
  const router = useRouter();
  const { showToast } = useToast();

  const action =
    mode === "create"
      ? createTeamMemberAction
      : updateTeamMemberAction.bind(null, member!.id);

  const [state, formAction, pending] = useActionState<ActionResult | null, FormData>(
    action,
    null,
  );

  useEffect(() => {
    if (state?.success) {
      showToast(mode === "create" ? "Team member created" : "Team member updated");
      router.push("/admin/team");
      router.refresh();
    } else if (state && !state.success) {
      showToast(state.error, "error");
    }
  }, [state, mode, router, showToast]);

  const role = member?.role ?? "sales";
  const permissions =
    member?.permissions ??
    ROLE_TEMPLATES.sales;

  return (
    <form action={formAction} className="mx-auto max-w-3xl space-y-6">
      <AdminFormSection title={mode === "create" ? "Account" : "Profile"}>
        {mode === "create" && (
          <>
            <AdminField label="Email">
              <input
                name="email"
                type="email"
                required
                className={adminInputClass}
                placeholder="staff@shahkar.store"
              />
            </AdminField>
            <AdminField label="Temporary password">
              <input
                name="password"
                type="password"
                required
                minLength={8}
                className={adminInputClass}
              />
            </AdminField>
          </>
        )}
        <AdminField label="Name">
          <input
            name="name"
            required
            defaultValue={member?.name}
            className={adminInputClass}
          />
        </AdminField>
        {mode === "edit" && (
          <>
            <AdminField label="New password (optional)">
              <input
                name="password"
                type="password"
                minLength={8}
                className={adminInputClass}
                placeholder="Leave blank to keep current"
              />
            </AdminField>
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                name="active"
                value="on"
                defaultChecked={member?.active !== false}
              />
              Account active
            </label>
          </>
        )}
        <AdminField label="Role template">
          <RoleTemplateSelect defaultValue={role === "admin" ? "sales" : role} />
        </AdminField>
      </AdminFormSection>

      <AdminFormSection title="Permissions">
        <PermissionMatrix permissions={permissions} role={role} />
      </AdminFormSection>

      <AdminFormSection title="Commission">
        <CommissionTierEditor
          tiers={member?.commissionConfig.tiers}
          enabled={member?.commissionEnabled}
        />
      </AdminFormSection>

      <AdminPrimaryButton type="submit" disabled={pending}>
        {pending ? "Saving…" : mode === "create" ? "Create user" : "Save changes"}
      </AdminPrimaryButton>
    </form>
  );
}
