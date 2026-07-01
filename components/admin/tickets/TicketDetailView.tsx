"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Pencil, Trash2 } from "lucide-react";
import {
  assignTicketAction,
  deleteTicketAction,
  markTicketViewedAction,
  updateTicketStatusAction,
} from "@/app/actions/admin/tickets";
import {
  AdminDangerButton,
  adminInputClass,
} from "@/components/admin/AdminUI";
import {
  AssigneeInitials,
  DepartmentBadge,
  IssueTypeBadge,
  TicketStatusBadge,
} from "@/components/admin/tickets/TicketBadges";
import { TicketChildrenSection } from "@/components/admin/tickets/TicketChildrenSection";
import { TicketComments } from "@/components/admin/tickets/TicketComments";
import { TicketLinkedEntities } from "@/components/admin/tickets/TicketLinkedEntities";
import {
  PRIORITY_LABELS,
  STATUS_LABELS,
  canHaveChildren,
  type TicketStatus,
} from "@/lib/admin/tickets";
import type { TicketComment } from "@/lib/db/admin/ticket-comments";
import type { AdminTicket, StaffOption, TicketTaskNode } from "@/lib/db/admin/tickets";
import type { TicketDepartmentRecord } from "@/lib/db/admin/ticket-departments";

type TicketDetailViewProps = {
  ticket: AdminTicket;
  children: AdminTicket[];
  storyTaskTree?: TicketTaskNode[];
  comments: TicketComment[];
  currentUserId: string;
  staff: StaffOption[];
  departments: TicketDepartmentRecord[];
  canManage: boolean;
};

const STATUSES: TicketStatus[] = [
  "backlog",
  "todo",
  "in_progress",
  "done",
  "cancelled",
];

