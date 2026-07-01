"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import {
  AdminField,
  AdminFormSection,
  AdminPrimaryButton,
  adminInputClass,
} from "@/components/admin/AdminUI";
import {
  createTicketAction,
  searchOrdersForTicketLinkAction,
  searchParentCandidatesAction,
  updateTicketAction,
} from "@/app/actions/admin/tickets";
import { AddDepartmentInline } from "@/components/admin/tickets/AddDepartmentInline";
import {
  ISSUE_TYPE_LABELS,
  PRIORITY_LABELS,
  STATUS_LABELS,
  type IssueType,
  type TicketDepartment,
  type TicketPriority,
  type TicketStatus,
} from "@/lib/admin/tickets";
import type { AdminTicket, StaffOption, TicketOrderLinkOption } from "@/lib/db/admin/tickets";
import type { TicketDepartmentRecord } from "@/lib/db/admin/ticket-departments";

type TicketFormProps = {
  staff: StaffOption[];
  departments: TicketDepartmentRecord[];
  canManageDepartments?: boolean;
  initial?: AdminTicket;
  defaultParentId?: string | null;
  defaultDepartment?: TicketDepartment;
  defaultIssueType?: IssueType;
};

const ISSUE_TYPES: IssueType[] = ["epic", "story", "task", "subtask"];
const STATUSES: TicketStatus[] = [
  "backlog",
  "todo",
  "in_progress",
  "done",
  "cancelled",
];
const PRIORITIES: TicketPriority[] = ["low", "medium", "high", "urgent"];

