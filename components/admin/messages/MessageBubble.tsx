"use client";

import { useState } from "react";
import Image from "next/image";
import { Pencil } from "lucide-react";
import {
  formatMessageTime,
  formatMessageTimeFull,
  IMAGE_MIME_TYPES,
} from "@/lib/admin/messages";
import type { AdminMessage } from "@/lib/db/admin/messages";
import { editMessageAction } from "@/app/actions/admin/messages";
import { SharedProductCard } from "@/components/admin/messages/SharedProductCard";
import { SharedOrderCard } from "@/components/admin/messages/SharedOrderCard";
import type { ProductEntitySnapshot, OrderEntitySnapshot } from "@/lib/admin/messages";

type MessageBubbleProps = {
  message: AdminMessage;
  isOwn: boolean;
  isGroup: boolean;
  readOnly: boolean;
  canManageProducts: boolean;
  canViewOrders: boolean;
  onProductClick: (snapshot: ProductEntitySnapshot) => void;
  onOrderClick: (snapshot: OrderEntitySnapshot) => void;
  onEdited: () => void;
};

export function MessageBubble({
  message,
  isOwn,
  isGroup,
  readOnly,
  canManageProducts,
  canViewOrders,
  onProductClick,
  onOrderClick,
  onEdited,
}: MessageBubbleProps) {
  const [editing, setEditing] = useState(false);
  const [editBody, setEditBody] = useState(message.body ?? "");
  const [saving, setSaving] = useState(false);
  const [lightbox, setLightbox] = useState<string | null>(null);

  const timeLabel = formatMessageTime(message.createdAt);
  const edited = message.editedAt ? " · edited" : "";

  async function handleSave() {
    setSaving(true);
    const result = await editMessageAction({
      messageId: message.id,
      body: editBody,
    });
    setSaving(false);
    if (result.success) {
      setEditing(false);
      onEdited();
    }
  }

  return (
    <>
      <div
        className={`group flex flex-col ${isOwn ? "items-end" : "items-start"}`}
      >
        {isGroup && !isOwn && (
          <p
            className="mb-1 px-1 text-xs font-semibold"
            style={{ color: "var(--admin-text-muted)" }}
          >
            {message.senderName}
          </p>
        )}

        <div className="relative max-w-[85%] sm:max-w-[70%]">
          {isOwn && !readOnly && !editing && (
            <div className="absolute -left-8 top-1 opacity-0 transition-opacity group-hover:opacity-100">
              <button
                type="button"
                onClick={() => {
                  setEditBody(message.body ?? "");
                  setEditing(true);
                }}
                className="rounded p-1"
                aria-label="Edit message"
              >
                <Pencil size={14} />
              </button>
            </div>
          )}

          <div
            className="rounded-2xl px-4 py-2.5"
            style={{
              background: isOwn
                ? "color-mix(in srgb, var(--admin-primary) 12%, var(--admin-surface))"
                : "var(--admin-surface)",
              border: "1px solid var(--admin-border)",
            }}
          >
            {editing ? (
              <div className="space-y-2">
                <textarea
                  value={editBody}
                  onChange={(e) => setEditBody(e.target.value)}
                  rows={3}
                  className="w-full resize-none rounded-lg p-2 text-sm"
                  style={{
                    border: "1px solid var(--admin-border)",
                    background: "var(--admin-bg)",
                  }}
                />
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={handleSave}
                    disabled={saving}
                    className="rounded-lg px-3 py-1 text-xs font-semibold text-white"
                    style={{ background: "var(--admin-primary)" }}
                  >
                    Save
                  </button>
                  <button
                    type="button"
                    onClick={() => setEditing(false)}
                    className="rounded-lg px-3 py-1 text-xs"
                    style={{ color: "var(--admin-text-muted)" }}
                  >
                    Cancel
                  </button>
                </div>
              </div>
            ) : (
              <>
                {message.body && (
                  <p
                    className="whitespace-pre-wrap break-words text-sm"
                    style={{ color: "var(--admin-text-heading)" }}
                  >
                    {message.body}
                  </p>
                )}

                {message.attachments.map((att) =>
                  IMAGE_MIME_TYPES.includes(att.mimeType) ? (
                    <button
                      key={att.id}
                      type="button"
                      onClick={() => att.url && setLightbox(att.url)}
                      className="mt-2 block overflow-hidden rounded-lg"
                    >
                      {att.url && (
                        <Image
                          src={att.url}
                          alt={att.fileName}
                          width={240}
                          height={180}
                          className="max-h-48 object-cover"
                        />
                      )}
                    </button>
                  ) : (
                    <a
                      key={att.id}
                      href={att.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="mt-2 flex items-center gap-2 rounded-lg p-2 text-sm"
                      style={{
                        background: "color-mix(in srgb, var(--admin-border) 40%, transparent)",
                      }}
                    >
                      📎 {att.fileName} (
                      {(att.sizeBytes / 1024).toFixed(0)} KB)
                    </a>
                  ),
                )}

                {message.entities.map((ent) =>
                  ent.entityType === "product" ? (
                    <SharedProductCard
                      key={ent.id}
                      snapshot={ent.snapshot as ProductEntitySnapshot}
                      onClick={() =>
                        onProductClick(ent.snapshot as ProductEntitySnapshot)
                      }
                    />
                  ) : (
                    <SharedOrderCard
                      key={ent.id}
                      snapshot={ent.snapshot as OrderEntitySnapshot}
                      onClick={() =>
                        onOrderClick(ent.snapshot as OrderEntitySnapshot)
                      }
                    />
                  ),
                )}
              </>
            )}
          </div>

          <p
            className={`mt-1 px-1 text-[10px] ${isOwn ? "text-right" : "text-left"}`}
            style={{ color: "var(--admin-text-subtle)" }}
            title={formatMessageTimeFull(message.createdAt)}
          >
            {timeLabel}
            {edited}
          </p>
        </div>
      </div>

      {lightbox && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4"
          onClick={() => setLightbox(null)}
        >
          <Image
            src={lightbox}
            alt="Attachment"
            width={800}
            height={600}
            className="max-h-[90vh] max-w-full object-contain"
          />
        </div>
      )}
    </>
  );
}
