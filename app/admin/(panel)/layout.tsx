import { AdminPanelShell } from "@/components/admin/AdminPanelShell";
import { requireAdmin } from "@/lib/admin/auth";
import { buildAdminNavGroups } from "@/lib/admin/nav";

export default async function AdminPanelLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const admin = await requireAdmin();

  return (
    <AdminPanelShell navGroups={buildAdminNavGroups(admin)}>
      {children}
    </AdminPanelShell>
  );
}
