import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { TicketDetailView } from "@/components/admin/tickets/TicketDetailView";
import { AdminEmptyState } from "@/components/admin/AdminUI";
import { requirePermission } from "@/lib/admin/guards";
import { hasPermission } from "@/lib/admin/permissions";
import {
  getTicketByKey,
  getTicketChildren,
  getStoryTaskTree,
  listActiveStaffForAssignee,
} from "@/lib/db/admin/tickets";
import { listTicketComments } from "@/lib/db/admin/ticket-comments";
import { listTicketDepartments } from "@/lib/db/admin/ticket-departments";
import { isSupabaseConfigured } from "@/lib/supabase/config";

type PageProps = {
  params: Promise<{ ticketKey: string }>;
};

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { ticketKey } = await params;
  return {
    title: ticketKey,
    robots: { index: false, follow: false },
  };
}

export default async function TicketDetailPage({ params }: PageProps) {
  const admin = await requirePermission("view_tickets");
  const { ticketKey } = await params;

  if (!isSupabaseConfigured()) {
    return (
      <AdminLayout title="Ticket" admin={admin}>
        <AdminEmptyState message="Supabase not configured." />
      </AdminLayout>
    );
  }

  const ticket = await getTicketByKey(ticketKey);
  if (!ticket) notFound();

  const [children, staff, departments, comments, storyTaskTree] =
    await Promise.all([
      getTicketChildren(ticket.id),
      listActiveStaffForAssignee(),
      listTicketDepartments(),
      listTicketComments(ticket.id),
      ticket.issueType === "story"
        ? getStoryTaskTree(ticket.id)
        : Promise.resolve([]),
    ]);

  return (
    <AdminLayout title={ticket.ticketKey} admin={admin}>
      <TicketDetailView
        ticket={ticket}
        children={children}
        storyTaskTree={storyTaskTree}
        comments={comments}
        currentUserId={admin.id}
        staff={staff}
        departments={departments}
        canManage={hasPermission(admin, "manage_tickets")}
      />
    </AdminLayout>
  );
}
