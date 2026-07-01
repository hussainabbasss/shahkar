import type { ReactNode } from "react";
import { AdminSidebar } from "@/components/admin/AdminSidebar";
import { ToastProvider } from "@/components/admin/ToastProvider";
import type { AdminNavGroup } from "@/lib/admin/nav";

type AdminPanelShellProps = {
  navGroups: AdminNavGroup[];
  children: ReactNode;
  issueCount?: number;
  lowStockCount?: number;
};

export function AdminPanelShell({
  navGroups,
  children,
  issueCount = 0,
  lowStockCount = 0,
}: AdminPanelShellProps) {
  return (
    <ToastProvider>
      <div
        className="flex min-h-screen w-full"
        style={{ background: "var(--admin-canvas)" }}
      >
        <AdminSidebar
          navGroups={navGroups}
          issueCount={issueCount}
          lowStockCount={lowStockCount}
        />
        <div className="flex min-w-0 flex-1 flex-col w-full">{children}</div>
      </div>
    </ToastProvider>
  );
}
