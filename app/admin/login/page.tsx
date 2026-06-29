import type { Metadata } from "next";
import { LoginForm } from "@/components/admin/LoginForm";

export const metadata: Metadata = {
  title: "Admin Login",
};

export default async function AdminLoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const params = await searchParams;

  return (
    <div
      className="flex min-h-screen flex-1 items-center justify-center p-4"
      style={{ background: "var(--admin-canvas)" }}
    >
      <div
        className="w-full max-w-md rounded-xl p-8"
        style={{
          background: "var(--admin-surface)",
          border: "1px solid var(--admin-border)",
          boxShadow: "var(--admin-shadow-md)",
        }}
      >
        <div className="mb-6 text-center">
          <div
            className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-xl text-lg font-bold text-white"
            style={{ background: "var(--admin-primary)" }}
          >
            S
          </div>
          <h1
            className="text-2xl font-bold"
            style={{ color: "var(--admin-text-heading)" }}
          >
            Shahkar Admin
          </h1>
          <p className="mt-1 text-sm" style={{ color: "var(--admin-text-muted)" }}>
            Sign in to manage your store
          </p>
        </div>
        {params.error === "unauthorized" && (
          <div
            className="mb-4 rounded-lg px-4 py-3 text-sm"
            style={{
              background: "color-mix(in srgb, var(--admin-error) 12%, transparent)",
              color: "var(--admin-error)",
            }}
          >
            You are not authorized to access the admin panel.
          </div>
        )}
        <LoginForm />
      </div>
    </div>
  );
}
