"use client";

import {
  STATUS_LABELS,
  ISSUE_TYPE_LABELS,
  getDepartmentDisplay,
  type TicketDepartment,
} from "@/lib/admin/tickets";
import type { AdminTicket } from "@/lib/db/admin/tickets";
import type { TicketDepartmentRecord } from "@/lib/db/admin/ticket-departments";

type TicketFiltersProps = {
  departments: TicketDepartmentRecord[];
  department: TicketDepartment | null;
  epicId: string | null;
  storyId: string | null;
  epics: AdminTicket[];
  stories: AdminTicket[];
  onDepartmentChange: (d: TicketDepartment | null) => void;
  onEpicChange: (id: string | null) => void;
  onStoryChange: (id: string | null) => void;
};

export function TicketFilters({
  departments,
  department,
  epicId,
  storyId,
  epics,
  stories,
  onDepartmentChange,
  onEpicChange,
  onStoryChange,
}: TicketFiltersProps) {
  const filteredStories = epicId
    ? stories.filter((s) => s.parentId === epicId)
    : stories;

  return (
    <div className="flex flex-wrap items-center gap-3">
      <div className="flex flex-wrap gap-1.5">
        <button
          key="all"
          type="button"
          onClick={() => onDepartmentChange(null)}
          className="rounded-full px-3 py-1.5 text-xs font-semibold transition-colors"
          style={{
            background:
              department === null
                ? "var(--admin-primary)"
                : "color-mix(in srgb, var(--admin-border) 40%, transparent)",
            color: department === null ? "#fff" : "var(--admin-text-muted)",
          }}
        >
          All
        </button>
        {departments.map((d) => (
          <button
            key={d.slug}
            type="button"
            onClick={() => onDepartmentChange(d.slug)}
            className="rounded-full px-3 py-1.5 text-xs font-semibold transition-colors"
            style={{
              background:
                department === d.slug
                  ? "var(--admin-primary)"
                  : "color-mix(in srgb, var(--admin-border) 40%, transparent)",
              color:
                department === d.slug ? "#fff" : "var(--admin-text-muted)",
            }}
          >
            {d.name}
          </button>
        ))}
      </div>

      <select
        value={epicId ?? ""}
        onChange={(e) => {
          onEpicChange(e.target.value || null);
          onStoryChange(null);
        }}
        className="rounded-lg px-3 py-1.5 text-xs"
        style={{
          border: "1px solid var(--admin-border)",
          background: "var(--admin-surface)",
          color: "var(--admin-text-heading)",
        }}
      >
        <option value="">All Epics</option>
        {epics.map((e) => (
          <option key={e.id} value={e.id}>
            {e.ticketKey} — {e.title}
          </option>
        ))}
      </select>

      <select
        value={storyId ?? ""}
        onChange={(e) => onStoryChange(e.target.value || null)}
        className="rounded-lg px-3 py-1.5 text-xs"
        style={{
          border: "1px solid var(--admin-border)",
          background: "var(--admin-surface)",
          color: "var(--admin-text-heading)",
        }}
      >
        <option value="">All Stories</option>
        {filteredStories.map((s) => (
          <option key={s.id} value={s.id}>
            {s.ticketKey} — {s.title}
          </option>
        ))}
      </select>
    </div>
  );
}

export function TicketListTable({
  tickets,
  departments,
}: {
  tickets: AdminTicket[];
  departments: TicketDepartmentRecord[];
}) {
  if (!tickets.length) {
    return (
      <p className="py-8 text-center text-sm" style={{ color: "var(--admin-text-muted)" }}>
        Koi ticket nahi
      </p>
    );
  }

  return (
    <div className="overflow-x-auto rounded-xl" style={{ border: "1px solid var(--admin-border)" }}>
      <table className="w-full min-w-[720px] text-left text-sm">
        <thead>
          <tr style={{ background: "color-mix(in srgb, var(--admin-border) 30%, transparent)" }}>
            {["Key", "Title", "Type", "Department", "Status", "Assignee", "Parent", "Updated"].map(
              (h) => (
                <th
                  key={h}
                  className="px-4 py-3 text-[11px] font-semibold uppercase tracking-wide"
                  style={{ color: "var(--admin-text-subtle)" }}
                >
                  {h}
                </th>
              ),
            )}
          </tr>
        </thead>
        <tbody>
          {tickets.map((t) => (
            <tr
              key={t.id}
              className="border-t transition-colors hover:bg-[color-mix(in_srgb,var(--admin-primary)_4%,transparent)]"
              style={{ borderColor: "var(--admin-border)" }}
            >
              <td className="px-4 py-3">
                <a
                  href={`/admin/tickets/${t.ticketKey}`}
                  className="font-semibold"
                  style={{ color: "var(--admin-primary)" }}
                >
                  {t.ticketKey}
                </a>
              </td>
              <td
                className="max-w-[200px] truncate px-4 py-3 font-medium"
                style={{ color: "var(--admin-text-heading)" }}
              >
                {t.title}
              </td>
              <td className="px-4 py-3" style={{ color: "var(--admin-text-muted)" }}>
                {ISSUE_TYPE_LABELS[t.issueType]}
              </td>
              <td className="px-4 py-3" style={{ color: "var(--admin-text-muted)" }}>
                {getDepartmentDisplay(t.department, departments).name}
              </td>
              <td className="px-4 py-3" style={{ color: "var(--admin-text-muted)" }}>
                {STATUS_LABELS[t.status]}
              </td>
              <td className="px-4 py-3" style={{ color: "var(--admin-text-muted)" }}>
                {t.assigneeName ?? "—"}
              </td>
              <td className="px-4 py-3" style={{ color: "var(--admin-text-muted)" }}>
                {t.parentKey ?? "—"}
              </td>
              <td className="px-4 py-3 text-xs" style={{ color: "var(--admin-text-subtle)" }}>
                {new Date(t.updatedAt).toLocaleDateString("en-PK", {
                  day: "numeric",
                  month: "short",
                  timeZone: "Asia/Karachi",
                })}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
