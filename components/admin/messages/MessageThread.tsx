"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { ArrowLeft } from "lucide-react";
import { fetchMessagesAction } from "@/app/actions/admin/messages";
import { CallButton } from "@/components/admin/messages/CallButton";
import { MessageBubble } from "@/components/admin/messages/MessageBubble";
import { MessageComposer } from "@/components/admin/messages/MessageComposer";
import { GroupHeader } from "@/components/admin/messages/GroupHeader";
import { SharedProductDetailDialog } from "@/components/admin/messages/SharedProductDetailDialog";
import { SharedOrderDetailDialog } from "@/components/admin/messages/SharedOrderDetailDialog";
import { useMessagesRealtime } from "@/components/admin/messages/useMessagesRealtime";
import type {
  AdminMessage,
  ConversationListItem,
  ConversationMember,
  StaffMember,
} from "@/lib/db/admin/messages";
import type { OrderEntitySnapshot, ProductEntitySnapshot } from "@/lib/admin/messages";

type MessageThreadProps = {
  conversation: ConversationListItem;
  currentUserId: string;
  members: ConversationMember[];
  staff: StaffMember[];
  createdById?: string | null;
  canShareProducts: boolean;
  canShareOrders: boolean;
  canManageProducts: boolean;
  onBack?: () => void;
  showBack?: boolean;
};

export function MessageThread({
  conversation,
  currentUserId,
  members,
  staff,
  createdById,
  canShareProducts,
  canShareOrders,
  canManageProducts,
  onBack,
  showBack,
}: MessageThreadProps) {
  const [messages, setMessages] = useState<AdminMessage[]>([]);
  const [isMember, setIsMember] = useState(true);
  const [isAudit, setIsAudit] = useState(false);
  const [loading, setLoading] = useState(true);
  const [productDialog, setProductDialog] =
    useState<ProductEntitySnapshot | null>(null);
  const [orderDialog, setOrderDialog] =
    useState<OrderEntitySnapshot | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const realtimeDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(
    null,
  );

  const loadMessages = useCallback(
    async (showLoading = false) => {
      if (showLoading) setLoading(true);
      const result = await fetchMessagesAction(conversation.id);
      setMessages(result.messages);
      setIsMember(result.isMember);
      setIsAudit(result.isAudit);
      setLoading(false);
    },
    [conversation.id],
  );

  useEffect(() => {
    void loadMessages(true);
  }, [loadMessages]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const scheduleRealtimeRefresh = useCallback(() => {
    if (realtimeDebounceRef.current) {
      clearTimeout(realtimeDebounceRef.current);
    }
    realtimeDebounceRef.current = setTimeout(() => {
      void loadMessages(false);
    }, 400);
  }, [loadMessages]);

  useEffect(() => {
    return () => {
      if (realtimeDebounceRef.current) {
        clearTimeout(realtimeDebounceRef.current);
      }
    };
  }, []);

  useMessagesRealtime(
    conversation.id,
    scheduleRealtimeRefresh,
    scheduleRealtimeRefresh,
  );

  const handleSent = useCallback((message?: AdminMessage) => {
    if (message) {
      setMessages((prev) => {
        if (prev.some((m) => m.id === message.id)) return prev;
        return [...prev, message];
      });
      return;
    }
    void loadMessages(false);
  }, [loadMessages]);

  const isGroup = conversation.type === "group";
  const isCreator = createdById === currentUserId;

  return (
    <div className="flex h-full flex-col">
      {isGroup ? (
        <div className="flex items-center gap-2">
          {showBack && onBack && (
            <button
              type="button"
              onClick={onBack}
              className="ml-2 shrink-0 md:hidden"
            >
              <ArrowLeft size={20} />
            </button>
          )}
          <div className="min-w-0 flex-1">
            <GroupHeader
              conversationId={conversation.id}
              name={conversation.name ?? conversation.label}
              members={members}
              isCreator={isCreator}
              availableStaff={staff}
              showCallButton={isMember && !isAudit}
              onMembersAdded={() => void loadMessages(false)}
            />
          </div>
        </div>
      ) : (
        <div
          className="flex items-center gap-2 border-b px-4 py-3"
          style={{ borderColor: "var(--admin-border)" }}
        >
          {showBack && onBack && (
            <button type="button" onClick={onBack} className="md:hidden">
              <ArrowLeft size={20} />
            </button>
          )}
          <h2
            className="min-w-0 flex-1 truncate font-bold"
            style={{ color: "var(--admin-text-heading)" }}
          >
            {conversation.label}
          </h2>
          {isMember && !isAudit && (
            <CallButton conversationId={conversation.id} />
          )}
        </div>
      )}

      {isAudit && (
        <div
          className="px-4 py-2 text-sm"
          style={{
            background: "color-mix(in srgb, var(--admin-accent) 12%, transparent)",
            color: "var(--admin-accent)",
          }}
        >
          Audit view — read only. You cannot send messages in this
          conversation.
        </div>
      )}

      <div className="flex-1 overflow-y-auto p-4">
        {loading ? (
          <p
            className="text-center text-sm"
            style={{ color: "var(--admin-text-muted)" }}
          >
            Loading…
          </p>
        ) : messages.length === 0 ? (
          <p
            className="text-center text-sm"
            style={{ color: "var(--admin-text-muted)" }}
          >
            Send the first message
          </p>
        ) : (
          <div className="space-y-4">
            {messages.map((msg) => (
              <MessageBubble
                key={msg.id}
                message={msg}
                isOwn={msg.senderId === currentUserId}
                isGroup={isGroup}
                readOnly={isAudit}
                canManageProducts={canManageProducts}
                canViewOrders={canShareOrders}
                onProductClick={setProductDialog}
                onOrderClick={setOrderDialog}
                onEdited={() => void loadMessages(false)}
              />
            ))}
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {isMember && !isAudit && (
        <MessageComposer
          conversationId={conversation.id}
          canShareProducts={canShareProducts}
          canShareOrders={canShareOrders}
          onSent={handleSent}
        />
      )}

      {productDialog && (
        <SharedProductDetailDialog
          snapshot={productDialog}
          canManageProducts={canManageProducts}
          onClose={() => setProductDialog(null)}
        />
      )}
      {orderDialog && (
        <SharedOrderDetailDialog
          snapshot={orderDialog}
          canViewOrders={canShareOrders}
          onClose={() => setOrderDialog(null)}
        />
      )}
    </div>
  );
}
