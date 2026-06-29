"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import {
  AlertTriangle,
  BarChart3,
  ExternalLink,
  GitCompare,
  LayoutDashboard,
  MessageSquare,
  Package,
  ShoppingBag,
  Tag,
  Ticket,
  Users,
  type LucideIcon,
} from "lucide-react";
import type { AdminNavGroup, AdminNavIconName } from "@/lib/admin/nav";
import { fetchUnreadSummaryAction } from "@/app/actions/admin/messages";

const NAV_ICONS: Record<AdminNavIconName, LucideIcon> = {
  dashboard: LayoutDashboard,
  products: Package,
  orders: ShoppingBag,
  sales: Tag,
  coupons: Ticket,
  team: Users,
  compare: GitCompare,
  analytics: BarChart3,
  messages: MessageSquare,
};

type AdminSidebarProps = {
  navGroups: AdminNavGroup[];
  issueCount?: number;
  lowStockCount?: number;
};

export function AdminSidebar({
  navGroups,
  issueCount = 0,
  lowStockCount = 0,
}: AdminSidebarProps) {
  const pathname = usePathname();
  const [messagesUnread, setMessagesUnread] = useState(0);

  useEffect(() => {
    fetchUnreadSummaryAction()
      .then((s) => setMessagesUnread(s.totalUnread))
      .catch(() => {});
    const interval = setInterval(() => {
      fetchUnreadSummaryAction()
        .then((s) => setMessagesUnread(s.totalUnread))
        .catch(() => {});
    }, 60000);
    return () => clearInterval(interval);
  }, [pathname]);

  return (
    <aside
      className="flex shrink-0 flex-col"
      style={{
        width: "var(--admin-sidebar-w)",
        background: "var(--admin-surface)",
        borderRight: "1px solid var(--admin-border)",
      }}
    >
      <div
        className="flex h-[72px] items-center gap-3 px-5"
        style={{ borderBottom: "1px solid var(--admin-border)" }}
      >
        <div
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-sm font-bold text-white"
          style={{ background: "var(--admin-primary)" }}
        >
          S
        </div>
        <div>
          <Link
            href="/admin/dashboard"
            className="block text-[15px] font-bold leading-tight"
            style={{ color: "var(--admin-text-heading)" }}
          >
            Shahkar
          </Link>
          <span className="text-[11px]" style={{ color: "var(--admin-text-muted)" }}>
            Store operations
          </span>
        </div>
      </div>

      <nav className="flex flex-1 flex-col gap-4 overflow-y-auto p-3">
        {navGroups.map((group) => (
          <div key={group.label}>
            <p
              className="mb-1.5 px-3 text-[10px] font-semibold uppercase tracking-wider"
              style={{ color: "var(--admin-text-subtle)" }}
            >
              {group.label}
            </p>
            <div className="flex flex-col gap-0.5">
              {group.items.map((item) => {
                const active =
                  pathname === item.href ||
                  pathname.startsWith(`${item.href}/`);
                const Icon = NAV_ICONS[item.icon];
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`flex items-center gap-2.5 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${
                      active ? "admin-nav-active" : ""
                    }`}
                    style={
                      active
                        ? undefined
                        : { color: "var(--admin-text-muted)" }
                    }
                  >
                    <Icon size={18} strokeWidth={active ? 2.25 : 2} />
                    <span className="flex-1">{item.label}</span>
                    {item.href === "/admin/messages" && messagesUnread > 0 && (
                      <span
                        className="flex h-5 min-w-5 items-center justify-center rounded-full px-1.5 text-[10px] font-bold text-white"
                        style={{ background: "var(--admin-primary)" }}
                      >
                        {messagesUnread > 99 ? "99+" : messagesUnread}
                      </span>
                    )}
                  </Link>
                );
              })}
            </div>
          </div>
        ))}
      </nav>

      <div className="space-y-2 p-3" style={{ borderTop: "1px solid var(--admin-border)" }}>
        {issueCount > 0 && (
          <Link
            href="/admin/dashboard"
            className="block rounded-lg p-3 transition-opacity hover:opacity-90"
            style={{
              background: "var(--admin-accent-muted)",
              border: "1px solid color-mix(in srgb, var(--admin-accent) 25%, transparent)",
            }}
          >
            <div className="flex items-start gap-2">
              <AlertTriangle
                size={16}
                className="mt-0.5 shrink-0"
                style={{ color: "var(--admin-accent)" }}
              />
              <div>
                <p
                  className="text-xs font-semibold"
                  style={{ color: "var(--admin-text-heading)" }}
                >
                  {issueCount} issue{issueCount !== 1 ? "s" : ""} need attention
                </p>
                {lowStockCount > 0 && (
                  <p
                    className="mt-0.5 truncate text-[11px]"
                    style={{ color: "var(--admin-text-muted)" }}
                  >
                    Low stock on {lowStockCount} product
                    {lowStockCount !== 1 ? "s" : ""}
                  </p>
                )}
              </div>
            </div>
          </Link>
        )}

        <Link
          href="/"
          target="_blank"
          className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm transition-colors hover:bg-[color-mix(in_srgb,var(--admin-primary)_6%,transparent)]"
          style={{ color: "var(--admin-text-muted)" }}
        >
          <ExternalLink size={14} />
          View Storefront
        </Link>

        <p
          className="px-3 text-[10px]"
          style={{ color: "var(--admin-text-subtle)" }}
        >
          v1.0 · Shahkar.store
        </p>
      </div>
    </aside>
  );
}
