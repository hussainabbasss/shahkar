"use client";

import { LogOut, Search } from "lucide-react";
import { logoutAdmin } from "@/app/actions/admin/auth";
import { ThemeToggle } from "@/components/admin/ThemeToggle";

type AdminTopBarProps = {
  title: string;
  adminName: string;
};

export function AdminTopBar({ title, adminName }: AdminTopBarProps) {
  const initials = adminName
    .split(" ")
    .map((n) => n[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  return (
    <header
      className="sticky top-0 z-40 flex h-16 items-center justify-between gap-4 px-6 backdrop-blur-md"
      style={{
        background: "color-mix(in srgb, var(--admin-surface) 85%, transparent)",
        borderBottom: "1px solid var(--admin-border)",
      }}
    >
      <h1
        className="text-lg font-bold"
        style={{ color: "var(--admin-text-heading)" }}
      >
        {title}
      </h1>

      <div className="flex items-center gap-3">
        <div
          className="hidden items-center gap-2 rounded-lg border px-3 py-1.5 sm:flex"
          style={{
            borderColor: "var(--admin-border)",
            background: "var(--admin-canvas)",
            color: "var(--admin-text-subtle)",
          }}
        >
          <Search size={14} />
          <span className="text-xs">Search orders…</span>
          <kbd
            className="ml-4 rounded px-1.5 py-0.5 text-[10px] font-medium"
            style={{
              background: "var(--admin-surface)",
              border: "1px solid var(--admin-border)",
            }}
          >
            ⌘K
          </kbd>
        </div>

        <ThemeToggle />

        <div
          className="hidden h-6 w-px sm:block"
          style={{ background: "var(--admin-border)" }}
        />

        <div className="flex items-center gap-2">
          <div
            className="flex h-8 w-8 items-center justify-center rounded-full text-xs font-bold"
            style={{
              background: "var(--admin-primary-muted)",
              color: "var(--admin-primary-text)",
            }}
          >
            {initials}
          </div>
          <span
            className="hidden text-sm font-medium sm:block"
            style={{ color: "var(--admin-text-muted)" }}
          >
            {adminName}
          </span>
        </div>

        <form action={logoutAdmin}>
          <button
            type="submit"
            className="flex h-9 items-center gap-1.5 rounded-lg border px-3 text-sm font-medium transition-colors hover:bg-[color-mix(in_srgb,var(--admin-primary)_6%,transparent)]"
            style={{
              borderColor: "var(--admin-border)",
              color: "var(--admin-text-body)",
            }}
          >
            <LogOut size={14} />
            <span className="hidden sm:inline">Logout</span>
          </button>
        </form>
      </div>
    </header>
  );
}
