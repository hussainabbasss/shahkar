"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/admin/auth";
import {
  FILE_MIME_TYPES,
  IMAGE_MIME_TYPES,
  MAX_ATTACHMENTS,
  MAX_BODY_LENGTH,
  MAX_ENTITIES_PER_TYPE,
  MAX_FILE_BYTES,
  MAX_IMAGE_BYTES,
  shouldSendEmailAlert,
  type OrderEntitySnapshot,
  type ProductEntitySnapshot,
} from "@/lib/admin/messages";
import {
  getAnalyticsScope,
  hasPermission,
  isSuperAdmin,
} from "@/lib/admin/permissions";
import {
  addGroupMembers,
  buildOrderSnapshot,
  buildProductSnapshot,
  createGroup,
  getConversationById,
  getConversationMembers,
  getConversationRecipients,
  getMessageById,
  getMessages,
  getOrCreateDm,
  getReadState,
  getSharedOrderDetail,
  getSharedProductDetail,
  getUnreadSummary,
  insertMessage,
  isMember,
  listActiveStaff,
  listAuditConversations,
  listMyConversations,
  markConversationRead,
  orderSharedInUserConversation,
  searchOrdersForShare,
  searchProductsForShare,
  updateLastNotifiedAt,
  updateMessageBody,
  uploadMessageAttachment,
  type AdminMessage,
  type ConversationListItem,
  type ConversationMember,
  type StaffMember,
  type UnreadSummaryItem,
} from "@/lib/db/admin/messages";
import { getOrderByNumberAdmin } from "@/lib/db/admin/orders";
import { getProductByIdAdmin } from "@/lib/db/admin/products";
import { sendMessageAlertEmail } from "@/lib/email/send-message-alert";
import type { Order, Product } from "@/lib/types";
import type { TicketEntitySnapshot } from "@/lib/admin/tickets";
import {
  buildTicketSnapshot,
  canUserShareTicket,
  getSharedTicketDetail,
} from "@/lib/db/admin/tickets";

export type ActionResult<T = void> =
  | { success: true; data?: T }
  | { success: false; error: string };

async function requireMessageMember(conversationId: string) {
  const user = await requireAdmin();
  const member = await isMember(conversationId, user.id);
  if (!member) {
    if (isSuperAdmin(user)) {
      throw new Error("Audit view — read only.");
    }
    throw new Error("Not a member of this conversation.");
  }
  return user;
}

export async function fetchMyConversationsAction(): Promise<
  ConversationListItem[]
> {
  const user = await requireAdmin();
  return listMyConversations(user.id);
}

export async function fetchAuditConversationsAction(): Promise<
  ConversationListItem[]
> {
  const user = await requireAdmin();
  if (!isSuperAdmin(user)) return [];
  return listAuditConversations(user.id);
}

export async function fetchActiveStaffAction(): Promise<StaffMember[]> {
  const user = await requireAdmin();
  return listActiveStaff(user.id);
}

export async function openDmAction(
  otherUserId: string,
): Promise<ActionResult<{ conversationId: string }>> {
  try {
    const user = await requireAdmin();
    if (otherUserId === user.id) {
      return { success: false, error: "Cannot DM yourself." };
    }
    const conversationId = await getOrCreateDm(user.id, otherUserId);
    return { success: true, data: { conversationId } };
  } catch (e) {
    return { success: false, error: (e as Error).message };
  }
}

