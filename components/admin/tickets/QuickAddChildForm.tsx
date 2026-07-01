"use client";

import { useState } from "react";
import { Plus } from "lucide-react";
import { createQuickChildTicketAction } from "@/app/actions/admin/tickets";
import { adminInputClass } from "@/components/admin/AdminUI";
import { ISSUE_TYPE_LABELS, type IssueType } from "@/lib/admin/tickets";

type QuickAddChildFormProps = {
  parentTicketKey: string;
  issueType: IssueType;
  label?: string;
  onCreated?: () => void;
};

export function QuickAddChildForm({
  parentTicketKey,
  issueType,
  label,
  onCreated,
}: QuickAddChildFormProps) {
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const typeLabel = label ?? ISSUE_TYPE_LABELS[issueType];

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = title.trim();
    if (trimmed.length < 2) return;
    setSaving(true);
    setError("");
    const result = await createQuickChildTicketAction({
      parentTicketKey,
      issueType,
      title: trimmed,
    });
    setSaving(false);
    if (result.success) {
      setTitle("");
      setOpen(false);
      onCreated?.();
    } else if (!result.success) {
      setError(result.error);
    }
  }

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="inline-flex items-center gap-1 text-xs font-semibold"
        style={{ color: "var(--admin-primary)" }}
      >
        <Plus size={14} />
        {typeLabel} add karein
      </button>
    );
  }

  return (
    <form onSubmit={(e) => void handleSubmit(e)} className="mt-2 space-y-2">
      <input
        type="text"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        placeholder={`${typeLabel} ka title`}
        className={adminInputClass}
        maxLength={200}
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
          disabled={saving || title.trim().length < 2}
          className="rounded-lg px-3 py-1.5 text-xs font-semibold text-white disabled:opacity-50"
          style={{ background: "var(--admin-primary)" }}
        >
          {saving ? "Adding…" : "Add"}
        </button>
        <button
          type="button"
          onClick={() => {
            setOpen(false);
            setTitle("");
            setError("");
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
