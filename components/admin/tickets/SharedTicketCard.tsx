"use client";

import {
  DepartmentBadge,
  IssueTypeBadge,
  TicketStatusBadge,
} from "@/components/admin/tickets/TicketBadges";
import { PRIORITY_LABELS, type TicketEntitySnapshot } from "@/lib/admin/tickets";

type SharedTicketCardProps = {
  snapshot: TicketEntitySnapshot;
  onClick: () => void;
};

export function SharedTicketCard({ snapshot, onClick }: SharedTicketCardProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="mt-2 w-full max-w-[280px] rounded-lg text-left transition-opacity hover:opacity-90"
      style={{
        border: "1px solid var(--admin-border)",
        background: "var(--admin-surface)",
      }}
    >
      <p
        className="px-3 pt-2 text-[10px] font-semibold uppercase tracking-wide"
        style={{ color: "var(--admin-text-subtle)" }}
      >
        Ticket
      </p>
      <div className="p-3 pt-1">
        <p
          className="text-[10px] font-bold"
          style={{ color: "var(--admin-primary)" }}
        >
          {snapshot.ticketKey}
        </p>
        <p
          className="mt-0.5 truncate text-sm font-semibold"
          style={{ color: "var(--admin-text-heading)" }}
        >
          {snapshot.title}
        </p>
        <div className="mt-2 flex flex-wrap gap-1.5">
          <IssueTypeBadge issueType={snapshot.issueType} />
          <DepartmentBadge
            department={snapshot.department}
            name={snapshot.departmentName}
          />
          <TicketStatusBadge status={snapshot.status} />
        </div>
        <p className="mt-2 text-xs" style={{ color: "var(--admin-text-muted)" }}>
          {PRIORITY_LABELS[snapshot.priority]} ·{" "}
          {snapshot.assigneeName ?? "Unassigned"}
        </p>
      </div>
    </button>
  );
}
