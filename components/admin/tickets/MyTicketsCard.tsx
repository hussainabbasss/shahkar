"use client";

import Link from "next/link";
import { ClipboardList } from "lucide-react";
import { PRIORITY_LABELS } from "@/lib/admin/tickets";
import type { MyTicketSummary } from "@/lib/db/admin/tickets";
import type { TicketDepartmentRecord } from "@/lib/db/admin/ticket-departments";
import { DepartmentBadge } from "@/components/admin/tickets/TicketBadges";

type MyTicketsCardProps = {
  items: MyTicketSummary[];
  departments?: TicketDepartmentRecord[];
};

export function MyTicketsCard({
  items,
  departments = [],
}: MyTicketsCardProps) {
  return (
    <div
      className="rounded-xl p-5"
      style={{
        background: "var(--admin-surface)",
        border: "1px solid var(--admin-border)",
        boxShadow: "var(--admin-shadow-sm)",
      }}
    >
      <div className="mb-4 flex items-center gap-2">
        <ClipboardList size={18} style={{ color: "var(--admin-primary)" }} />
        <h3
          className="text-sm font-bold"
          style={{ color: "var(--admin-text-heading)" }}
        >
          My Tickets
        </h3>
      </div>

      {items.length === 0 ? (
        <p className="text-sm" style={{ color: "var(--admin-text-muted)" }}>
          Aap par koi active ticket nahi
        </p>
      ) : (
        <ul className="space-y-3">
          {items.map((item) => (
            <li key={item.id}>
              <Link
                href={`/admin/tickets/${item.ticketKey}`}
                className="block rounded-lg p-3 transition-colors hover:bg-[color-mix(in_srgb,var(--admin-primary)_6%,transparent)]"
              >
                <div className="flex items-center justify-between gap-2">
                  <p
                    className="truncate text-sm font-semibold"
                    style={{ color: "var(--admin-text-heading)" }}
                  >
                    {item.ticketKey} — {item.title}
                  </p>
                  <span
                    className="shrink-0 text-[10px] font-semibold"
                    style={{ color: "var(--admin-accent)" }}
                  >
                    {PRIORITY_LABELS[item.priority]}
                  </span>
                </div>
                <div className="mt-1">
                  <DepartmentBadge
                    department={item.department}
                    departments={departments}
                  />
                </div>
              </Link>
            </li>
          ))}
        </ul>
      )}

      <Link
        href="/admin/tickets"
        className="mt-4 inline-block text-sm font-semibold"
        style={{ color: "var(--admin-primary)" }}
      >
        Board dekho →
      </Link>
    </div>
  );
}
