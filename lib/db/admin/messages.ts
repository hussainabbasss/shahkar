import type { AdminUser } from "@/lib/admin/auth";
import {
  buildMessagePreview,
  canonicalDmPair,
  type OrderEntitySnapshot,
  type ProductEntitySnapshot,
} from "@/lib/admin/messages";
import { getAnalyticsScope, hasPermission } from "@/lib/admin/permissions";
import { mapOrder, mapProduct, type DbOrder, type DbProduct } from "@/lib/db/mappers";
import { getActiveSale } from "@/lib/db/sales";
import { computeDisplayPrice } from "@/lib/pricing";
import { createAdminClient } from "@/lib/supabase/admin";
import type { Order, Product } from "@/lib/types";

function requireAdmin() {
  const supabase = createAdminClient();
  if (!supabase) throw new Error("Supabase not configured");
  return supabase;
}

export type StaffMember = {
  id: string;
  name: string;
  email: string;
};

export type ConversationListItem = {
  id: string;
  type: "dm" | "group";
  name: string | null;
  label: string;
  preview: string | null;
  lastMessageAt: string | null;
  unreadCount: number;
  memberCount?: number;
  otherUserId?: string;
};

export type ConversationMember = {
  id: string;
  name: string;
  email: string;
};

export type MessageAttachment = {
  id: string;
  storagePath: string;
  fileName: string;
  mimeType: string;
  sizeBytes: number;
  url?: string;
};

export type MessageEntity = {
  id: string;
  entityType: "product" | "order";
  entityId: string;
  snapshot: ProductEntitySnapshot | OrderEntitySnapshot;
  sortOrder: number;
};

export type AdminMessage = {
  id: string;
  conversationId: string;
  senderId: string;
  senderName: string;
  body: string | null;
  createdAt: string;
  editedAt: string | null;
  attachments: MessageAttachment[];
  entities: MessageEntity[];
};

export type UnreadSummaryItem = {
  conversationId: string;
  label: string;
  preview: string;
  lastMessageAt: string;
  type: "dm" | "group";
};

type DbConversation = {
  id: string;
  type: "dm" | "group";
  name: string | null;
  created_by: string | null;
  participant_low: string | null;
  participant_high: string | null;
  last_message_at: string | null;
  last_message_preview: string | null;
  created_at: string;
};

type DbMessage = {
  id: string;
  conversation_id: string;
  sender_id: string;
  body: string | null;
  created_at: string;
  edited_at: string | null;
  sender?: { name: string } | { name: string }[] | null;
};

export async function isMember(
  conversationId: string,
  userId: string,
): Promise<boolean> {
  const supabase = requireAdmin();
  const { data } = await supabase
    .from("admin_conversation_members")
    .select("user_id")
    .eq("conversation_id", conversationId)
    .eq("user_id", userId)
    .maybeSingle();
  return !!data;
}

export async function listActiveStaff(
  excludeUserId?: string,
): Promise<StaffMember[]> {
  const supabase = requireAdmin();
  let query = supabase
    .from("admin_profiles")
    .select("id, name, email")
    .eq("active", true)
    .order("name");

  if (excludeUserId) {
    query = query.neq("id", excludeUserId);
  }

  const { data, error } = await query;
  if (error) throw new Error(error.message);
  return (data ?? []).map((r) => ({
    id: r.id,
    name: r.name ?? "Staff",
    email: r.email,
  }));
}

async function getProfileMap(
  ids: string[],
): Promise<Map<string, { name: string; email: string }>> {
  if (!ids.length) return new Map();
  const supabase = requireAdmin();
  const { data } = await supabase
    .from("admin_profiles")
    .select("id, name, email")
    .in("id", ids);
  const map = new Map<string, { name: string; email: string }>();
  for (const row of data ?? []) {
    map.set(row.id, { name: row.name ?? "Staff", email: row.email });
  }
  return map;
}

