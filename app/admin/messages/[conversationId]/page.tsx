import type { Metadata } from "next";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { AdminEmptyState } from "@/components/admin/AdminUI";
import { MessagesLayout } from "@/components/admin/messages/MessagesLayout";
import { requireAdmin } from "@/lib/admin/auth";
import {
  hasPermission,
  isSuperAdmin,
} from "@/lib/admin/permissions";
import {
  getConversationById,
  getConversationListItem,
  getConversationMembers,
} from "@/lib/db/admin/messages";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { notFound } from "next/navigation";

export const metadata: Metadata = {
  title: "Messages",
};

export default async function AdminMessagesConversationPage({
  params,
}: {
  params: Promise<{ conversationId: string }>;
}) {
  const admin = await requireAdmin();
  const { conversationId } = await params;

  if (!isSupabaseConfigured()) {
    return (
      <AdminLayout title="Messages" admin={admin}>
        <AdminEmptyState message="Supabase is not configured." />
      </AdminLayout>
    );
  }

  const conv = await getConversationById(conversationId);
  if (!conv) notFound();

  const [initialConversation, initialMembers] = await Promise.all([
    getConversationListItem(conversationId, admin.id),
    getConversationMembers(conversationId),
  ]);

  return (
    <AdminLayout title="Messages" admin={admin}>
      <MessagesLayout
        currentUserId={admin.id}
        isSuperAdmin={isSuperAdmin(admin)}
        canCreateGroups={hasPermission(admin, "create_message_groups")}
        canShareProducts={hasPermission(admin, "view_products")}
        canShareOrders={hasPermission(admin, "view_orders")}
        canManageProducts={hasPermission(admin, "manage_products")}
        initialConversationId={conversationId}
        initialConversation={initialConversation ?? undefined}
        initialMembers={initialMembers}
        initialCreatedById={conv.created_by}
      />
    </AdminLayout>
  );
}
