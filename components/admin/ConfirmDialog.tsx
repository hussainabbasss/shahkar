"use client";

import { useState } from "react";
import { AdminDangerButton } from "@/components/admin/AdminUI";

type ConfirmDialogProps = {
  title: string;
  message: string;
  onConfirm: () => void | Promise<void>;
  triggerLabel?: string;
  loading?: boolean;
};

export function ConfirmDialog({
  title,
  message,
  onConfirm,
  triggerLabel = "Delete",
  loading = false,
}: ConfirmDialogProps) {
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);

  async function handleConfirm() {
    setBusy(true);
    try {
      await onConfirm();
      setOpen(false);
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      <AdminDangerButton onClick={() => setOpen(true)} disabled={loading}>
        {triggerLabel}
      </AdminDangerButton>
      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div
            className="admin-card w-full max-w-md p-6"
            style={{ boxShadow: "var(--admin-shadow-md)" }}
          >
            <h3
              className="text-lg font-bold"
              style={{ color: "var(--admin-text-heading)" }}
            >
              {title}
            </h3>
            <p
              className="mt-2 text-sm"
              style={{ color: "var(--admin-text-body)" }}
            >
              {message}
            </p>
            <div className="mt-6 flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="rounded-lg border px-4 py-2 text-sm font-medium"
                style={{
                  borderColor: "var(--admin-border-solid)",
                  color: "var(--admin-text-body)",
                }}
                disabled={busy}
              >
                Cancel
              </button>
              <AdminDangerButton onClick={handleConfirm} disabled={busy}>
                {busy ? "Deleting…" : "Confirm"}
              </AdminDangerButton>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
