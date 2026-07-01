import type { Metadata } from "next";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { TicketForm } from "@/components/admin/tickets/TicketForm";
import { AdminEmptyState } from "@/components/admin/AdminUI";
import { requirePermission } from "@/lib/admin/guards";
import { hasPermission } from "@/lib/admin/permissions";
import type { IssueType, TicketDepartment } from "@/lib/admin/tickets";
import {
  getTicketById,
  listActiveStaffForAssignee,
} from "@/lib/db/admin/tickets";
import { listTicketDepartments } from "@/lib/db/admin/ticket-departments";
import { isSupabaseConfigured } from "@/lib/supabase/config";

export const metadata: Metadata = {
  title: "New Ticket",
  robots: { index: false, follow: false },
};

type PageProps = {
  searchParams: Promise<{
    parent?: string;
    type?: string;
    department?: string;
  }>;
};

export default async function NewTicketPage({ searchParams }: PageProps) {
  const admin = await requirePermission("manage_tickets");
  const params = await searchParams;

  if (!isSupabaseConfigured()) {
    return (
      <AdminLayout title="New Ticket" admin={admin}>
        <AdminEmptyState message="Supabase not configured." />
      </AdminLayout>
    );
  }

  const [staff, departments] = await Promise.all([
    listActiveStaffForAssignee(),
    listTicketDepartments(),
  ]);

  let defaultParentId: string | null = params.parent ?? null;
  let defaultDepartment: TicketDepartment =
    (params.department as TicketDepartment) ||
    departments[0]?.slug ||
    "development";
  let defaultIssueType: IssueType = (params.type as IssueType) || "task";

  if (defaultParentId) {
    const parent = await getTicketById(defaultParentId);
    if (parent) {
      defaultDepartment = parent.department;
    }
  }

  return (
    <AdminLayout title="New Ticket" admin={admin}>
      <TicketForm
        staff={staff}
        departments={departments}
        canManageDepartments
        defaultParentId={defaultParentId}
        defaultDepartment={defaultDepartment}
        defaultIssueType={defaultIssueType}
      />
    </AdminLayout>
  );
}
