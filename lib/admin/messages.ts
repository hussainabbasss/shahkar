import type { AdminUser } from "@/lib/admin/auth";
import { isSuperAdmin } from "@/lib/admin/permissions";

const PKT = "Asia/Karachi";

export type ConversationType = "dm" | "group";

export type ProductEntitySnapshot = {
  id: string;
  name: string;
  slug: string;
  image: string;
  displayPrice: number;
  originalPrice: number;
  stock: number;
  active: boolean;
};

export type OrderEntitySnapshot = {
  id: string;
  orderNumber: string;
  customerName: string;
  customerPhone: string;
  total: number;
  status: string;
  source: string;
  lineItemCount: number;
};

export function canonicalDmPair(
  userA: string,
  userB: string,
): { low: string; high: string } {
  return userA < userB
    ? { low: userA, high: userB }
    : { low: userB, high: userA };
}

export function isAuditView(
  user: AdminUser,
  isMember: boolean,
): boolean {
  return isSuperAdmin(user) && !isMember;
}

export function canSendInConversation(
  user: AdminUser,
  isMember: boolean,
): boolean {
  if (!isMember && isSuperAdmin(user)) return false;
  return isMember;
}

export function shouldSendEmailAlert(
  lastReadAt: string | null,
  lastNotifiedAt: string | null,
): boolean {
  if (!lastNotifiedAt) return true;
  if (!lastReadAt) return true;
  return new Date(lastReadAt) > new Date(lastNotifiedAt);
}

export function formatMessageTime(
  iso: string,
  now: Date = new Date(),
): string {
  const date = new Date(iso);
  const nowPkt = new Date(
    now.toLocaleString("en-US", { timeZone: PKT }),
  );
  const datePkt = new Date(
    date.toLocaleString("en-US", { timeZone: PKT }),
  );

  const startOfDay = (d: Date) =>
    new Date(d.getFullYear(), d.getMonth(), d.getDate());

  const today = startOfDay(nowPkt);
  const msgDay = startOfDay(datePkt);
  const diffDays = Math.round(
    (today.getTime() - msgDay.getTime()) / (24 * 60 * 60 * 1000),
  );

  const timeStr = date.toLocaleString("en-PK", {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
    timeZone: PKT,
  });

  if (diffDays === 0) return timeStr;
  if (diffDays === 1) return `Yesterday, ${timeStr}`;

  if (datePkt.getFullYear() === nowPkt.getFullYear()) {
    const datePart = date.toLocaleString("en-PK", {
      month: "short",
      day: "numeric",
      timeZone: PKT,
    });
    return `${datePart}, ${timeStr}`;
  }

  const datePart = date.toLocaleString("en-PK", {
    month: "short",
    day: "numeric",
    year: "numeric",
    timeZone: PKT,
  });
  return `${datePart}, ${timeStr}`;
}

export function formatMessageTimeFull(iso: string): string {
  const date = new Date(iso);
  return (
    date.toLocaleString("en-PK", {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "numeric",
      minute: "2-digit",
      second: "2-digit",
      hour12: true,
      timeZone: PKT,
    }) + " PKT"
  );
}

export function buildMessagePreview(opts: {
  body: string | null;
  senderName?: string;
  hasAttachments?: boolean;
  firstEntity?: { type: "product" | "order"; label: string };
  isGroup?: boolean;
}): string {
  let preview: string;
  if (opts.body?.trim()) {
    preview = opts.body.trim().slice(0, 120);
  } else if (opts.firstEntity) {
    preview =
      opts.firstEntity.type === "product"
        ? `📦 Product: ${opts.firstEntity.label}`
        : `🧾 Order: ${opts.firstEntity.label}`;
  } else {
    preview = "📎 Attachment";
  }

  if (opts.isGroup && opts.senderName) {
    preview = `${opts.senderName}: ${preview}`;
  }
  return preview;
}

export function stockBadgeLabel(stock: number): string {
  if (stock <= 0) return "Out of stock";
  if (stock <= 10) return "Low stock";
  return "In stock";
}

export const IMAGE_MIME_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
];
export const FILE_MIME_TYPES = [
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/vnd.ms-excel",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
];
export const MAX_IMAGE_BYTES = 5 * 1024 * 1024;
export const MAX_FILE_BYTES = 10 * 1024 * 1024;
export const MAX_ATTACHMENTS = 5;
export const MAX_ENTITIES_PER_TYPE = 3;
export const MAX_BODY_LENGTH = 4000;