async function buildConversationLabel(
  conv: DbConversation,
  userId: string,
  memberCount?: number,
): Promise<{ label: string; otherUserId?: string }> {
  if (conv.type === "group") {
    return {
      label: conv.name ?? "Group",
      otherUserId: undefined,
    };
  }

  const otherId =
    conv.participant_low === userId
      ? conv.participant_high
      : conv.participant_low;
  if (!otherId) return { label: "Direct message" };

  const profiles = await getProfileMap([otherId]);
  const other = profiles.get(otherId);
  return {
    label: other?.name ?? "Staff",
    otherUserId: otherId,
  };
}

async function getUnreadCount(
  conversationId: string,
  userId: string,
  lastReadAt: string | null,
): Promise<number> {
  const supabase = requireAdmin();
  let query = supabase
    .from("admin_messages")
    .select("id", { count: "exact", head: true })
    .eq("conversation_id", conversationId)
    .neq("sender_id", userId);

  if (lastReadAt) {
    query = query.gt("created_at", lastReadAt);
  }

  const { count, error } = await query;
  if (error) throw new Error(error.message);
  return count ?? 0;
}

function mapConversationRowToListItem(
  conv: DbConversation,
  userId: string,
  profileMap: Map<string, { name: string; email: string }>,
  memberCounts: Map<string, number>,
  unreadMap: Map<string, number>,
): ConversationListItem {
  let label: string;
  let otherUserId: string | undefined;

  if (conv.type === "group") {
    label = conv.name ?? "Group";
  } else {
    const otherId =
      conv.participant_low === userId
        ? conv.participant_high
        : conv.participant_low;
    otherUserId = otherId ?? undefined;
    label = otherId
      ? (profileMap.get(otherId)?.name ?? "Staff")
      : "Direct message";
  }

  return {
    id: conv.id,
    type: conv.type,
    name: conv.name,
    label,
    preview: conv.last_message_preview,
    lastMessageAt: conv.last_message_at,
    unreadCount: unreadMap.get(conv.id) ?? 0,
    memberCount: memberCounts.get(conv.id),
    otherUserId,
  };
}

export async function getConversationListItem(
  conversationId: string,
  userId: string,
): Promise<ConversationListItem | null> {
  const conv = await getConversationById(conversationId);
  if (!conv) return null;

  const supabase = requireAdmin();

  const { data: read } = await supabase
    .from("admin_conversation_reads")
    .select("last_read_at")
    .eq("conversation_id", conversationId)
    .eq("user_id", userId)
    .maybeSingle();

  const lastRead = (read?.last_read_at as string | undefined) ?? null;
  const unread = await getUnreadCount(conversationId, userId, lastRead);

  const memberCounts = new Map<string, number>();
  if (conv.type === "group") {
    const { count } = await supabase
      .from("admin_conversation_members")
      .select("user_id", { count: "exact", head: true })
      .eq("conversation_id", conv.id);
    memberCounts.set(conv.id, count ?? 0);
  }

  const profileMap = new Map<string, { name: string; email: string }>();
  if (conv.type === "dm") {
    const otherId =
      conv.participant_low === userId
        ? conv.participant_high
        : conv.participant_low;
    if (otherId) {
      const profiles = await getProfileMap([otherId]);
      for (const [id, profile] of profiles) {
        profileMap.set(id, profile);
      }
    }
  }

  const unreadMap = new Map([[conv.id, unread]]);

  return mapConversationRowToListItem(
    conv,
    userId,
    profileMap,
    memberCounts,
    unreadMap,
  );
}

