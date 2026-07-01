import type { Metadata } from "next";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { TicketsView } from "@/components/admin/tickets/TicketsView";
import { AdminEmptyState } from "@/components/admin/AdminUI";
import { requirePermission } from "@/lib/admin/guards";
import { hasPermission } from "@/lib/admin/permissions";
import type { TicketDepartment } from "@/lib/admin/tickets";
import {
  listEpicsAndStories,
  listTickets,
} from "@/lib/db/admin/tickets";
import { listTicketDepartments } from "@/lib/db/admin/ticket-departments";
import { isSupabaseConfigured } from "@/lib/supabase/config";

export const metadata: Metadata = {
  title: "Tickets",
  robots: { index: false, follow: false },
};

type PageProps = {
  searchParams: Promise<{
    department?: string;
    epic?: string;
    story?: string;
  }>;
};

export default async function AdminTicketsPage({ searchParams }: PageProps) {
  const admin = await requirePermission("view_tickets");
  const params = await searchParams;

  if (!isSupabaseConfigured()) {
    return (
      <AdminLayout title="Tickets" admin={admin}>
        <AdminEmptyState message="Supabase not configured." />
      </AdminLayout>
    );
  }

  const department = (params.department as TicketDepartment) || null;
  const epicId = params.epic ?? null;
  const storyId = params.story ?? null;

  const [tickets, epicsAndStories, departments] = await Promise.all([
    listTickets({ department, epicId, storyId }),
    listEpicsAndStories(),
    listTicketDepartments(),
  ]);

  return (
    <AdminLayout title="Tickets" admin={admin}>
      <TicketsView
        initialTickets={tickets}
        departments={departments}
        epics={epicsAndStories}
        stories={epicsAndStories}
        canManage={hasPermission(admin, "manage_tickets")}
        initialDepartment={department}
        initialEpicId={epicId}
        initialStoryId={storyId}
      />
    </AdminLayout>
  );
}
