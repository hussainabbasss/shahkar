"use client";

import { useState } from "react";
import { Plus } from "lucide-react";
import { createTicketDepartmentAction } from "@/app/actions/admin/tickets";
import { adminInputClass } from "@/components/admin/AdminUI";
import type { TicketDepartmentRecord } from "@/lib/db/admin/ticket-departments";

type AddDepartmentInlineProps = {
  onCreated: (department: TicketDepartmentRecord) => void;
};

export function AddDepartmentInline({ onCreated }: AddDepartmentInlineProps) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError("");
    const result = await createTicketDepartmentAction(name);
    setSaving(false);
    if (result.success && result.data) {
      onCreated(result.data);
      setName("");
      setOpen(false);
    } else if (!result.success) {
      setError(result.error);
    }
  }

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="mt-2 flex items-center gap-1 text-sm font-semibold"
        style={{ color: "var(--admin-primary)" }}
      >
        <Plus size={14} />
        Naya department
      </button>
    );
  }

  return (
    <form onSubmit={(e) => void handleSubmit(e)} className="mt-2 space-y-2">
      <input
        type="text"
        value={name}
        onChange={(e) => setName(e.target.value)}
        placeholder="Department ka naam"
        className={adminInputClass}
        maxLength={60}
        autoFocus
      />
      {error && (
        <p className="text-xs" style={{ color: "var(--admin-error)" }}>
          {error}
        </p>
      )}
      <div className="flex gap-2">
        <button
          type="submit"
          disabled={saving || name.trim().length < 2}
          className="rounded-lg px-3 py-1.5 text-xs font-semibold text-white disabled:opacity-50"
          style={{ background: "var(--admin-primary)" }}
        >
          {saving ? "Adding…" : "Add"}
        </button>
        <button
          type="button"
          onClick={() => {
            setOpen(false);
            setError("");
            setName("");
          }}
          className="rounded-lg px-3 py-1.5 text-xs"
          style={{ color: "var(--admin-text-muted)" }}
        >
          Cancel
        </button>
      </div>
    </form>
  );
}
