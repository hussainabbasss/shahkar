import type { ReactNode } from "react";
import { AdminSidebar } from "@/components/admin/AdminSidebar";
import { AdminTopBar } from "@/components/admin/AdminTopBar";
import { ToastProvider } from "@/components/admin/ToastProvider";
import type { AdminNavGroup } from "@/lib/admin/nav";
import { buildAdminNavGroups } from "@/lib/admin/nav";
import type { AdminUser } from "@/lib/admin/auth";

type AdminLayoutProps = {
  title: string;
  admin: AdminUser;
  children: ReactNode;
  actions?: ReactNode;
  sidebarIssues?: { issueCount: number; lowStockCount: number };
  navGroups?: AdminNavGroup[];
};

export function AdminLayout({
  title,
  admin,
  children,
  actions,
  sidebarIssues,
  navGroups,
}: AdminLayoutProps) {
  const groups = navGroups ?? buildAdminNavGroups(admin);

  return (
    <ToastProvider>
      <>
        <AdminSidebar
          navGroups={groups}
          issueCount={sidebarIssues?.issueCount ?? 0}
          lowStockCount={sidebarIssues?.lowStockCount ?? 0}
        />
        <div className="flex min-w-0 flex-1 flex-col">
          <AdminTopBar title={title} adminName={admin.name} />
          {actions && (
            <div
              className="flex items-center justify-end gap-3 px-6 py-3"
              style={{
                borderBottom: "1px solid var(--admin-border)",
                background: "var(--admin-surface)",
              }}
            >
              {actions}
            </div>
          )}
          <main className="flex-1 overflow-x-auto p-6 md:p-8">{children}</main>
        </div>
      </>
    </ToastProvider>
  );
}
