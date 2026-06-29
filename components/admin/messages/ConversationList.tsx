"use client";

import { formatMessageTime } from "@/lib/admin/messages";
import type { ConversationListItem } from "@/lib/db/admin/messages";

type ConversationListProps = {
  conversations: ConversationListItem[];
  activeId: string | null;
  onSelect: (id: string) => void;
  emptyMessage?: string;
};

export function ConversationList({
  conversations,
  activeId,
  onSelect,
  emptyMessage = "No chats yet",
}: ConversationListProps) {
  if (!conversations.length) {
    return (
      <p
        className="p-6 text-center text-sm"
        style={{ color: "var(--admin-text-muted)" }}
      >
        {emptyMessage}
      </p>
    );
  }

  return (
    <div className="divide-y" style={{ borderColor: "var(--admin-border)" }}>
      {conversations.map((conv) => {
        const active = conv.id === activeId;
        return (
          <button
            key={conv.id}
            type="button"
            onClick={() => onSelect(conv.id)}
            className="flex w-full items-start gap-3 px-4 py-3 text-left transition-colors"
            style={{
              background: active
                ? "color-mix(in srgb, var(--admin-primary) 8%, transparent)"
                : undefined,
            }}
          >
            <div
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-sm font-bold text-white"
              style={{ background: "var(--admin-primary)" }}
            >
              {conv.type === "group" ? "G" : conv.label.charAt(0).toUpperCase()}
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center justify-between gap-2">
                <p
                  className="truncate text-sm font-semibold"
                  style={{ color: "var(--admin-text-heading)" }}
                >
                  {conv.label}
                  {conv.type === "group" && conv.memberCount
                    ? ` (${conv.memberCount})`
                    : ""}
                </p>
                {conv.lastMessageAt && (
                  <span
                    className="shrink-0 text-[10px]"
                    style={{ color: "var(--admin-text-subtle)" }}
                  >
                    {formatMessageTime(conv.lastMessageAt)}
                  </span>
                )}
              </div>
              <div className="flex items-center justify-between gap-2">
                <p
                  className="truncate text-xs"
                  style={{ color: "var(--admin-text-muted)" }}
                >
                  {conv.preview ?? "No messages yet"}
                </p>
                {conv.unreadCount > 0 && (
                  <span
                    className="flex h-5 min-w-5 shrink-0 items-center justify-center rounded-full px-1.5 text-[10px] font-bold text-white"
                    style={{ background: "var(--admin-primary)" }}
                  >
                    {conv.unreadCount}
                  </span>
                )}
              </div>
            </div>
          </button>
        );
      })}
    </div>
  );
}
