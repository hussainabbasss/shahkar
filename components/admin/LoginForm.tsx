"use client";

import { useActionState } from "react";
import { loginAdmin, type AuthActionResult } from "@/app/actions/admin/auth";
import { adminInputClass, adminInputStyle } from "@/components/admin/AdminUI";

export function LoginForm() {
  const [state, action, pending] = useActionState<AuthActionResult | null, FormData>(
    loginAdmin,
    null,
  );

  return (
    <form action={action} className="space-y-4">
      {state && !state.success && (
        <div
          className="rounded-lg px-4 py-3 text-sm"
          style={{
            background: "color-mix(in srgb, var(--admin-error) 12%, transparent)",
            color: "var(--admin-error)",
          }}
        >
          {state.error}
        </div>
      )}
      <label className="block">
        <span
          className="mb-1 block text-sm font-medium"
          style={{ color: "var(--admin-text-body)" }}
        >
          Email
        </span>
        <input
          name="email"
          type="email"
          required
          autoComplete="email"
          className={adminInputClass}
          style={adminInputStyle}
        />
      </label>
      <label className="block">
        <span
          className="mb-1 block text-sm font-medium"
          style={{ color: "var(--admin-text-body)" }}
        >
          Password
        </span>
        <input
          name="password"
          type="password"
          required
          autoComplete="current-password"
          className={adminInputClass}
          style={adminInputStyle}
        />
      </label>
      <button
        type="submit"
        disabled={pending}
        className="w-full rounded-lg py-2.5 text-sm font-semibold text-white transition-opacity disabled:opacity-50"
        style={{ background: "var(--admin-primary)" }}
      >
        {pending ? "Signing in…" : "Sign In"}
      </button>
    </form>
  );
}
