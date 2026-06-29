import { createAdminClient } from "@/lib/supabase/admin";
import {
  DEFAULT_COMMISSION_CONFIG,
  parseCommissionConfig,
  parsePermissions,
  type AdminPermissions,
  type AdminRole,
  type CommissionConfig,
} from "@/lib/admin/permissions";

function requireAdmin() {
  const supabase = createAdminClient();
  if (!supabase) throw new Error("Supabase not configured");
  return supabase;
}

export type TeamMember = {
  id: string;
  email: string;
  name: string;
  role: AdminRole;
  permissions: AdminPermissions;
  commissionEnabled: boolean;
  commissionConfig: CommissionConfig;
  active: boolean;
  createdAt: string;
};

type DbProfile = {
  id: string;
  email: string;
  name: string;
  role: string;
  permissions: unknown;
  commission_enabled: boolean;
  commission_config: unknown;
  active: boolean;
  created_at: string;
};

function mapProfile(row: DbProfile): TeamMember {
  return {
    id: row.id,
    email: row.email,
    name: row.name,
    role: row.role as AdminRole,
    permissions: parsePermissions(row.permissions),
    commissionEnabled: row.commission_enabled,
    commissionConfig: parseCommissionConfig(row.commission_config),
    active: row.active,
    createdAt: row.created_at,
  };
}

export async function listTeamMembers(): Promise<TeamMember[]> {
  const supabase = requireAdmin();
  const { data, error } = await supabase
    .from("admin_profiles")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) throw new Error(error.message);
  return (data as DbProfile[]).map(mapProfile);
}

export async function getTeamMember(id: string): Promise<TeamMember | null> {
  const supabase = requireAdmin();
  const { data, error } = await supabase
    .from("admin_profiles")
    .select("*")
    .eq("id", id)
    .maybeSingle();

  if (error) throw new Error(error.message);
  if (!data) return null;
  return mapProfile(data as DbProfile);
}

export type CreateTeamMemberInput = {
  email: string;
  password: string;
  name: string;
  role: AdminRole;
  permissions: AdminPermissions;
  commissionEnabled: boolean;
  commissionConfig: CommissionConfig;
};

export async function createTeamMember(
  input: CreateTeamMemberInput,
): Promise<TeamMember> {
  const supabase = requireAdmin();

  const { data: authData, error: authError } =
    await supabase.auth.admin.createUser({
      email: input.email,
      password: input.password,
      email_confirm: true,
      user_metadata: { name: input.name, role: input.role },
    });

  if (authError) throw new Error(authError.message);

  const { data, error } = await supabase
    .from("admin_profiles")
    .insert({
      id: authData.user.id,
      email: input.email,
      name: input.name,
      role: input.role,
      permissions: input.permissions,
      commission_enabled: input.commissionEnabled,
      commission_config: input.commissionEnabled
        ? input.commissionConfig
        : DEFAULT_COMMISSION_CONFIG,
      active: true,
    })
    .select("*")
    .single();

  if (error) {
    await supabase.auth.admin.deleteUser(authData.user.id);
    throw new Error(error.message);
  }

  return mapProfile(data as DbProfile);
}

export type UpdateTeamMemberInput = {
  name: string;
  role: AdminRole;
  permissions: AdminPermissions;
  commissionEnabled: boolean;
  commissionConfig: CommissionConfig;
  active: boolean;
  password?: string;
};

export async function updateTeamMember(
  id: string,
  input: UpdateTeamMemberInput,
): Promise<TeamMember> {
  const supabase = requireAdmin();

  if (input.password?.trim()) {
    const { error: pwError } = await supabase.auth.admin.updateUserById(id, {
      password: input.password,
    });
    if (pwError) throw new Error(pwError.message);
  }

  const { data, error } = await supabase
    .from("admin_profiles")
    .update({
      name: input.name,
      role: input.role,
      permissions: input.permissions,
      commission_enabled: input.commissionEnabled,
      commission_config: input.commissionConfig,
      active: input.active,
    })
    .eq("id", id)
    .select("*")
    .single();

  if (error) throw new Error(error.message);
  return mapProfile(data as DbProfile);
}

export type EmployeeComparisonRow = {
  id: string;
  name: string;
  ordersCreated: number;
  ordersDelivered: number;
  revenue: number;
  commission: number;
  conversionPercent: number;
};

export async function getEmployeeComparison(
  start: Date,
  end: Date,
): Promise<EmployeeComparisonRow[]> {
  const supabase = requireAdmin();

  const { data: staff, error: staffError } = await supabase
    .from("admin_profiles")
    .select("id, name")
    .neq("role", "admin")
    .eq("active", true);

  if (staffError) throw new Error(staffError.message);

  const { data: orders, error: ordersError } = await supabase
    .from("orders")
    .select("id, total, status, created_by, source, created_at")
    .eq("source", "manual")
    .gte("created_at", start.toISOString())
    .lte("created_at", end.toISOString());

  if (ordersError) throw new Error(ordersError.message);

  const { data: commissions, error: commError } = await supabase
    .from("commission_entries")
    .select("user_id, amount, delivered_at")
    .gte("delivered_at", start.toISOString())
    .lte("delivered_at", end.toISOString());

  if (commError) throw new Error(commError.message);

  const orderRows = orders ?? [];
  const commRows = commissions ?? [];

  return (staff ?? []).map((member) => {
    const memberOrders = orderRows.filter((o) => o.created_by === member.id);
    const delivered = memberOrders.filter((o) => o.status === "delivered");
    const revenue = memberOrders
      .filter((o) => o.status !== "returned")
      .reduce((s, o) => s + Number(o.total), 0);
    const commission = commRows
      .filter((c) => c.user_id === member.id)
      .reduce((s, c) => s + Number(c.amount), 0);

    return {
      id: member.id,
      name: member.name,
      ordersCreated: memberOrders.length,
      ordersDelivered: delivered.length,
      revenue,
      commission,
      conversionPercent:
        memberOrders.length > 0
          ? (delivered.length / memberOrders.length) * 100
          : 0,
    };
  });
}