export async function listMyConversations(
  userId: string,
): Promise<ConversationListItem[]> {
  const supabase = requireAdmin();

  const { data: memberships, error: memError } = await supabase
    .from("admin_conversation_members")
    .select("conversation_id")
    .eq("user_id", userId);

  if (memError) throw new Error(memError.message);
  const convIds = (memberships ?? []).map((m) => m.conversation_id);
  if (!convIds.length) return [];

  const { data: conversations, error } = await supabase
    .from("admin_conversations")
    .select("*")
    .in("id", convIds)
    .order("last_message_at", { ascending: false, nullsFirst: false });

  if (error) throw new Error(error.message);

  const convs = (conversations ?? []) as DbConversation[];
  if (!convs.length) return [];

  const { data: reads } = await supabase
    .from("admin_conversation_reads")
    .select("conversation_id, last_read_at")
    .eq("user_id", userId)
    .in("conversation_id", convIds);

  const readMap = new Map(
    (reads ?? []).map((r) => [r.conversation_id, r.last_read_at as string]),
  );

  const dmOtherIds = new Set<string>();
  for (const conv of convs) {
    if (conv.type !== "dm") continue;
    const otherId =
      conv.participant_low === userId
        ? conv.participant_high
        : conv.participant_low;
    if (otherId) dmOtherIds.add(otherId);
  }
  const profileMap = await getProfileMap([...dmOtherIds]);

  const groupIds = convs.filter((c) => c.type === "group").map((c) => c.id);
  const memberCounts = new Map<string, number>();
  if (groupIds.length) {
    const { data: memberRows } = await supabase
      .from("admin_conversation_members")
      .select("conversation_id")
      .in("conversation_id", groupIds);
    for (const row of memberRows ?? []) {
      memberCounts.set(
        row.conversation_id,
        (memberCounts.get(row.conversation_id) ?? 0) + 1,
      );
    }
  }

  const { data: unreadMessages } = await supabase
    .from("admin_messages")
    .select("conversation_id, created_at")
    .in("conversation_id", convIds)
    .neq("sender_id", userId);

  const unreadMap = new Map<string, number>();
  for (const msg of unreadMessages ?? []) {
    const lastRead = readMap.get(msg.conversation_id);
    if (lastRead && msg.created_at <= lastRead) continue;
    unreadMap.set(
      msg.conversation_id,
      (unreadMap.get(msg.conversation_id) ?? 0) + 1,
    );
  }

  return convs.map((conv) =>
    mapConversationRowToListItem(
      conv,
      userId,
      profileMap,
      memberCounts,
      unreadMap,
    ),
  );
}

export async function listAuditConversations(
  userId: string,
): Promise<ConversationListItem[]> {
  const supabase = requireAdmin();

  const { data: memberships } = await supabase
    .from("admin_conversation_members")
    .select("conversation_id")
    .eq("user_id", userId);

  const memberConvIds = new Set(
    (memberships ?? []).map((m) => m.conversation_id),
  );

  const { data: conversations, error } = await supabase
    .from("admin_conversations")
    .select("*")
    .order("last_message_at", { ascending: false, nullsFirst: false });

  if (error) throw new Error(error.message);

  const auditConvs = ((conversations ?? []) as DbConversation[]).filter(
    (c) => !memberConvIds.has(c.id) && c.last_message_at,
  );

  const items: ConversationListItem[] = [];
  for (const conv of auditConvs) {
    let label: string;
    if (conv.type === "group") {
      const { count } = await supabase
        .from("admin_conversation_members")
        .select("user_id", { count: "exact", head: true })
        .eq("conversation_id", conv.id);
      label = `${conv.name ?? "Group"} (${count ?? 0} members)`;
      items.push({
        id: conv.id,
        type: conv.type,
        name: conv.name,
        label,
        preview: conv.last_message_preview,
        lastMessageAt: conv.last_message_at,
        unreadCount: 0,
        memberCount: count ?? 0,
      });
    } else {
      const ids = [conv.participant_low, conv.participant_high].filter(
        Boolean,
      ) as string[];
      const profiles = await getProfileMap(ids);
      const names = ids.map((id) => profiles.get(id)?.name ?? "Staff");
      label = `${names[0]} ↔ ${names[1]}`;
      items.push({
        id: conv.id,
        type: conv.type,
        name: null,
        label,
        preview: conv.last_message_preview,
        lastMessageAt: conv.last_message_at,
        unreadCount: 0,
      });
    }
  }

  return items;
}

