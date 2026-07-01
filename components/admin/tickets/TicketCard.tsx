"use client";

import Link from "next/link";
import {
  AssigneeInitials,
  DepartmentBadge,
  PriorityDot,
} from "@/components/admin/tickets/TicketBadges";
import type { AdminTicket } from "@/lib/db/admin/tickets";
import type { TicketDepartmentRecord } from "@/lib/db/admin/ticket-departments";

type TicketCardProps = {
  ticket: AdminTicket;
  departments: TicketDepartmentRecord[];
  compact?: boolean;
  draggable?: boolean;
  onDragStart?: (e: React.DragEvent, ticketId: string) => void;
};

export function TicketCard({
  ticket,
  departments,
  compact = false,
  draggable = false,
  onDragStart,
}: TicketCardProps) {
  return (
    <Link
      href={`/admin/tickets/${ticket.ticketKey}`}
      draggable={draggable}
      onDragStart={
        draggable && onDragStart
          ? (e) => onDragStart(e, ticket.id)
          : undefined
      }
      className={`block rounded-lg p-3 transition-shadow hover:shadow-md ${
        compact ? "text-sm" : ""
      }`}
      style={{
        background: "var(--admin-surface)",
        border: "1px solid var(--admin-border)",
        cursor: draggable ? "grab" : "pointer",
      }}
    >
      <div className="mb-1.5 flex items-center justify-between gap-2">
        <span
          className="text-[10px] font-bold"
          style={{ color: "var(--admin-text-subtle)" }}
        >
          {ticket.ticketKey}
        </span>
        <PriorityDot priority={ticket.priority} />
      </div>
      <p
        className={`font-semibold leading-snug ${compact ? "text-xs" : "text-sm"}`}
        style={{ color: "var(--admin-text-heading)" }}
      >
        {ticket.issueType === "subtask" && (
          <span className="mr-1" style={{ color: "var(--admin-text-subtle)" }}>
            ↳
          </span>
        )}
        {ticket.title}
      </p>
      <div className="mt-2 flex items-center justify-between gap-2">
        <DepartmentBadge department={ticket.department} departments={departments} />
        <AssigneeInitials name={ticket.assigneeName} />
      </div>
    </Link>
  );
}
