"use client";

import { useState } from "react";
import { Send } from "lucide-react";
import {
  MAX_ATTACHMENTS,
  MAX_ENTITIES_PER_TYPE,
  type OrderEntitySnapshot,
  type ProductEntitySnapshot,
} from "@/lib/admin/messages";
import {
  sendMessageAction,
  uploadAttachmentAction,
} from "@/app/actions/admin/messages";
import { ComposerAttachMenu } from "@/components/admin/messages/ComposerAttachMenu";
import { ProductPickerSheet } from "@/components/admin/messages/ProductPickerSheet";
import { OrderPickerSheet } from "@/components/admin/messages/OrderPickerSheet";
import type { AdminMessage } from "@/lib/db/admin/messages";

type PendingAttachment = {
  storagePath: string;
  fileName: string;
  mimeType: string;
  sizeBytes: number;
};

type MessageComposerProps = {
  conversationId: string;
  canShareProducts: boolean;
  canShareOrders: boolean;
  onSent: (message?: AdminMessage) => void;
};

export function MessageComposer({
  conversationId,
  canShareProducts,
  canShareOrders,
  onSent,
}: MessageComposerProps) {
  const [body, setBody] = useState("");
  const [attachments, setAttachments] = useState<PendingAttachment[]>([]);
  const [products, setProducts] = useState<ProductEntitySnapshot[]>([]);
  const [orders, setOrders] = useState<OrderEntitySnapshot[]>([]);
  const [uploading, setUploading] = useState(false);
  const [sending, setSending] = useState(false);
  const [productPickerOpen, setProductPickerOpen] = useState(false);
  const [orderPickerOpen, setOrderPickerOpen] = useState(false);

  const canSend =
    !uploading &&
    !sending &&
    (body.trim() ||
      attachments.length > 0 ||
      products.length > 0 ||
      orders.length > 0);

  async function handleAttachFile(file: File) {
    if (attachments.length >= MAX_ATTACHMENTS) return;
    setUploading(true);
    const formData = new FormData();
    formData.set("file", file);
    const result = await uploadAttachmentAction(conversationId, formData);
    setUploading(false);
    if (result.success && result.data) {
      setAttachments((prev) => [...prev, result.data!]);
    }
  }

  async function handleSend() {
    if (!canSend) return;
    setSending(true);
    const result = await sendMessageAction({
      conversationId,
      body,
      productIds: products.map((p) => p.id),
      orderIds: orders.map((o) => o.id),
      attachments,
    });
    setSending(false);
    if (result.success) {
      setBody("");
      setAttachments([]);
      setProducts([]);
      setOrders([]);
      onSent(result.data);
    }
  }

  return (
    <div
      className="border-t p-3"
      style={{
        borderColor: "var(--admin-border)",
        background: "var(--admin-surface)",
      }}
    >
      {(attachments.length > 0 || products.length > 0 || orders.length > 0) && (
        <div className="mb-2 flex flex-wrap gap-2">
          {attachments.map((a, i) => (
            <span
              key={a.storagePath}
              className="inline-flex items-center gap-1 rounded-full px-2 py-1 text-xs"
              style={{
                background: "color-mix(in srgb, var(--admin-primary) 10%, transparent)",
              }}
            >
              📎 {a.fileName}
              <button
                type="button"
                onClick={() =>
                  setAttachments((prev) => prev.filter((_, j) => j !== i))
                }
                className="ml-1"
              >
                ×
              </button>
            </span>
          ))}
          {products.map((p, i) => (
            <span
              key={p.id}
              className="inline-flex items-center gap-1 rounded-full px-2 py-1 text-xs"
              style={{
                background: "color-mix(in srgb, var(--admin-primary) 10%, transparent)",
              }}
            >
              📦 {p.name}
              <button
                type="button"
                onClick={() =>
                  setProducts((prev) => prev.filter((_, j) => j !== i))
                }
              >
                ×
              </button>
            </span>
          ))}
          {orders.map((o, i) => (
            <span
              key={o.id}
              className="inline-flex items-center gap-1 rounded-full px-2 py-1 text-xs"
              style={{
                background: "color-mix(in srgb, var(--admin-primary) 10%, transparent)",
              }}
            >
              🧾 {o.orderNumber}
              <button
                type="button"
                onClick={() =>
                  setOrders((prev) => prev.filter((_, j) => j !== i))
                }
              >
                ×
              </button>
            </span>
          ))}
        </div>
      )}

      <div className="flex items-end gap-2">
        <ComposerAttachMenu
          canShareProducts={canShareProducts}
          canShareOrders={canShareOrders}
          onAttachFile={handleAttachFile}
          onShareProduct={() => setProductPickerOpen(true)}
          onShareOrder={() => setOrderPickerOpen(true)}
          disabled={uploading || sending}
        />
        <textarea
          value={body}
          onChange={(e) => setBody(e.target.value)}
          placeholder="Write a message…"
          rows={1}
          className="max-h-32 min-h-[40px] flex-1 resize-none rounded-lg px-3 py-2.5 text-sm"
          style={{
            border: "1px solid var(--admin-border)",
            background: "var(--admin-bg)",
          }}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              void handleSend();
            }
          }}
        />
        <button
          type="button"
          onClick={() => void handleSend()}
          disabled={!canSend}
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg text-white disabled:opacity-40"
          style={{ background: "var(--admin-primary)" }}
          aria-label="Send"
        >
          <Send size={18} />
        </button>
      </div>

      {uploading && (
        <p className="mt-1 text-xs" style={{ color: "var(--admin-text-muted)" }}>
          Uploading…
        </p>
      )}

      <ProductPickerSheet
        open={productPickerOpen}
        onClose={() => setProductPickerOpen(false)}
        onSelect={(p) => setProducts((prev) => [...prev, p])}
        selectedIds={products.map((p) => p.id)}
        maxCount={MAX_ENTITIES_PER_TYPE}
      />
      <OrderPickerSheet
        open={orderPickerOpen}
        onClose={() => setOrderPickerOpen(false)}
        onSelect={(o) => setOrders((prev) => [...prev, o])}
        selectedIds={orders.map((o) => o.id)}
        maxCount={MAX_ENTITIES_PER_TYPE}
      />
    </div>
  );
}