export async function getOrCreateDm(
  userA: string,
  userB: string,
): Promise<string> {
  const supabase = requireAdmin();
  const { low, high } = canonicalDmPair(userA, userB);

  const { data: existing } = await supabase
    .from("admin_conversations")
    .select("id")
    .eq("participant_low", low)
    .eq("participant_high", high)
    .maybeSingle();

  if (existing) return existing.id;

  const { data: created, error } = await supabase
    .from("admin_conversations")
    .insert({
      type: "dm",
      participant_low: low,
      participant_high: high,
      created_by: userA,
    })
    .select("id")
    .single();

  if (error) throw new Error(error.message);

  const convId = created.id;
  const { error: memError } = await supabase
    .from("admin_conversation_members")
    .upsert(
      [
        { conversation_id: convId, user_id: userA },
        { conversation_id: convId, user_id: userB },
      ],
      { onConflict: "conversation_id,user_id" },
    );

  if (memError) throw new Error(memError.message);
  return convId;
}

export async function createGroup(opts: {
  name: string;
  memberIds: string[];
  createdBy: string;
}): Promise<string> {
  const supabase = requireAdmin();
  const trimmed = opts.name.trim();
  const uniqueMembers = [...new Set(opts.memberIds.filter((id) => id !== opts.createdBy))];

  const { data: created, error } = await supabase
    .from("admin_conversations")
    .insert({
      type: "group",
      name: trimmed,
      created_by: opts.createdBy,
    })
    .select("id")
    .single();

  if (error) throw new Error(error.message);

  const convId = created.id;
  const allMembers = [opts.createdBy, ...uniqueMembers];
  const { error: memError } = await supabase
    .from("admin_conversation_members")
    .insert(
      allMembers.map((userId) => ({
        conversation_id: convId,
        user_id: userId,
      })),
    );

  if (memError) throw new Error(memError.message);
  return convId;
}

export async function addGroupMembers(
  conversationId: string,
  userIds: string[],
  requesterId: string,
): Promise<void> {
  const supabase = requireAdmin();

  const { data: conv } = await supabase
    .from("admin_conversations")
    .select("type, created_by")
    .eq("id", conversationId)
    .single();

  if (!conv || conv.type !== "group") {
    throw new Error("Not a group conversation.");
  }
  if (conv.created_by !== requesterId) {
    throw new Error("Only the group creator can add members.");
  }

  const { data: existing } = await supabase
    .from("admin_conversation_members")
    .select("user_id")
    .eq("conversation_id", conversationId);

  const existingIds = new Set((existing ?? []).map((m) => m.user_id));
  const toAdd = userIds.filter((id) => !existingIds.has(id));
  if (!toAdd.length) return;

  const { error } = await supabase.from("admin_conversation_members").insert(
    toAdd.map((userId) => ({
      conversation_id: conversationId,
      user_id: userId,
    })),
  );
  if (error) throw new Error(error.message);
}

export async function getConversationMembers(
  conversationId: string,
): Promise<ConversationMember[]> {
  const supabase = requireAdmin();
  const { data, error } = await supabase
    .from("admin_conversation_members")
    .select("user_id, profile:admin_profiles(id, name, email)")
    .eq("conversation_id", conversationId);

  if (error) throw new Error(error.message);

  return (data ?? []).map((row) => {
    const profile = Array.isArray(row.profile) ? row.profile[0] : row.profile;
    return {
      id: row.user_id,
      name: (profile as { name: string })?.name ?? "Staff",
      email: (profile as { email: string })?.email ?? "",
    };
  });
}

export async function getConversationById(
  conversationId: string,
): Promise<DbConversation | null> {
  const supabase = requireAdmin();
  const { data, error } = await supabase
    .from("admin_conversations")
    .select("*")
    .eq("id", conversationId)
    .maybeSingle();
  if (error) throw new Error(error.message);
  return data as DbConversation | null;
}

async function signAttachmentUrls(
  attachments: MessageAttachment[],
): Promise<MessageAttachment[]> {
  const supabase = requireAdmin();
  return Promise.all(
    attachments.map(async (a) => {
      const { data } = await supabase.storage
        .from("message-attachments")
        .createSignedUrl(a.storagePath, 3600);
      return { ...a, url: data?.signedUrl };
    }),
  );
}

