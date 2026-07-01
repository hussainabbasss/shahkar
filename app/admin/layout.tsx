import { AdminThemeProvider } from "@/components/admin/AdminThemeProvider";
import {
  ADMIN_THEME_COOKIE,
  parseAdminTheme,
} from "@/lib/admin/theme";
import type { Metadata } from "next";
import { cookies } from "next/headers";

export const metadata: Metadata = {
  robots: { index: false, follow: false },
};

export default async function AdminRootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const cookieStore = await cookies();
  const initialTheme = parseAdminTheme(
    cookieStore.get(ADMIN_THEME_COOKIE)?.value,
  );

  return (
    <AdminThemeProvider initialTheme={initialTheme}>{children}</AdminThemeProvider>
  );
}
