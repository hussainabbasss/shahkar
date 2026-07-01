"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { X } from "lucide-react";
import {
  assignToMeAction,
  fetchSharedTicketAction,
} from "@/app/actions/admin/tickets";
import {
  DepartmentBadge,
  IssueTypeBadge,
  TicketStatusBadge,
} from "@/components/admin/tickets/TicketBadges";
import {
  PRIORITY_LABELS,
  STATUS_LABELS,
  type TicketEntitySnapshot,
} from "@/lib/admin/tickets";

type SharedTicketDetailDialogProps = {
  snapshot: TicketEntitySnapshot;
  canViewTickets: boolean;
  canManageTickets: boolean;
  onClose: () => void;
};

export function SharedTicketDetailDialog({
  snapshot,
  canViewTickets,
  canManageTickets,
  onClose,
}: SharedTicketDetailDialogProps) {
  const [loading, setLoading] = useState(true);
  const [snapshotOnly, setSnapshotOnly] = useState(false);
  const [ticket, setTicket] = useState<Awaited<
    ReturnType<typeof fetchSharedTicketAction>
  >["ticket"]>(null);
  const [assigning, setAssigning] = useState(false);

  useEffect(() => {
    fetchSharedTicketAction(snapshot.id)
      .then((res) => {
        setTicket(res.ticket);
        setSnapshotOnly(res.snapshotOnly);
      })
      .finally(() => setLoading(false));
  }, [snapshot.id]);

  const data = ticket;
  const display = data ?? snapshot;

  async function handleAssignToMe() {
    setAssigning(true);
    await assignToMeAction(snapshot.ticketKey);
    setAssigning(false);
    onClose();
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: "rgba(0,0,0,0.5)" }}
      onClick={onClose}
    >
      <div
        className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-xl p-6"
        style={{
          background: "var(--admin-surface)",
          border: "1px solid var(--admin-border)",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-4 flex items-start justify-between">
          <h2
            className="text-lg font-bold"
            style={{ color: "var(--admin-text-heading)" }}
          >
            Ticket detail
          </h2>
          <button type="button" onClick={onClose} aria-label="Close">
            <X size={20} />
          </button>
        </div>

        {loading ? (
          <p style={{ color: "var(--admin-text-muted)" }}>Loading…</p>
        ) : (
          <>
            {snapshotOnly && (
              <p
                className="mb-3 rounded-lg p-3 text-sm"
                style={{
                  background:
                    "color-mix(in srgb, var(--admin-accent) 10%, transparent)",
                  color: "var(--admin-text-muted)",
                }}
              >
                You need permission to view full details.
              </p>
            )}

            <p
              className="text-sm font-bold"
              style={{ color: "var(--admin-primary)" }}
            >
              {display.ticketKey ?? snapshot.ticketKey}
            </p>
            <p
              className="mt-1 text-lg font-bold"
              style={{ color: "var(--admin-text-heading)" }}
            >
              {display.title}
            </p>

            <div className="mt-3 flex flex-wrap gap-2">
              <IssueTypeBadge
                issueType={
                  "issueType" in display
                    ? display.issueType
                    : snapshot.issueType
                }
              />
              <DepartmentBadge
                department={
                  "department" in display ? display.department : snapshot.department
                }
                name={
                  "departmentName" in snapshot
                    ? snapshot.departmentName
                    : undefined
                }
              />
              <TicketStatusBadge status={display.status} />
            </div>

            <dl className="mt-4 space-y-2 text-sm">
              <div className="flex justify-between">
                <dt style={{ color: "var(--admin-text-muted)" }}>Priority</dt>
                <dd>{PRIORITY_LABELS[display.priority]}</dd>
              </div>
              <div className="flex justify-between">
                <dt style={{ color: "var(--admin-text-muted)" }}>Status</dt>
                <dd>{STATUS_LABELS[display.status]}</dd>
              </div>
              <div className="flex justify-between">
                <dt style={{ color: "var(--admin-text-muted)" }}>Assignee</dt>
                <dd>
                  {"assigneeName" in display && display.assigneeName
                    ? display.assigneeName
                    : snapshot.assigneeName ?? "Unassigned"}
                </dd>
              </div>
              {snapshot.parentKey && (
                <div className="flex justify-between">
                  <dt style={{ color: "var(--admin-text-muted)" }}>Parent</dt>
                  <dd>
                    {snapshot.parentKey}
                    {snapshot.parentTitle ? ` — ${snapshot.parentTitle}` : ""}
                  </dd>
                </div>
              )}
            </dl>

            {data?.description && (
              <p
                className="mt-4 whitespace-pre-wrap text-sm leading-relaxed"
                style={{ color: "var(--admin-text-body, #1F2937)" }}
              >
                {data.description}
              </p>
            )}

            <div className="mt-6 flex flex-wrap gap-2">
              {canViewTickets && (
                <Link
                  href={`/admin/tickets/${snapshot.ticketKey}`}
                  className="rounded-lg px-4 py-2 text-sm font-semibold text-white"
                  style={{ background: "var(--admin-primary)" }}
                >
                  Admin mein kholo
                </Link>
              )}
              {canManageTickets &&
                !snapshot.assigneeName &&
                !data?.assigneeName && (
                  <button
                    type="button"
                    onClick={() => void handleAssignToMe()}
                    disabled={assigning}
                    className="rounded-lg px-4 py-2 text-sm font-semibold"
                    style={{
                      border: "1px solid var(--admin-border)",
                      color: "var(--admin-text-heading)",
                    }}
                  >
                    Assign to me
                  </button>
                )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