export async function getMessages(
  conversationId: string,
  cursor?: string,
  limit = 50,
): Promise<{ messages: AdminMessage[]; hasMore: boolean }> {
  const supabase = requireAdmin();

  let query = supabase
    .from("admin_messages")
    .select(
      "*, sender:admin_profiles!admin_messages_sender_id_fkey(name)",
    )
    .eq("conversation_id", conversationId)
    .order("created_at", { ascending: false })
    .limit(limit + 1);

  if (cursor) {
    query = query.lt("created_at", cursor);
  }

  const { data, error } = await query;
  if (error) throw new Error(error.message);

  const rows = (data ?? []) as DbMessage[];
  const hasMore = rows.length > limit;
  const page = hasMore ? rows.slice(0, limit) : rows;
  const messageIds = page.map((m) => m.id);

  const { data: attachments } = await supabase
    .from("admin_message_attachments")
    .select("*")
    .in("message_id", messageIds);

  const { data: entities } = await supabase
    .from("admin_message_entities")
    .select("*")
    .in("message_id", messageIds)
    .order("sort_order");

  const attachByMsg = new Map<string, MessageAttachment[]>();
  for (const a of attachments ?? []) {
    const list = attachByMsg.get(a.message_id) ?? [];
    list.push({
      id: a.id,
      storagePath: a.storage_path,
      fileName: a.file_name,
      mimeType: a.mime_type,
      sizeBytes: a.size_bytes,
    });
    attachByMsg.set(a.message_id, list);
  }

  const entityByMsg = new Map<string, MessageEntity[]>();
  for (const e of entities ?? []) {
    const list = entityByMsg.get(e.message_id) ?? [];
    list.push({
      id: e.id,
      entityType: e.entity_type as "product" | "order",
      entityId: e.entity_id,
      snapshot: e.snapshot as ProductEntitySnapshot | OrderEntitySnapshot,
      sortOrder: e.sort_order,
    });
    entityByMsg.set(e.message_id, list);
  }

  const messages: AdminMessage[] = await Promise.all(
    page.map(async (m) => {
      const sender = Array.isArray(m.sender) ? m.sender[0] : m.sender;
      const rawAttachments = attachByMsg.get(m.id) ?? [];
      const signed = await signAttachmentUrls(rawAttachments);
      return {
        id: m.id,
        conversationId: m.conversation_id,
        senderId: m.sender_id,
        senderName: sender?.name ?? "Staff",
        body: m.body,
        createdAt: m.created_at,
        editedAt: m.edited_at,
        attachments: signed,
        entities: entityByMsg.get(m.id) ?? [],
      };
    }),
  );

  return { messages: messages.reverse(), hasMore };
}

export async function buildProductSnapshot(
  product: Product,
): Promise<ProductEntitySnapshot> {
  const activeSale = await getActiveSale();
  const { currentPrice, originalPrice } = computeDisplayPrice(
    product,
    activeSale,
  );
  return {
    id: product.id,
    name: product.name,
    slug: product.slug,
    image: product.images[0] ?? "",
    displayPrice: currentPrice,
    originalPrice,
    stock: product.stock,
    active: product.active,
  };
}

export async function buildOrderSnapshot(
  order: Order,
): Promise<OrderEntitySnapshot> {
  return {
    id: order.id,
    orderNumber: order.orderNumber,
    customerName: order.customerName,
    customerPhone: order.customerPhone,
    total: order.total,
    status: order.status,
    source: order.source,
    lineItemCount: order.products.length,
  };
}

export async function searchProductsForShare(
  query: string,
): Promise<ProductEntitySnapshot[]> {
  const supabase = requireAdmin();
  const activeSale = await getActiveSale();

  let dbQuery = supabase
    .from("products")
    .select("*")
    .eq("active", true)
    .order("name")
    .limit(20);

  if (query.trim()) {
    dbQuery = dbQuery.ilike("name", `%${query.trim()}%`);
  }

  const { data, error } = await dbQuery;
  if (error) throw new Error(error.message);

  return Promise.all(
    (data as DbProduct[]).map(async (row) => {
      const product = mapProduct(row);
      return buildProductSnapshot(product);
    }),
  );
}

