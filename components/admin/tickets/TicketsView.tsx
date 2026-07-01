"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useState } from "react";
import { Plus } from "lucide-react";
import { AdminPrimaryButton } from "@/components/admin/AdminUI";
import { SegmentedControl } from "@/components/admin/SegmentedControl";
import { TicketBoard } from "@/components/admin/tickets/TicketBoard";
import { TicketFilters, TicketListTable } from "@/components/admin/tickets/TicketFilters";
import type { TicketDepartment } from "@/lib/admin/tickets";
import type { AdminTicket } from "@/lib/db/admin/tickets";
import type { TicketDepartmentRecord } from "@/lib/db/admin/ticket-departments";

type TicketsViewProps = {
  initialTickets: AdminTicket[];
  departments: TicketDepartmentRecord[];
  epics: AdminTicket[];
  stories: AdminTicket[];
  canManage: boolean;
  initialDepartment?: TicketDepartment | null;
  initialEpicId?: string | null;
  initialStoryId?: string | null;
};

type ViewMode = "board" | "list";

export function TicketsView({
  initialTickets,
  departments,
  epics,
  stories,
  canManage,
  initialDepartment = null,
  initialEpicId = null,
  initialStoryId = null,
}: TicketsViewProps) {
  const router = useRouter();
  const [view, setView] = useState<ViewMode>("board");
  const [department, setDepartment] = useState<TicketDepartment | null>(
    initialDepartment,
  );
  const [epicId, setEpicId] = useState<string | null>(initialEpicId);
  const [storyId, setStoryId] = useState<string | null>(initialStoryId);
  const [tickets, setTickets] = useState(initialTickets);

  const applyFilters = useCallback(
    (d: TicketDepartment | null, e: string | null, s: string | null) => {
      const params = new URLSearchParams();
      if (d) params.set("department", d);
      if (e) params.set("epic", e);
      if (s) params.set("story", s);
      const qs = params.toString();
      router.push(qs ? `/admin/tickets?${qs}` : "/admin/tickets");
    },
    [router],
  );

  function handleDepartmentChange(d: TicketDepartment | null) {
    setDepartment(d);
    applyFilters(d, epicId, storyId);
  }

  function handleEpicChange(id: string | null) {
    setEpicId(id);
    setStoryId(null);
    applyFilters(department, id, null);
  }

  function handleStoryChange(id: string | null) {
    setStoryId(id);
    applyFilters(department, epicId, id);
  }

  const filtered = tickets.filter((t) => {
    if (department && t.department !== department) return false;
    return true;
  });

  const boardTickets =
    view === "board"
      ? filtered.filter(
          (t) =>
            t.status !== "backlog" &&
            t.status !== "cancelled" &&
            (t.issueType === "story" ||
              t.issueType === "task" ||
              t.issueType === "subtask"),
        )
      : filtered;

  return (
    <div className="mx-auto max-w-[1400px] space-y-6">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1
            className="text-2xl font-bold"
            style={{ color: "var(--admin-text-heading)" }}
          >
            Tickets
          </h1>
          <p className="mt-1 text-sm" style={{ color: "var(--admin-text-muted)" }}>
            Internal issue tracking — Epic, Story, Task, Sub-task
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <SegmentedControl
            options={[
              { value: "board" as ViewMode, label: "Board" },
              { value: "list" as ViewMode, label: "List" },
            ]}
            value={view}
            onChange={setView}
          />
          {canManage && (
            <Link href="/admin/tickets/new">
              <AdminPrimaryButton type="button">
                <Plus size={16} className="mr-1 inline" />
                Naya ticket
              </AdminPrimaryButton>
            </Link>
          )}
        </div>
      </header>

      <TicketFilters
        departments={departments}
        department={department}
        epicId={epicId}
        storyId={storyId}
        epics={epics.filter((e) => e.issueType === "epic")}
        stories={stories.filter((s) => s.issueType === "story")}
        onDepartmentChange={handleDepartmentChange}
        onEpicChange={handleEpicChange}
        onStoryChange={handleStoryChange}
      />

      {view === "board" ? (
        <TicketBoard
          tickets={boardTickets}
          departments={departments}
          canManage={canManage}
          onStatusChange={() => router.refresh()}
        />
      ) : (
        <TicketListTable tickets={filtered} departments={departments} />
      )}
    </div>
  );
}
