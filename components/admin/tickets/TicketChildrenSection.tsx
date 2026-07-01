"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { IssueTypeBadge, TicketStatusBadge } from "@/components/admin/tickets/TicketBadges";
import { QuickAddChildForm } from "@/components/admin/tickets/QuickAddChildForm";
import {
  canHaveChildren,
  getAllowedChildTypes,
} from "@/lib/admin/tickets";
import type { AdminTicket, TicketTaskNode } from "@/lib/db/admin/tickets";

type TicketChildrenSectionProps = {
  ticket: AdminTicket;
  children: AdminTicket[];
  storyTaskTree?: TicketTaskNode[];
  canManage: boolean;
};

export function TicketChildrenSection({
  ticket,
  children,
  storyTaskTree = [],
  canManage,
}: TicketChildrenSectionProps) {
  const router = useRouter();
  const refresh = () => router.refresh();

  if (!canHaveChildren(ticket.issueType) && children.length === 0) {
    return null;
  }

  const allowedTypes = getAllowedChildTypes(ticket.issueType);

  if (ticket.issueType === "story") {
    const taskCount = storyTaskTree.length;
    const subtaskCount = storyTaskTree.reduce(
      (n, node) => n + node.subtasks.length,
      0,
    );

    return (
      <section
        className="rounded-xl p-5"
        style={{
          background: "var(--admin-surface)",
          border: "1px solid var(--admin-border)",
        }}
      >
        <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
          <h2
            className="text-sm font-bold"
            style={{ color: "var(--admin-text-heading)" }}
          >
            Tasks & Sub-tasks ({taskCount} tasks, {subtaskCount} sub-tasks)
          </h2>
        </div>

        {canManage && (
          <div className="mb-4">
            <QuickAddChildForm
              parentTicketKey={ticket.ticketKey}
              issueType="task"
              label="Task"
              onCreated={refresh}
            />
          </div>
        )}

        {storyTaskTree.length === 0 ? (
          <p className="text-sm" style={{ color: "var(--admin-text-muted)" }}>
            Abhi koi task nahi — upar se task add karein, phir us ke andar
            sub-task.
          </p>
        ) : (
          <ul className="space-y-4">
            {storyTaskTree.map(({ task: childTask, subtasks }) => (
              <li
                key={childTask.id}
                className="rounded-lg p-3"
                style={{
                  border: "1px solid var(--admin-border)",
                }}
              >
                <Link
                  href={`/admin/tickets/${childTask.ticketKey}`}
                  className="flex flex-wrap items-center justify-between gap-2"
                >
                  <div className="flex flex-wrap items-center gap-2">
                    <span
                      className="text-sm font-semibold"
                      style={{ color: "var(--admin-text-heading)" }}
                    >
                      {childTask.ticketKey} — {childTask.title}
                    </span>
                    <IssueTypeBadge issueType="task" />
                  </div>
                  <TicketStatusBadge status={childTask.status} />
                </Link>

                {subtasks.length > 0 && (
                  <ul className="mt-3 space-y-1 border-l-2 pl-3" style={{ borderColor: "var(--admin-border)" }}>
                    {subtasks.map((st) => (
                      <li key={st.id}>
                        <Link
                          href={`/admin/tickets/${st.ticketKey}`}
                          className="flex items-center justify-between rounded px-2 py-1.5 text-sm hover:bg-[color-mix(in_srgb,var(--admin-primary)_6%,transparent)]"
                        >
                          <span style={{ color: "var(--admin-text-heading)" }}>
                            ↳ {st.ticketKey} — {st.title}
                          </span>
                          <TicketStatusBadge status={st.status} />
                        </Link>
                      </li>
                    ))}
                  </ul>
                )}

                {canManage && (
                  <div className="mt-2 pl-3">
                    <QuickAddChildForm
                      parentTicketKey={childTask.ticketKey}
                      issueType="subtask"
                      label="Sub-task"
                      onCreated={refresh}
                    />
                  </div>
                )}
              </li>
            ))}
          </ul>
        )}
      </section>
    );
  }

  const sectionTitle =
    ticket.issueType === "task"
      ? `Sub-tasks (${children.length})`
      : ticket.issueType === "epic"
        ? `Children (${children.length})`
        : `Children (${children.length})`;

  return (
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
        {sectionTitle}
      </h2>

      {canManage && allowedTypes.length > 0 && (
        <div className="mb-4 flex flex-wrap gap-4">
          {allowedTypes.map((type) => (
            <QuickAddChildForm
              key={type}
              parentTicketKey={ticket.ticketKey}
              issueType={type}
              onCreated={refresh}
            />
          ))}
        </div>
      )}

      {children.length === 0 ? (
        <p className="text-sm" style={{ color: "var(--admin-text-muted)" }}>
          {ticket.issueType === "task"
            ? "Abhi koi sub-task nahi."
            : "Abhi koi child ticket nahi."}
        </p>
      ) : (
        <ul className="space-y-2">
          {children.map((c) => (
            <li key={c.id}>
              <Link
                href={`/admin/tickets/${c.ticketKey}`}
                className="flex items-center justify-between rounded-lg px-3 py-2 transition-colors hover:bg-[color-mix(in_srgb,var(--admin-primary)_6%,transparent)]"
              >
                <div className="flex items-center gap-2">
                  <span
                    className="text-sm font-medium"
                    style={{ color: "var(--admin-text-heading)" }}
                  >
                    {c.ticketKey} — {c.title}
                  </span>
                  <IssueTypeBadge issueType={c.issueType} />
                </div>
                <TicketStatusBadge status={c.status} />
              </Link>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