export async function createGroupAction(input: {
  name: string;
  memberIds: string[];
}): Promise<ActionResult<{ conversationId: string }>> {
  try {
    const user = await requireAdmin();
    if (!hasPermission(user, "create_message_groups")) {
      return { success: false, error: "Permission denied." };
    }

    const name = input.name.trim();
    if (!name || name.length > 80) {
      return { success: false, error: "Group name must be 1–80 characters." };
    }

    const unique = [...new Set(input.memberIds)];
    if (unique.length < 2) {
      return {
        success: false,
        error: "Select at least 2 other staff members.",
      };
    }

    const staff = await listActiveStaff();
    const activeIds = new Set(staff.map((s) => s.id));
    for (const id of unique) {
      if (!activeIds.has(id)) {
        return { success: false, error: "Invalid staff member selected." };
      }
    }

    const conversationId = await createGroup({
      name,
      memberIds: unique,
      createdBy: user.id,
    });

    revalidatePath("/admin/messages");
    return { success: true, data: { conversationId } };
  } catch (e) {
    return { success: false, error: (e as Error).message };
  }
}

export async function addGroupMembersAction(
  conversationId: string,
  userIds: string[],
): Promise<ActionResult> {
  try {
    const user = await requireMessageMember(conversationId);
    await addGroupMembers(conversationId, userIds, user.id);
    revalidatePath("/admin/messages");
    return { success: true };
  } catch (e) {
    return { success: false, error: (e as Error).message };
  }
}

export async function fetchConversationMembersAction(
  conversationId: string,
): Promise<ConversationMember[]> {
  const user = await requireAdmin();
  const member = await isMember(conversationId, user.id);
  if (!member && !isSuperAdmin(user)) return [];
  return getConversationMembers(conversationId);
}

export async function fetchConversationMetaAction(
  conversationId: string,
): Promise<{ createdBy: string | null; type: "dm" | "group" } | null> {
  await requireAdmin();
  const conv = await getConversationById(conversationId);
  if (!conv) return null;
  return { createdBy: conv.created_by, type: conv.type };
}

export async function fetchMessagesAction(
  conversationId: string,
  cursor?: string,
): Promise<{
  messages: AdminMessage[];
  hasMore: boolean;
  isMember: boolean;
  isAudit: boolean;
}> {
  const user = await requireAdmin();
  const member = await isMember(conversationId, user.id);
  if (!member && !isSuperAdmin(user)) {
    throw new Error("Access denied.");
  }

  const { messages, hasMore } = await getMessages(conversationId, cursor);

  if (member) {
    await markConversationRead(conversationId, user.id);
  }

  return {
    messages,
    hasMore,
    isMember: member,
    isAudit: !member && isSuperAdmin(user),
  };
}

export async function markReadAction(
  conversationId: string,
): Promise<ActionResult> {
  try {
    await requireMessageMember(conversationId);
    const user = await requireAdmin();
    await markConversationRead(conversationId, user.id);
    revalidatePath("/admin/messages");
    revalidatePath("/admin/dashboard");
    return { success: true };
  } catch (e) {
    return { success: false, error: (e as Error).message };
  }
}

