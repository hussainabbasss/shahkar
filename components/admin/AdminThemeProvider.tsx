"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import {
  ADMIN_THEME_STORAGE_KEY,
  adminThemeCookieOptions,
  type AdminTheme,
} from "@/lib/admin/theme";

const ThemeContext = createContext<{
  theme: AdminTheme;
  toggleTheme: () => void;
} | null>(null);

function persistTheme(theme: AdminTheme) {
  localStorage.setItem(ADMIN_THEME_STORAGE_KEY, theme);
  document.cookie = adminThemeCookieOptions(theme);
}

export function AdminThemeProvider({
  children,
  initialTheme = "light",
}: {
  children: ReactNode;
  initialTheme?: AdminTheme;
}) {
  const [theme, setTheme] = useState<AdminTheme>(initialTheme);

  // Sync localStorage → cookie on first client load (legacy sessions)
  useEffect(() => {
    const stored = localStorage.getItem(ADMIN_THEME_STORAGE_KEY) as AdminTheme | null;
    if (stored === "dark" || stored === "light") {
      if (stored !== initialTheme) setTheme(stored);
      document.cookie = adminThemeCookieOptions(stored);
      return;
    }
    persistTheme(initialTheme);
  }, [initialTheme]);

  const toggleTheme = useCallback(() => {
    setTheme((prev) => {
      const next = prev === "light" ? "dark" : "light";
      persistTheme(next);
      return next;
    });
  }, []);

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme }}>
      <div className="admin-shell flex min-h-screen" data-theme={theme}>
        {children}
      </div>
    </ThemeContext.Provider>
  );
}

export function useAdminTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error("useAdminTheme must be used within AdminThemeProvider");
  return ctx;
}
