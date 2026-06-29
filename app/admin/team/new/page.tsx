import type { Metadata } from "next";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { TeamMemberForm } from "@/components/admin/team/TeamMemberForm";
import { requireSuperAdmin } from "@/lib/admin/guards";

export const metadata: Metadata = {
  title: "New Team Member",
  robots: { index: false, follow: false },
};

export default async function NewTeamMemberPage() {
  const admin = await requireSuperAdmin();

  return (
    <AdminLayout title="New Team Member" admin={admin}>
      <TeamMemberForm mode="create" />
    </AdminLayout>
  );
}