export async function searchOrdersForShare(
  query: string,
  user: AdminUser,
): Promise<OrderEntitySnapshot[]> {
  const supabase = requireAdmin();
  const scope = getAnalyticsScope(user);

  let dbQuery = supabase
    .from("orders")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(20);

  if (scope === "own" && !hasPermission(user, "view_orders")) {
    return [];
  }
  if (scope === "own") {
    dbQuery = dbQuery.eq("created_by", user.id);
  }

  if (query.trim()) {
    const term = query.trim();
    dbQuery = dbQuery.or(
      `order_number.ilike.%${term}%,customer_phone.ilike.%${term}%,customer_name.ilike.%${term}%`,
    );
  }

  const { data, error } = await dbQuery;
  if (error) throw new Error(error.message);

  return (data as DbOrder[]).map((row) => {
    const order = mapOrder(row);
    return {
      id: order.id,
      orderNumber: order.orderNumber,
      customerName: order.customerName,
      customerPhone: order.customerPhone,
      total: order.total,
      status: order.status,
      source: order.source,
      lineItemCount: order.products.length,
    };
  });
}

export async function getSharedProductDetail(
  productId: string,
): Promise<Product | null> {
  const supabase = requireAdmin();
  const { data, error } = await supabase
    .from("products")
    .select("*")
    .eq("id", productId)
    .maybeSingle();
  if (error) throw new Error(error.message);
  if (!data) return null;
  return mapProduct(data as DbProduct);
}

export async function getSharedOrderDetail(
  orderId: string,
): Promise<Order | null> {
  const supabase = requireAdmin();
  const { data, error } = await supabase
    .from("orders")
    .select("*")
    .eq("id", orderId)
    .maybeSingle();
  if (error) throw new Error(error.message);
  if (!data) return null;
  return mapOrder(data as DbOrder);
}

export async function orderSharedInUserConversation(
  orderId: string,
  userId: string,
): Promise<boolean> {
  const supabase = requireAdmin();
  const { data: memberships } = await supabase
    .from("admin_conversation_members")
    .select("conversation_id")
    .eq("user_id", userId);

  const convIds = (memberships ?? []).map((m) => m.conversation_id);
  if (!convIds.length) return false;

  const { data: messages } = await supabase
    .from("admin_messages")
    .select("id")
    .in("conversation_id", convIds);

  const msgIds = (messages ?? []).map((m) => m.id);
  if (!msgIds.length) return false;

  const { data: entity } = await supabase
    .from("admin_message_entities")
    .select("id")
    .eq("entity_type", "order")
    .eq("entity_id", orderId)
    .in("message_id", msgIds)
    .limit(1)
    .maybeSingle();

  return !!entity;
}

export async function markConversationRead(
  conversationId: string,
  userId: string,
): Promise<void> {
  const supabase = requireAdmin();
  const now = new Date().toISOString();
  const { error } = await supabase.from("admin_conversation_reads").upsert(
    {
      conversation_id: conversationId,
      user_id: userId,
      last_read_at: now,
    },
    { onConflict: "conversation_id,user_id" },
  );
  if (error) throw new Error(error.message);
}

export async function getUnreadSummary(
  userId: string,
  limit = 5,
): Promise<{ items: UnreadSummaryItem[]; totalUnread: number }> {
  const conversations = await listMyConversations(userId);
  const unread = conversations.filter((c) => c.unreadCount > 0);
  const totalUnread = unread.reduce((sum, c) => sum + c.unreadCount, 0);

  const items: UnreadSummaryItem[] = unread.slice(0, limit).map((c) => ({
    conversationId: c.id,
    label: c.label,
    preview: c.preview ?? "",
    lastMessageAt: c.lastMessageAt ?? new Date().toISOString(),
    type: c.type,
  }));

  return { items, totalUnread };
}