export async function sendMessageAction(input: {
  conversationId: string;
  body: string;
  productIds: string[];
  orderIds: string[];
  ticketIds: string[];
  attachments: {
    storagePath: string;
    fileName: string;
    mimeType: string;
    sizeBytes: number;
  }[];
}): Promise<ActionResult<AdminMessage>> {
  try {
    const user = await requireMessageMember(input.conversationId);

    const body = input.body.trim().slice(0, MAX_BODY_LENGTH) || null;
    const productIds = [...new Set(input.productIds)].slice(
      0,
      MAX_ENTITIES_PER_TYPE,
    );
    const orderIds = [...new Set(input.orderIds)].slice(
      0,
      MAX_ENTITIES_PER_TYPE,
    );
    const ticketIds = [...new Set(input.ticketIds)].slice(
      0,
      MAX_ENTITIES_PER_TYPE,
    );
    const attachments = input.attachments.slice(0, MAX_ATTACHMENTS);

    if (
      !body &&
      !attachments.length &&
      !productIds.length &&
      !orderIds.length &&
      !ticketIds.length
    ) {
      return { success: false, error: "Message cannot be empty." };
    }

    if (productIds.length && !hasPermission(user, "view_products")) {
      return { success: false, error: "Cannot share products." };
    }
    if (orderIds.length && !hasPermission(user, "view_orders")) {
      return { success: false, error: "Cannot share orders." };
    }
    if (ticketIds.length && !hasPermission(user, "view_tickets")) {
      return { success: false, error: "Cannot share tickets." };
    }

    const productSnapshots: ProductEntitySnapshot[] = [];
    for (const id of productIds) {
      const product = await getProductByIdAdmin(id);
      if (!product) {
        return { success: false, error: "Product not found." };
      }
      productSnapshots.push(await buildProductSnapshot(product));
    }

    const orderSnapshots: OrderEntitySnapshot[] = [];
    const scope = getAnalyticsScope(user);
    for (const id of orderIds) {
      const order = await getSharedOrderDetail(id);
      if (!order) {
        return { success: false, error: "Order not found." };
      }
      if (
        scope === "own" &&
        order.createdBy !== user.id &&
        !isSuperAdmin(user)
      ) {
        return { success: false, error: "Cannot share this order." };
      }
      orderSnapshots.push(await buildOrderSnapshot(order));
    }

    let ticketSnapshots: TicketEntitySnapshot[] = [];
    const hasManageTickets = hasPermission(user, "manage_tickets");
    for (const id of ticketIds) {
      const canShare = await canUserShareTicket(
        id,
        user.id,
        hasManageTickets,
      );
      if (!canShare) {
        return { success: false, error: "Cannot share this ticket." };
      }
      const ticket = await getSharedTicketDetail(id);
      if (!ticket) {
        return { success: false, error: "Ticket not found." };
      }
      ticketSnapshots.push(await buildTicketSnapshot(ticket));
    }

    const conv = await getConversationById(input.conversationId);
    if (!conv) return { success: false, error: "Conversation not found." };

    const message = await insertMessage({
      conversationId: input.conversationId,
      senderId: user.id,
      body,
      attachments,
      productIds,
      orderIds,
      ticketIds,
      senderName: user.name,
      isGroup: conv.type === "group",
      productSnapshots,
      orderSnapshots,
      ticketSnapshots,
    });

    void notifyMessageRecipients({
      conversationId: input.conversationId,
      senderId: user.id,
      senderName: user.name,
      conversationType: conv.type,
      groupName: conv.name,
    });

    revalidatePath("/admin/dashboard");
    return { success: true, data: message };
  } catch (e) {
    return { success: false, error: (e as Error).message };
  }
}

async function notifyMessageRecipients(opts: {
  conversationId: string;
  senderId: string;
  senderName: string;
  conversationType: "dm" | "group";
  groupName: string | null;
}) {
  try {
    const recipients = await getConversationRecipients(
      opts.conversationId,
      opts.senderId,
    );

    for (const recipient of recipients) {
      if (!recipient.active) continue;

      const { lastReadAt, lastNotifiedAt } = await getReadState(
        opts.conversationId,
        recipient.id,
      );

      if (!shouldSendEmailAlert(lastReadAt, lastNotifiedAt)) continue;

      try {
        await sendMessageAlertEmail({
          to: recipient.email,
          recipientName: recipient.name,
          senderName: opts.senderName,
          conversationType: opts.conversationType,
          groupName: opts.groupName,
          conversationId: opts.conversationId,
        });
        await updateLastNotifiedAt(opts.conversationId, recipient.id);
      } catch (err) {
        console.error("[email] message alert failed:", err);
      }
    }
  } catch (err) {
    console.error("[email] notify recipients failed:", err);
  }
}