export function TicketForm({
  staff,
  departments: initialDepartments,
  canManageDepartments = false,
  initial,
  defaultParentId = null,
  defaultDepartment = "development",
  defaultIssueType = "task",
}: TicketFormProps) {
  const router = useRouter();
  const isEdit = !!initial;
  const [departments, setDepartments] = useState(initialDepartments);

  const [issueType, setIssueType] = useState<IssueType>(
    initial?.issueType ?? defaultIssueType,
  );
  const [department, setDepartment] = useState<TicketDepartment>(
    initial?.department ??
      defaultDepartment ??
      departments[0]?.slug ??
      "development",
  );
  const [parentId, setParentId] = useState<string | null>(
    initial?.parentId ?? defaultParentId,
  );
  const [title, setTitle] = useState(initial?.title ?? "");
  const [description, setDescription] = useState(initial?.description ?? "");
  const [status, setStatus] = useState<TicketStatus>(
    initial?.status ?? "backlog",
  );
  const [priority, setPriority] = useState<TicketPriority>(
    initial?.priority ?? "medium",
  );
  const [assigneeId, setAssigneeId] = useState<string>(
    initial?.assigneeId ?? "",
  );
  const [dueDate, setDueDate] = useState(initial?.dueDate ?? "");
  const [parentSearch, setParentSearch] = useState("");
  const [parentOptions, setParentOptions] = useState<AdminTicket[]>([]);
  const [linkedOrderId, setLinkedOrderId] = useState<string | null>(
    initial?.linkedOrderId ?? null,
  );
  const [orderSearch, setOrderSearch] = useState("");
  const [orderOptions, setOrderOptions] = useState<TicketOrderLinkOption[]>([]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const needsParent = issueType !== "epic";

  useEffect(() => {
    if (initial?.linkedOrder) {
      setOrderOptions([
        {
          id: initial.linkedOrder.id,
          orderNumber: initial.linkedOrder.orderNumber,
          customerName: initial.linkedOrder.customerName,
          customerPhone: initial.linkedOrder.customerPhone,
          status: initial.linkedOrder.status,
        },
      ]);
    }
  }, [initial?.linkedOrder]);

  useEffect(() => {
    if (!needsParent) {
      setParentId(null);
      return;
    }
    const t = setTimeout(() => {
      searchParentCandidatesAction(issueType, parentSearch)
        .then(setParentOptions)
        .catch(() => setParentOptions([]));
    }, 200);
    return () => clearTimeout(t);
  }, [issueType, parentSearch, needsParent]);

  useEffect(() => {
    const t = setTimeout(() => {
      searchOrdersForTicketLinkAction(orderSearch)
        .then(setOrderOptions)
        .catch(() => setOrderOptions([]));
    }, 200);
    return () => clearTimeout(t);
  }, [orderSearch]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError("");

    const payload = {
      issueType,
      department,
      parentId: needsParent ? parentId : null,
      title,
      description: description.trim() || null,
      status,
      priority,
      assigneeId: assigneeId || null,
      dueDate: dueDate || null,
    };

    const result = isEdit
      ? await updateTicketAction({
          ticketKey: initial!.ticketKey,
          title: payload.title,
          description: payload.description,
          department: payload.department,
          parentId: payload.parentId,
          priority: payload.priority,
          dueDate: payload.dueDate,
          linkedOrderId,
        })
      : await createTicketAction({ ...payload, linkedOrderId });

    setSaving(false);

    if (result.success && result.data) {
      router.push(`/admin/tickets/${result.data.ticketKey}`);
      router.refresh();
    } else if (!result.success) {
      setError(result.error);
    }
  }

  return (
    <form onSubmit={(e) => void handleSubmit(e)} className="mx-auto max-w-2xl space-y-6">
      {error && (
        <p
          className="rounded-lg p-3 text-sm"
          style={{
            background: "color-mix(in srgb, var(--admin-error) 10%, transparent)",
            color: "var(--admin-error)",
          }}
        >
          {error}
        </p>
      )}

      <AdminFormSection title="Ticket details">
        {!isEdit && (
          <AdminField label="Issue type">
            <select
              value={issueType}
              onChange={(e) => setIssueType(e.target.value as IssueType)}
              className={adminInputClass}
            >
              {ISSUE_TYPES.map((t) => (
                <option key={t} value={t}>
                  {ISSUE_TYPE_LABELS[t]}
                </option>
              ))}
            </select>
          </AdminField>
        )}

        {needsParent && !isEdit && (
          <AdminField label="Parent" hint="Hierarchy ke mutabiq parent chunein">
            <input
              type="search"
              placeholder="Parent search karein…"
              value={parentSearch}
              onChange={(e) => setParentSearch(e.target.value)}
              className={adminInputClass}
            />
            <select
              value={parentId ?? ""}
              onChange={(e) => setParentId(e.target.value || null)}
              className={`${adminInputClass} mt-2`}
            >
              <option value="">— No parent —</option>
              {parentOptions.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.ticketKey} — {p.title}
                </option>
              ))}
            </select>
          </AdminField>
        )}

        <AdminField label="Department">
          <select
            value={department}
            onChange={(e) => setDepartment(e.target.value)}
            className={adminInputClass}
          >
            {departments.map((d) => (
              <option key={d.slug} value={d.slug}>
                {d.name}
              </option>
            ))}
          </select>
          {canManageDepartments && (
            <AddDepartmentInline
              onCreated={(dept) => {
                setDepartments((prev) => [...prev, dept]);
                setDepartment(dept.slug);
              }}
            />
          )}
        </AdminField>

        <AdminField label="Title">
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            maxLength={200}
            className={adminInputClass}
            placeholder="Kya karna hai?"
          />
        </AdminField>

        <AdminField label="Description">
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={5}
            maxLength={8000}
            className={adminInputClass}
            placeholder="Tafseel likhein (optional)…"
          />
        </AdminField>

        <AdminField
          label="Linked order"
          hint="Optional — order aur customer context ke liye"
        >
          <input
            type="search"
            placeholder="Order #, phone, ya naam search karein…"
            value={orderSearch}
            onChange={(e) => setOrderSearch(e.target.value)}
            className={adminInputClass}
          />
          <select
            value={linkedOrderId ?? ""}
            onChange={(e) => setLinkedOrderId(e.target.value || null)}
            className={`${adminInputClass} mt-2`}
          >
            <option value="">— No linked order —</option>
            {orderOptions.map((o) => (
              <option key={o.id} value={o.id}>
                {o.orderNumber} — {o.customerName} ({o.customerPhone})
              </option>
            ))}
          </select>
        </AdminField>
      </AdminFormSection>

      <AdminFormSection title="Workflow">
        {!isEdit && (
          <AdminField label="Status">
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value as TicketStatus)}
              className={adminInputClass}
            >
              {STATUSES.map((s) => (
                <option key={s} value={s}>
                  {STATUS_LABELS[s]}
                </option>
              ))}
            </select>
          </AdminField>
        )}

        <AdminField label="Priority">
          <select
            value={priority}
            onChange={(e) => setPriority(e.target.value as TicketPriority)}
            className={adminInputClass}
          >
            {PRIORITIES.map((p) => (
              <option key={p} value={p}>
                {PRIORITY_LABELS[p]}
              </option>
            ))}
          </select>
        </AdminField>

        <AdminField label="Assignee">
          <select
            value={assigneeId}
            onChange={(e) => setAssigneeId(e.target.value)}
            className={adminInputClass}
          >
            <option value="">— Unassigned —</option>
            {staff.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
          </select>
        </AdminField>

        <AdminField label="Due date">
          <input
            type="date"
            value={dueDate}
            onChange={(e) => setDueDate(e.target.value)}
            className={adminInputClass}
          />
        </AdminField>
      </AdminFormSection>

      <AdminPrimaryButton type="submit" disabled={saving}>
        {saving ? "Saving…" : isEdit ? "Update ticket" : "Ticket banao"}
      </AdminPrimaryButton>
    </form>
  );
}
