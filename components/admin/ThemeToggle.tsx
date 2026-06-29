"use client";

import { Moon, Sun } from "lucide-react";
import { useAdminTheme } from "@/components/admin/AdminThemeProvider";

export function ThemeToggle() {
  const { theme, toggleTheme } = useAdminTheme();

  return (
    <button
      type="button"
      onClick={toggleTheme}
      aria-label={theme === "light" ? "Switch to dark mode" : "Switch to light mode"}
      title={theme === "light" ? "Switch to dark mode" : "Switch to light mode"}
      className="flex h-9 w-9 items-center justify-center rounded-lg border transition-colors hover:bg-[color-mix(in_srgb,var(--admin-primary)_6%,transparent)]"
      style={{
        borderColor: "var(--admin-border)",
        color: "var(--admin-text-muted)",
      }}
    >
      {theme === "light" ? <Moon size={16} /> : <Sun size={16} />}
    </button>
  );
}
