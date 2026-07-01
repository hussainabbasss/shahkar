import type { ReactNode } from "react";
import { AdminPageFrame } from "@/components/admin/AdminPageFrame";
import type { AdminNavGroup } from "@/lib/admin/nav";
import type { AdminUser } from "@/lib/admin/auth";

type AdminLayoutProps = {
  title: string;
  admin: AdminUser;
  children: ReactNode;
  actions?: ReactNode;
  /** @deprecated Sidebar lives in (panel)/layout — only used when shell is external */
  sidebarIssues?: { issueCount: number; lowStockCount: number };
  navGroups?: AdminNavGroup[];
};

/** Page chrome (top bar + main). Sidebar is provided by `app/admin/(panel)/layout.tsx`. */
export function AdminLayout({
  title,
  admin,
  children,
  actions,
}: AdminLayoutProps) {
  return (
    <AdminPageFrame title={title} admin={admin} actions={actions}>
      {children}
    </AdminPageFrame>
  );
}
