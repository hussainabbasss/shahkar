"use client";

import Link from "next/link";
import { MessageSquare } from "lucide-react";
import { formatMessageTime } from "@/lib/admin/messages";
import type { UnreadSummaryItem } from "@/lib/db/admin/messages";

type NewMessagesCardProps = {
  items: UnreadSummaryItem[];
};

export function NewMessagesCard({ items }: NewMessagesCardProps) {
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
        <MessageSquare size={18} style={{ color: "var(--admin-primary)" }} />
        <h3
          className="text-sm font-bold"
          style={{ color: "var(--admin-text-heading)" }}
        >
          New Messages
        </h3>
      </div>

      {items.length === 0 ? (
        <p className="text-sm" style={{ color: "var(--admin-text-muted)" }}>
          No new messages
        </p>
      ) : (
        <ul className="space-y-3">
          {items.map((item) => (
            <li key={item.conversationId}>
              <Link
                href={`/admin/messages/${item.conversationId}`}
                className="block rounded-lg p-3 transition-colors hover:bg-[color-mix(in_srgb,var(--admin-primary)_6%,transparent)]"
              >
                <div className="flex items-center justify-between gap-2">
                  <p
                    className="truncate text-sm font-semibold"
                    style={{ color: "var(--admin-text-heading)" }}
                  >
                    {item.label}
                  </p>
                  <span
                    className="shrink-0 text-[10px]"
                    style={{ color: "var(--admin-text-subtle)" }}
                  >
                    {formatMessageTime(item.lastMessageAt)}
                  </span>
                </div>
                <p
                  className="mt-0.5 truncate text-xs"
                  style={{ color: "var(--admin-text-muted)" }}
                >
                  {item.preview}
                </p>
              </Link>
            </li>
          ))}
        </ul>
      )}

      <Link
        href="/admin/messages"
        className="mt-4 inline-block text-sm font-semibold"
        style={{ color: "var(--admin-primary)" }}
      >
        View all messages →
      </Link>
    </div>
  );
}
