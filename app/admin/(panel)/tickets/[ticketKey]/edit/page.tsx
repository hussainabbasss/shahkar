import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { TicketForm } from "@/components/admin/tickets/TicketForm";
import { AdminEmptyState } from "@/components/admin/AdminUI";
import { requirePermission } from "@/lib/admin/guards";
import {
  getTicketByKey,
  listActiveStaffForAssignee,
} from "@/lib/db/admin/tickets";
import { listTicketDepartments } from "@/lib/db/admin/ticket-departments";
import { isSupabaseConfigured } from "@/lib/supabase/config";

type PageProps = {
  params: Promise<{ ticketKey: string }>;
};

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { ticketKey } = await params;
  return {
    title: `Edit ${ticketKey}`,
    robots: { index: false, follow: false },
  };
}

export default async function EditTicketPage({ params }: PageProps) {
  const admin = await requirePermission("manage_tickets");
  const { ticketKey } = await params;

  if (!isSupabaseConfigured()) {
    return (
      <AdminLayout title="Edit Ticket" admin={admin}>
        <AdminEmptyState message="Supabase not configured." />
      </AdminLayout>
    );
  }

  const ticket = await getTicketByKey(ticketKey);
  if (!ticket) notFound();

  const [staff, departments] = await Promise.all([
    listActiveStaffForAssignee(),
    listTicketDepartments(),
  ]);

  return (
    <AdminLayout title={`Edit ${ticket.ticketKey}`} admin={admin}>
      <TicketForm
        staff={staff}
        departments={departments}
        canManageDepartments
        initial={ticket}
      />
    </AdminLayout>
  );
}
