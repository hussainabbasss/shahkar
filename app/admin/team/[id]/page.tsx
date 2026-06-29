import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { AdminEmptyState } from "@/components/admin/AdminUI";
import { TeamMemberForm } from "@/components/admin/team/TeamMemberForm";
import { requireSuperAdmin } from "@/lib/admin/guards";
import { getTeamMember } from "@/lib/db/admin/team";
import { isSupabaseConfigured } from "@/lib/supabase/config";

export const metadata: Metadata = {
  title: "Edit Team Member",
  robots: { index: false, follow: false },
};

export default async function EditTeamMemberPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const admin = await requireSuperAdmin();
  const { id } = await params;

  if (!isSupabaseConfigured()) {
    return (
      <AdminLayout title="Edit Team Member" admin={admin}>
        <AdminEmptyState message="Supabase not configured." />
      </AdminLayout>
    );
  }

  const member = await getTeamMember(id);
  if (!member || member.role === "admin") notFound();

  return (
    <AdminLayout title={`Edit: ${member.name}`} admin={admin}>
      <TeamMemberForm mode="edit" member={member} />
    </AdminLayout>
  );
}