export async function getReadState(
  conversationId: string,
  userId: string,
): Promise<{ lastReadAt: string | null; lastNotifiedAt: string | null }> {
  const supabase = requireAdmin();
  const { data } = await supabase
    .from("admin_conversation_reads")
    .select("last_read_at, last_notified_at")
    .eq("conversation_id", conversationId)
    .eq("user_id", userId)
    .maybeSingle();

  return {
    lastReadAt: data?.last_read_at ?? null,
    lastNotifiedAt: data?.last_notified_at ?? null,
  };
}

export async function updateLastNotifiedAt(
  conversationId: string,
  userId: string,
): Promise<void> {
  const supabase = requireAdmin();
  const now = new Date().toISOString();
  const { data: existing } = await supabase
    .from("admin_conversation_reads")
    .select("last_read_at")
    .eq("conversation_id", conversationId)
    .eq("user_id", userId)
    .maybeSingle();

  await supabase.from("admin_conversation_reads").upsert(
    {
      conversation_id: conversationId,
      user_id: userId,
      last_read_at: existing?.last_read_at ?? now,
      last_notified_at: now,
    },
    { onConflict: "conversation_id,user_id" },
  );
}

export async function insertMessage(opts: {
  conversationId: string;
  senderId: string;
  body: string | null;
  attachments: {
    storagePath: string;
    fileName: string;
    mimeType: string;
    sizeBytes: number;
  }[];
  productIds: string[];
  orderIds: string[];
  senderName: string;
  isGroup: boolean;
  productSnapshots: ProductEntitySnapshot[];
  orderSnapshots: OrderEntitySnapshot[];
}): Promise<AdminMessage> {
  const supabase = requireAdmin();

  const { data: msg, error } = await supabase
    .from("admin_messages")
    .insert({
      conversation_id: opts.conversationId,
      sender_id: opts.senderId,
      body: opts.body,
    })
    .select("id, created_at")
    .single();

  if (error) throw new Error(error.message);

  const messageId = msg.id;

  if (opts.attachments.length) {
    const { error: attError } = await supabase
      .from("admin_message_attachments")
      .insert(
        opts.attachments.map((a) => ({
          message_id: messageId,
          storage_path: a.storagePath,
          file_name: a.fileName,
          mime_type: a.mimeType,
          size_bytes: a.sizeBytes,
        })),
      );
    if (attError) throw new Error(attError.message);
  }

  const entities: {
    message_id: string;
    entity_type: string;
    entity_id: string;
    snapshot: object;
    sort_order: number;
  }[] = [];

  opts.productSnapshots.forEach((snap, i) => {
    entities.push({
      message_id: messageId,
      entity_type: "product",
      entity_id: snap.id,
      snapshot: snap,
      sort_order: i,
    });
  });
  opts.orderSnapshots.forEach((snap, i) => {
    entities.push({
      message_id: messageId,
      entity_type: "order",
      entity_id: snap.id,
      snapshot: snap,
      sort_order: opts.productSnapshots.length + i,
    });
  });

  if (entities.length) {
    const { error: entError } = await supabase
      .from("admin_message_entities")
      .insert(entities);
    if (entError) throw new Error(entError.message);
  }

  const firstEntity = opts.productSnapshots[0]
    ? { type: "product" as const, label: opts.productSnapshots[0].name }
    : opts.orderSnapshots[0]
      ? { type: "order" as const, label: opts.orderSnapshots[0].orderNumber }
      : undefined;

  const preview = buildMessagePreview({
    body: opts.body,
    senderName: opts.senderName,
    hasAttachments: opts.attachments.length > 0,
    firstEntity,
    isGroup: opts.isGroup,
  });

  await supabase
    .from("admin_conversations")
    .update({
      last_message_at: msg.created_at,
      last_message_preview: preview,
    })
    .eq("id", opts.conversationId);

  const { messages } = await getMessages(opts.conversationId, undefined, 1);
  return messages[messages.length - 1]!;
}

