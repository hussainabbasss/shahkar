import type { Metadata } from "next";
import Link from "next/link";
import { AdminLayout } from "@/components/admin/AdminLayout";
import {
  AdminEmptyState,
  AdminPrimaryButton,
  AdminTable,
  AdminTableBody,
  AdminTableHead,
  StatusBadge,
} from "@/components/admin/AdminUI";
import { requireSuperAdmin } from "@/lib/admin/guards";
import { formatDateShort } from "@/lib/admin/utils";
import { listTeamMembers } from "@/lib/db/admin/team";
import { isSupabaseConfigured } from "@/lib/supabase/config";

export const metadata: Metadata = {
  title: "Team",
  robots: { index: false, follow: false },
};

export default async function AdminTeamPage() {
  const admin = await requireSuperAdmin();

  if (!isSupabaseConfigured()) {
    return (
      <AdminLayout title="Team" admin={admin}>
        <AdminEmptyState message="Supabase not configured." />
      </AdminLayout>
    );
  }

  const members = await listTeamMembers();
  const staff = members.filter((m) => m.role !== "admin");

  return (
    <AdminLayout
      title="Team"
      admin={admin}
      actions={
        <Link href="/admin/team/new">
          <AdminPrimaryButton>Add team member</AdminPrimaryButton>
        </Link>
      }
    >
      {staff.length === 0 ? (
        <AdminEmptyState message="No staff members yet." />
      ) : (
        <AdminTable>
          <AdminTableHead>
            <th className="px-4 py-3">Name</th>
            <th className="px-4 py-3">Email</th>
            <th className="px-4 py-3">Role</th>
            <th className="px-4 py-3">Commission</th>
            <th className="px-4 py-3">Status</th>
            <th className="px-4 py-3">Joined</th>
            <th className="px-4 py-3"></th>
          </AdminTableHead>
          <AdminTableBody>
            {staff.map((member) => (
              <tr key={member.id} className="admin-table-row">
                <td className="px-4 py-3 font-medium">{member.name}</td>
                <td className="px-4 py-3">{member.email}</td>
                <td className="px-4 py-3 capitalize">{member.role}</td>
                <td className="px-4 py-3">
                  {member.commissionEnabled ? "On" : "Off"}
                </td>
                <td className="px-4 py-3">
                  <StatusBadge
                    status={member.active ? "active" : "draft"}
                    variant="product"
                  />
                </td>
                <td className="px-4 py-3">{formatDateShort(member.createdAt)}</td>
                <td className="px-4 py-3 text-right">
                  <Link
                    href={`/admin/team/${member.id}`}
                    className="text-sm font-medium hover:underline"
                    style={{ color: "var(--admin-primary-text)" }}
                  >
                    Edit
                  </Link>
                  {" · "}
                  <Link
                    href={`/admin/team/${member.id}/analytics`}
                    className="text-sm hover:underline"
                    style={{ color: "var(--admin-text-muted)" }}
                  >
                    Analytics
                  </Link>
                </td>
              </tr>
            ))}
          </AdminTableBody>
        </AdminTable>
      )}
    </AdminLayout>
  );
}
