"use client";

import { useState } from "react";
import { Send, Trash2 } from "lucide-react";
import {
  addTicketCommentAction,
  deleteTicketCommentAction,
} from "@/app/actions/admin/tickets";
import { formatMessageTime } from "@/lib/admin/messages";
import type { TicketComment } from "@/lib/db/admin/ticket-comments";

type TicketCommentsProps = {
  ticketKey: string;
  initialComments: TicketComment[];
  currentUserId: string;
  canManage: boolean;
};

export function TicketComments({
  ticketKey,
  initialComments,
  currentUserId,
  canManage,
}: TicketCommentsProps) {
  const [comments, setComments] = useState(initialComments);
  const [body, setBody] = useState("");
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const text = body.trim();
    if (!text) return;
    setSending(true);
    setError("");
    const result = await addTicketCommentAction(ticketKey, text);
    setSending(false);
    if (result.success && result.data) {
      setComments((prev) => [...prev, result.data!]);
      setBody("");
    } else if (!result.success) {
      setError(result.error);
    }
  }

  async function handleDelete(commentId: string) {
    if (!confirm("Yeh comment delete karein?")) return;
    const result = await deleteTicketCommentAction(ticketKey, commentId);
    if (result.success) {
      setComments((prev) => prev.filter((c) => c.id !== commentId));
    }
  }

  return (
    <section
      className="rounded-xl p-5"
      style={{
        background: "var(--admin-surface)",
        border: "1px solid var(--admin-border)",
      }}
    >
      <h2
        className="mb-4 text-sm font-bold"
        style={{ color: "var(--admin-text-heading)" }}
      >
        Comments ({comments.length})
      </h2>

      {comments.length === 0 ? (
        <p className="mb-4 text-sm" style={{ color: "var(--admin-text-muted)" }}>
          Abhi koi comment nahi — pehla comment likhein.
        </p>
      ) : (
        <ul className="mb-4 space-y-3">
          {comments.map((c) => {
            const isOwn = c.authorId === currentUserId;
            const canDelete = isOwn || canManage;
            return (
              <li
                key={c.id}
                className="rounded-lg p-3"
                style={{
                  background:
                    "color-mix(in srgb, var(--admin-border) 25%, transparent)",
                }}
              >
                <div className="mb-1 flex items-center justify-between gap-2">
                  <span
                    className="text-xs font-semibold"
                    style={{ color: "var(--admin-text-heading)" }}
                  >
                    {c.authorName}
                  </span>
                  <div className="flex items-center gap-2">
                    <span
                      className="text-[10px]"
                      style={{ color: "var(--admin-text-subtle)" }}
                    >
                      {formatMessageTime(c.createdAt)}
                    </span>
                    {canDelete && (
                      <button
                        type="button"
                        onClick={() => void handleDelete(c.id)}
                        className="rounded p-0.5 opacity-60 hover:opacity-100"
                        aria-label="Delete comment"
                      >
                        <Trash2 size={12} />
                      </button>
                    )}
                  </div>
                </div>
                <p
                  className="whitespace-pre-wrap text-sm leading-relaxed"
                  style={{ color: "var(--admin-text-body, #1F2937)" }}
                >
                  {c.body}
                </p>
              </li>
            );
          })}
        </ul>
      )}

      <form onSubmit={(e) => void handleSubmit(e)} className="space-y-2">
        <textarea
          value={body}
          onChange={(e) => setBody(e.target.value)}
          placeholder="Comment likhein…"
          rows={3}
          maxLength={2000}
          className="w-full resize-none rounded-lg px-3 py-2.5 text-sm"
          style={{
            border: "1px solid var(--admin-border)",
            background: "var(--admin-bg)",
          }}
        />
        {error && (
          <p className="text-xs" style={{ color: "var(--admin-error)" }}>
            {error}
          </p>
        )}
        <button
          type="submit"
          disabled={sending || !body.trim()}
          className="inline-flex items-center gap-1.5 rounded-lg px-4 py-2 text-sm font-semibold text-white disabled:opacity-50"
          style={{ background: "var(--admin-primary)" }}
        >
          <Send size={14} />
          {sending ? "Posting…" : "Comment bhejein"}
        </button>
      </form>
    </section>
  );
}