export async function editMessageAction(input: {
  messageId: string;
  body: string;
}): Promise<ActionResult> {
  try {
    const user = await requireAdmin();
    const msg = await getMessageById(input.messageId);
    if (!msg) return { success: false, error: "Message not found." };
    if (msg.senderId !== user.id) {
      return { success: false, error: "Only the sender can edit." };
    }

    const member = await isMember(msg.conversationId, user.id);
    if (!member) {
      return { success: false, error: "Cannot edit in audit view." };
    }

    const body = input.body.trim().slice(0, MAX_BODY_LENGTH) || null;
    if (!body && msg.attachmentCount === 0 && msg.entityCount === 0) {
      return { success: false, error: "Message body cannot be empty." };
    }

    const conv = await getConversationById(msg.conversationId);
    await updateMessageBody({
      messageId: input.messageId,
      body,
      conversationId: msg.conversationId,
      isGroup: conv?.type === "group",
      senderName: user.name,
    });

    revalidatePath("/admin/messages");
    return { success: true };
  } catch (e) {
    return { success: false, error: (e as Error).message };
  }
}

export async function uploadAttachmentAction(
  conversationId: string,
  formData: FormData,
): Promise<
  ActionResult<{
    storagePath: string;
    fileName: string;
    mimeType: string;
    sizeBytes: number;
  }>
> {
  try {
    await requireMessageMember(conversationId);
    const file = formData.get("file") as File | null;
    if (!file) return { success: false, error: "No file provided." };

    const isImage = IMAGE_MIME_TYPES.includes(file.type);
    const isDoc = FILE_MIME_TYPES.includes(file.type);
    if (!isImage && !isDoc) {
      return { success: false, error: "Unsupported file type." };
    }
    if (isImage && file.size > MAX_IMAGE_BYTES) {
      return { success: false, error: "Image must be under 5 MB." };
    }
    if (!isImage && file.size > MAX_FILE_BYTES) {
      return { success: false, error: "File must be under 10 MB." };
    }

    const tempId = crypto.randomUUID();
    const result = await uploadMessageAttachment(
      conversationId,
      tempId,
      file,
    );
    return { success: true, data: result };
  } catch (e) {
    return { success: false, error: (e as Error).message };
  }
}

export async function searchProductsAction(
  query: string,
): Promise<ProductEntitySnapshot[]> {
  const user = await requireAdmin();
  if (!hasPermission(user, "view_products")) return [];
  return searchProductsForShare(query);
}

export async function searchOrdersAction(
  query: string,
): Promise<OrderEntitySnapshot[]> {
  const user = await requireAdmin();
  if (!hasPermission(user, "view_orders")) return [];
  return searchOrdersForShare(query, user);
}

export async function fetchSharedProductAction(
  productId: string,
): Promise<{ product: Product | null; snapshotOnly: boolean }> {
  const user = await requireAdmin();
  if (!hasPermission(user, "view_products")) {
    return { product: null, snapshotOnly: true };
  }
  const product = await getSharedProductDetail(productId);
  return { product, snapshotOnly: false };
}

export async function fetchSharedOrderAction(
  orderId: string,
): Promise<{ order: Order | null; snapshotOnly: boolean }> {
  const user = await requireAdmin();
  if (!hasPermission(user, "view_orders")) {
    const shared = await orderSharedInUserConversation(orderId, user.id);
    if (!shared) return { order: null, snapshotOnly: true };
    const order = await getSharedOrderDetail(orderId);
    return { order, snapshotOnly: false };
  }

  const scope = getAnalyticsScope(user);
  const order = await getSharedOrderDetail(orderId);
  if (!order) return { order: null, snapshotOnly: false };

  if (
    scope === "own" &&
    order.createdBy !== user.id &&
    !isSuperAdmin(user)
  ) {
    const shared = await orderSharedInUserConversation(orderId, user.id);
    if (!shared) return { order: null, snapshotOnly: true };
  }

  return { order, snapshotOnly: false };
}

export async function fetchUnreadSummaryAction(): Promise<{
  items: UnreadSummaryItem[];
  totalUnread: number;
}> {
  const user = await requireAdmin();
  return getUnreadSummary(user.id);
}

export async function getOrderByNumberForShareAction(
  orderNumber: string,
): Promise<Order | null> {
  const user = await requireAdmin();
  if (!hasPermission(user, "view_orders")) return null;
  return getOrderByNumberAdmin(orderNumber);
}
