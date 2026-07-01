import type { ReactNode } from "react";
import { AdminTopBar } from "@/components/admin/AdminTopBar";
import type { AdminUser } from "@/lib/admin/auth";

type AdminPageFrameProps = {
  title: string;
  admin: AdminUser;
  children: ReactNode;
  actions?: ReactNode;
};

export function AdminPageFrame({
  title,
  admin,
  children,
  actions,
}: AdminPageFrameProps) {
  return (
    <>
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
      <main className="flex-1 w-full overflow-x-auto p-6 md:p-8">{children}</main>
    </>
  );
}