export function TicketDetailView({
  ticket,
  children,
  storyTaskTree = [],
  comments,
  currentUserId,
  staff,
  departments,
  canManage,
}: TicketDetailViewProps) {
  const router = useRouter();
  const [status, setStatus] = useState(ticket.status);
  const [assigneeId, setAssigneeId] = useState(ticket.assigneeId ?? "");
  const [deleting, setDeleting] = useState(false);
  const childCount = children.length;

  useEffect(() => {
    void markTicketViewedAction(ticket.ticketKey);
  }, [ticket.ticketKey]);

  async function handleStatusChange(newStatus: TicketStatus) {
    const result = await updateTicketStatusAction(ticket.ticketKey, newStatus);
    if (result.success) {
      setStatus(newStatus);
      router.refresh();
    }
  }

  async function handleAssign() {
    const result = await assignTicketAction(
      ticket.ticketKey,
      assigneeId || null,
    );
    if (result.success) router.refresh();
  }

  async function handleDelete() {
    const msg =
      childCount > 0
        ? `Is ticket ke ${childCount} child tickets orphan ho jayenge. Delete karein?`
        : "Yeh ticket delete karein?";
    if (!confirm(msg)) return;
    setDeleting(true);
    const result = await deleteTicketAction(ticket.ticketKey);
    setDeleting(false);
    if (result.success) {
      router.push("/admin/tickets");
      router.refresh();
    }
  }

  const showChildren =
    canHaveChildren(ticket.issueType) || children.length > 0;

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p
            className="text-sm font-bold"
            style={{ color: "var(--admin-primary)" }}
          >
            {ticket.ticketKey}
          </p>
          <h1
            className="mt-1 text-2xl font-bold"
            style={{ color: "var(--admin-text-heading)" }}
          >
            {ticket.title}
          </h1>
          <div className="mt-3 flex flex-wrap gap-2">
            <TicketStatusBadge status={status} />
            <DepartmentBadge
              department={ticket.department}
              departments={departments}
            />
            <IssueTypeBadge issueType={ticket.issueType} />
          </div>
        </div>
        {canManage && (
          <div className="flex flex-wrap gap-2">
            <Link href={`/admin/tickets/${ticket.ticketKey}/edit`}>
              <button
                type="button"
                className="flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-semibold"
                style={{
                  border: "1px solid var(--admin-border)",
                  color: "var(--admin-text-heading)",
                }}
              >
                <Pencil size={14} />
                Edit
              </button>
            </Link>
            <AdminDangerButton
              type="button"
              onClick={() => void handleDelete()}
              disabled={deleting}
            >
              <Trash2 size={14} className="mr-1 inline" />
              Delete
            </AdminDangerButton>
          </div>
        )}
      </header>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-4 lg:col-span-2">
          {ticket.description && (
            <section
              className="rounded-xl p-5"
              style={{
                background: "var(--admin-surface)",
                border: "1px solid var(--admin-border)",
              }}
            >
              <h2
                className="mb-2 text-sm font-bold"
                style={{ color: "var(--admin-text-heading)" }}
              >
                Description
              </h2>
              <p
                className="whitespace-pre-wrap text-sm leading-relaxed"
                style={{ color: "var(--admin-text-body, #1F2937)" }}
              >
                {ticket.description}
              </p>
            </section>
          )}

          {(ticket.linkedOrder || ticket.linkedProduct) && (
            <TicketLinkedEntities
              linkedOrder={ticket.linkedOrder}
              linkedProduct={ticket.linkedProduct}
            />
          )}

          {showChildren && (
            <TicketChildrenSection
              ticket={ticket}
              children={children}
              storyTaskTree={storyTaskTree}
              canManage={canManage}
            />
          )}

          <TicketComments
            ticketKey={ticket.ticketKey}
            initialComments={comments}
            currentUserId={currentUserId}
            canManage={canManage}
          />

          <section
            className="rounded-xl p-5"
            style={{
              background: "var(--admin-surface)",
              border: "1px solid var(--admin-border)",
            }}
          >
            <h2
              className="mb-3 text-sm font-bold"
              style={{ color: "var(--admin-text-heading)" }}
            >
              Activity
            </h2>
            <dl className="space-y-2 text-sm">
              <div className="flex justify-between">
                <dt style={{ color: "var(--admin-text-muted)" }}>Created</dt>
                <dd style={{ color: "var(--admin-text-heading)" }}>
                  {new Date(ticket.createdAt).toLocaleString("en-PK", {
                    timeZone: "Asia/Karachi",
                  })}
                </dd>
              </div>
              <div className="flex justify-between">
                <dt style={{ color: "var(--admin-text-muted)" }}>Updated</dt>
                <dd style={{ color: "var(--admin-text-heading)" }}>
                  {new Date(ticket.updatedAt).toLocaleString("en-PK", {
                    timeZone: "Asia/Karachi",
                  })}
                </dd>
              </div>
              {ticket.completedAt && (
                <div className="flex justify-between">
                  <dt style={{ color: "var(--admin-text-muted)" }}>Completed</dt>
                  <dd style={{ color: "var(--admin-text-heading)" }}>
                    {new Date(ticket.completedAt).toLocaleString("en-PK", {
                      timeZone: "Asia/Karachi",
                    })}
                  </dd>
                </div>
              )}
            </dl>
          </section>
        </div>

        <aside
          className="space-y-4 rounded-xl p-5"
          style={{
            background: "var(--admin-surface)",
            border: "1px solid var(--admin-border)",
            height: "fit-content",
          }}
        >
          <div>
            <p
              className="text-[11px] font-semibold uppercase tracking-wide"
              style={{ color: "var(--admin-text-subtle)" }}
            >
              Reporter
            </p>
            <p className="mt-1 text-sm font-medium">{ticket.reporterName}</p>
          </div>

          <div>
            <p
              className="text-[11px] font-semibold uppercase tracking-wide"
              style={{ color: "var(--admin-text-subtle)" }}
            >
              Assignee
            </p>
            <div className="mt-1 flex items-center gap-2">
              <AssigneeInitials name={ticket.assigneeName} />
              <span className="text-sm">
                {ticket.assigneeName ?? "Unassigned"}
              </span>
            </div>
            {canManage && (
              <div className="mt-2 flex gap-2">
                <select
                  value={assigneeId}
                  onChange={(e) => setAssigneeId(e.target.value)}
                  className={`${adminInputClass} flex-1 text-sm`}
                >
                  <option value="">Unassigned</option>
                  {staff.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name}
                    </option>
                  ))}
                </select>
                <button
                  type="button"
                  onClick={() => void handleAssign()}
                  className="rounded-lg px-3 py-2 text-xs font-semibold text-white"
                  style={{ background: "var(--admin-primary)" }}
                >
                  Save
                </button>
              </div>
            )}
          </div>

          <div>
            <p
              className="text-[11px] font-semibold uppercase tracking-wide"
              style={{ color: "var(--admin-text-subtle)" }}
            >
              Priority
            </p>
            <p className="mt-1 text-sm">{PRIORITY_LABELS[ticket.priority]}</p>
          </div>

          {ticket.parentKey && (
            <div>
              <p
                className="text-[11px] font-semibold uppercase tracking-wide"
                style={{ color: "var(--admin-text-subtle)" }}
              >
                Parent
              </p>
              <Link
                href={`/admin/tickets/${ticket.parentKey}`}
                className="mt-1 block text-sm font-medium"
                style={{ color: "var(--admin-primary)" }}
              >
                {ticket.parentKey} — {ticket.parentTitle}
              </Link>
            </div>
          )}

          {ticket.dueDate && (
            <div>
              <p
                className="text-[11px] font-semibold uppercase tracking-wide"
                style={{ color: "var(--admin-text-subtle)" }}
              >
                Due date
              </p>
              <p className="mt-1 text-sm">{ticket.dueDate}</p>
            </div>
          )}

          {canManage && (
            <div>
              <p
                className="mb-2 text-[11px] font-semibold uppercase tracking-wide"
                style={{ color: "var(--admin-text-subtle)" }}
              >
                Status
              </p>
              <select
                value={status}
                onChange={(e) =>
                  void handleStatusChange(e.target.value as TicketStatus)
                }
                className={adminInputClass}
              >
                {STATUSES.map((s) => (
                  <option key={s} value={s}>
                    {STATUS_LABELS[s]}
                  </option>
                ))}
              </select>
            </div>
          )}
        </aside>
      </div>
    </div>
  );
}