export async function updateMessageBody(opts: {
  messageId: string;
  body: string | null;
  conversationId: string;
  isGroup: boolean;
  senderName: string;
}): Promise<void> {
  const supabase = requireAdmin();
  const now = new Date().toISOString();

  const { error } = await supabase
    .from("admin_messages")
    .update({ body: opts.body, edited_at: now })
    .eq("id", opts.messageId);

  if (error) throw new Error(error.message);

  const { data: latest } = await supabase
    .from("admin_messages")
    .select("id, body")
    .eq("conversation_id", opts.conversationId)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (latest?.id === opts.messageId) {
    const { data: entities } = await supabase
      .from("admin_message_entities")
      .select("entity_type, snapshot")
      .eq("message_id", opts.messageId)
      .order("sort_order")
      .limit(1);

    const firstEnt = entities?.[0];
    const firstEntity = firstEnt
      ? {
          type: firstEnt.entity_type as "product" | "order",
          label:
            firstEnt.entity_type === "product"
              ? (firstEnt.snapshot as ProductEntitySnapshot).name
              : (firstEnt.snapshot as OrderEntitySnapshot).orderNumber,
        }
      : undefined;

    const { count: attCount } = await supabase
      .from("admin_message_attachments")
      .select("id", { count: "exact", head: true })
      .eq("message_id", opts.messageId);

    const preview = buildMessagePreview({
      body: opts.body,
      senderName: opts.senderName,
      hasAttachments: (attCount ?? 0) > 0,
      firstEntity,
      isGroup: opts.isGroup,
    });

    await supabase
      .from("admin_conversations")
      .update({ last_message_preview: preview })
      .eq("id", opts.conversationId);
  }
}

export async function uploadMessageAttachment(
  conversationId: string,
  messageId: string,
  file: File,
): Promise<{
  storagePath: string;
  fileName: string;
  mimeType: string;
  sizeBytes: number;
}> {
  const supabase = requireAdmin();
  const ext = file.name.split(".").pop() ?? "bin";
  const path = `${conversationId}/${messageId}/${crypto.randomUUID()}.${ext}`;

  const { error } = await supabase.storage
    .from("message-attachments")
    .upload(path, file, { contentType: file.type, upsert: false });

  if (error) throw new Error(error.message);

  return {
    storagePath: path,
    fileName: file.name,
    mimeType: file.type,
    sizeBytes: file.size,
  };
}

export async function getMessageById(
  messageId: string,
): Promise<{
  id: string;
  conversationId: string;
  senderId: string;
  body: string | null;
  attachmentCount: number;
  entityCount: number;
} | null> {
  const supabase = requireAdmin();
  const { data, error } = await supabase
    .from("admin_messages")
    .select("id, conversation_id, sender_id, body")
    .eq("id", messageId)
    .maybeSingle();

  if (error) throw new Error(error.message);
  if (!data) return null;

  const { count: attCount } = await supabase
    .from("admin_message_attachments")
    .select("id", { count: "exact", head: true })
    .eq("message_id", messageId);

  const { count: entCount } = await supabase
    .from("admin_message_entities")
    .select("id", { count: "exact", head: true })
    .eq("message_id", messageId);

  return {
    id: data.id,
    conversationId: data.conversation_id,
    senderId: data.sender_id,
    body: data.body,
    attachmentCount: attCount ?? 0,
    entityCount: entCount ?? 0,
  };
}

export async function getConversationRecipients(
  conversationId: string,
  excludeUserId: string,
): Promise<{ id: string; email: string; name: string; active: boolean }[]> {
  const supabase = requireAdmin();
  const { data: members } = await supabase
    .from("admin_conversation_members")
    .select("user_id")
    .eq("conversation_id", conversationId)
    .neq("user_id", excludeUserId);

  const ids = (members ?? []).map((m) => m.user_id);
  if (!ids.length) return [];

  const { data: profiles } = await supabase
    .from("admin_profiles")
    .select("id, email, name, active")
    .in("id", ids);

  return (profiles ?? []).map((p) => ({
    id: p.id,
    email: p.email,
    name: p.name ?? "Staff",
    active: p.active !== false,
  }));
}
