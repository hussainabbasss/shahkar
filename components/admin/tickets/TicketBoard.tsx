"use client";

import { useState } from "react";
import { updateTicketStatusAction } from "@/app/actions/admin/tickets";
import { TicketCard } from "@/components/admin/tickets/TicketCard";
import { STATUS_LABELS, type TicketStatus } from "@/lib/admin/tickets";
import type { AdminTicket } from "@/lib/db/admin/tickets";
import type { TicketDepartmentRecord } from "@/lib/db/admin/ticket-departments";

const COLUMNS: TicketStatus[] = ["todo", "in_progress", "done"];

type TicketBoardProps = {
  tickets: AdminTicket[];
  departments: TicketDepartmentRecord[];
  canManage: boolean;
  onStatusChange?: () => void;
};

export function TicketBoard({
  tickets,
  departments,
  canManage,
  onStatusChange,
}: TicketBoardProps) {
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const [overColumn, setOverColumn] = useState<TicketStatus | null>(null);

  async function handleDrop(status: TicketStatus) {
    if (!draggingId || !canManage) return;
    const ticket = tickets.find((t) => t.id === draggingId);
    if (!ticket || ticket.status === status) {
      setDraggingId(null);
      setOverColumn(null);
      return;
    }
    await updateTicketStatusAction(ticket.ticketKey, status);
    setDraggingId(null);
    setOverColumn(null);
    onStatusChange?.();
  }

  return (
    <div className="grid gap-4 md:grid-cols-3">
      {COLUMNS.map((status) => {
        const columnTickets = tickets.filter((t) => t.status === status);
        const isOver = overColumn === status;

        return (
          <div
            key={status}
            className="flex min-h-[200px] flex-col rounded-xl p-3"
            style={{
              background: isOver
                ? "color-mix(in srgb, var(--admin-primary) 6%, var(--admin-bg))"
                : "color-mix(in srgb, var(--admin-border) 20%, transparent)",
              border: `1px solid ${isOver ? "var(--admin-primary)" : "var(--admin-border)"}`,
            }}
            onDragOver={(e) => {
              if (!canManage) return;
              e.preventDefault();
              setOverColumn(status);
            }}
            onDragLeave={() => setOverColumn(null)}
            onDrop={(e) => {
              e.preventDefault();
              void handleDrop(status);
            }}
          >
            <h3
              className="mb-3 text-xs font-bold uppercase tracking-wide"
              style={{ color: "var(--admin-text-muted)" }}
            >
              {STATUS_LABELS[status]}
              <span className="ml-2 font-normal">({columnTickets.length})</span>
            </h3>
            <div className="flex flex-1 flex-col gap-2">
              {columnTickets.length === 0 ? (
                <p
                  className="py-4 text-center text-xs"
                  style={{ color: "var(--admin-text-subtle)" }}
                >
                  Koi ticket nahi
                </p>
              ) : (
                columnTickets.map((ticket) => (
                  <TicketCard
                    key={ticket.id}
                    ticket={ticket}
                    departments={departments}
                    compact={ticket.issueType === "subtask"}
                    draggable={canManage}
                    onDragStart={(e, id) => {
                      setDraggingId(id);
                      e.dataTransfer.effectAllowed = "move";
                    }}
                  />
                ))
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
