export const ADMIN_THEME_COOKIE = "shahkar-admin-theme";
export const ADMIN_THEME_STORAGE_KEY = "shahkar-admin-theme";

export type AdminTheme = "light" | "dark";

export function parseAdminTheme(value: string | undefined): AdminTheme {
  return value === "dark" ? "dark" : "light";
}

export function adminThemeCookieOptions(theme: AdminTheme): string {
  return `${ADMIN_THEME_COOKIE}=${theme};path=/admin;max-age=31536000;SameSite=Lax`;
}
