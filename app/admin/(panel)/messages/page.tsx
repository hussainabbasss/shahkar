import type { Metadata } from "next";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { AdminEmptyState } from "@/components/admin/AdminUI";
import { MessagesLayout } from "@/components/admin/messages/MessagesLayout";
import { requireAdmin } from "@/lib/admin/auth";
import {
  hasPermission,
  isSuperAdmin,
} from "@/lib/admin/permissions";
import { isSupabaseConfigured } from "@/lib/supabase/config";

export const metadata: Metadata = {
  title: "Messages",
};

export default async function AdminMessagesPage({
  searchParams,
}: {
  searchParams: Promise<{ with?: string }>;
}) {
  const admin = await requireAdmin();
  const params = await searchParams;

  if (!isSupabaseConfigured()) {
    return (
      <AdminLayout title="Messages" admin={admin}>
        <AdminEmptyState message="Supabase is not configured." />
      </AdminLayout>
    );
  }

  return (
    <AdminLayout title="Messages" admin={admin}>
      <MessagesLayout
        currentUserId={admin.id}
        isSuperAdmin={isSuperAdmin(admin)}
        canCreateGroups={hasPermission(admin, "create_message_groups")}
        canShareProducts={hasPermission(admin, "view_products")}
        canShareOrders={hasPermission(admin, "view_orders")}
        canShareTickets={hasPermission(admin, "view_tickets")}
        canManageProducts={hasPermission(admin, "manage_products")}
        canViewTickets={hasPermission(admin, "view_tickets")}
        canManageTickets={hasPermission(admin, "manage_tickets")}
        withUserId={params.with}
      />
    </AdminLayout>
  );
}
