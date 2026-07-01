"use client";

import {
  getDepartmentDisplay,
  ISSUE_TYPE_LABELS,
  PRIORITY_COLORS,
  STATUS_LABELS,
  type TicketPriority,
  type TicketStatus,
} from "@/lib/admin/tickets";
import type { TicketDepartmentRecord } from "@/lib/db/admin/ticket-departments";

export function DepartmentBadge({
  department,
  name,
  departments = [],
}: {
  department: string;
  name?: string;
  departments?: TicketDepartmentRecord[];
}) {
  const display = getDepartmentDisplay(department, departments);
  if (name) display.name = name;

  return (
    <span
      className="inline-block rounded-full px-2 py-0.5 text-[10px] font-semibold"
      style={{ background: display.bg, color: display.text }}
    >
      {display.name}
    </span>
  );
}

export function IssueTypeBadge({ issueType }: { issueType: string }) {
  return (
    <span
      className="inline-block rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase"
      style={{
        background: "color-mix(in srgb, var(--admin-border) 50%, transparent)",
        color: "var(--admin-text-muted)",
      }}
    >
      {ISSUE_TYPE_LABELS[issueType as keyof typeof ISSUE_TYPE_LABELS] ??
        issueType}
    </span>
  );
}

export function TicketStatusBadge({ status }: { status: TicketStatus }) {
  const color =
    status === "done"
      ? "var(--admin-success)"
      : status === "in_progress"
        ? "var(--admin-info, #2563EB)"
        : status === "cancelled"
          ? "var(--admin-text-subtle)"
          : status === "todo"
            ? "var(--admin-accent)"
            : "var(--admin-text-muted)";

  return (
    <span
      className="inline-block rounded-full px-2 py-0.5 text-[10px] font-semibold"
      style={{
        background: `color-mix(in srgb, ${color} 15%, transparent)`,
        color,
      }}
    >
      {STATUS_LABELS[status]}
    </span>
  );
}

export function PriorityDot({ priority }: { priority: TicketPriority }) {
  return (
    <span
      className="inline-block h-2 w-2 shrink-0 rounded-full"
      style={{ background: PRIORITY_COLORS[priority] }}
      title={priority}
    />
  );
}

export function AssigneeInitials({ name }: { name: string | null }) {
  if (!name) {
    return (
      <span
        className="flex h-6 w-6 items-center justify-center rounded-full text-[10px] font-semibold"
        style={{
          background: "var(--admin-border)",
          color: "var(--admin-text-muted)",
        }}
        title="Unassigned"
      >
        —
      </span>
    );
  }
  const parts = name.trim().split(/\s+/);
  const initials =
    parts.length >= 2
      ? `${parts[0]![0]}${parts[1]![0]}`
      : name.slice(0, 2);
  return (
    <span
      className="flex h-6 w-6 items-center justify-center rounded-full text-[10px] font-bold text-white"
      style={{ background: "var(--admin-primary)" }}
      title={name}
    >
      {initials.toUpperCase()}
    </span>
  );
}
