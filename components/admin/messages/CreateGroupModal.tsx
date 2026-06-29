"use client";

import { useState } from "react";
import { X } from "lucide-react";
import { createGroupAction } from "@/app/actions/admin/messages";
import { adminInputClass } from "@/components/admin/AdminUI";
import type { StaffMember } from "@/lib/db/admin/messages";

type CreateGroupModalProps = {
  open: boolean;
  onClose: () => void;
  staff: StaffMember[];
  onCreated: (conversationId: string) => void;
};

export function CreateGroupModal({
  open,
  onClose,
  staff,
  onCreated,
}: CreateGroupModalProps) {
  const [name, setName] = useState("");
  const [selected, setSelected] = useState<string[]>([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  if (!open) return null;

  function toggle(id: string) {
    setSelected((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id],
    );
  }

  async function handleCreate() {
    setError("");
    setLoading(true);
    const result = await createGroupAction({ name, memberIds: selected });
    setLoading(false);
    if (result.success && result.data) {
      onCreated(result.data.conversationId);
      setName("");
      setSelected([]);
      onClose();
    } else if (!result.success) {
      setError(result.error);
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: "rgba(0,0,0,0.5)" }}
      onClick={onClose}
    >
      <div
        className="max-h-[90vh] w-full max-w-md overflow-y-auto rounded-xl p-6"
        style={{
          background: "var(--admin-surface)",
          border: "1px solid var(--admin-border)",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-bold" style={{ color: "var(--admin-text-heading)" }}>
            New group
          </h2>
          <button type="button" onClick={onClose}>
            <X size={20} />
          </button>
        </div>

        <label className="mb-4 block">
          <span className="mb-1 block text-sm font-medium">Group name</span>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            maxLength={80}
            className={adminInputClass}
            placeholder="Team updates"
          />
        </label>

        <p className="mb-2 text-sm font-medium">
          Members (select at least 2)
        </p>
        <div
          className="mb-4 max-h-48 space-y-1 overflow-y-auto rounded-lg p-2"
          style={{ border: "1px solid var(--admin-border)" }}
        >
          {staff.map((s) => (
            <label
              key={s.id}
              className="flex cursor-pointer items-center gap-2 rounded px-2 py-1.5 text-sm hover:bg-[color-mix(in_srgb,var(--admin-primary)_6%,transparent)]"
            >
              <input
                type="checkbox"
                checked={selected.includes(s.id)}
                onChange={() => toggle(s.id)}
              />
              {s.name}
            </label>
          ))}
        </div>

        {error && (
          <p className="mb-3 text-sm" style={{ color: "var(--admin-error)" }}>
            {error}
          </p>
        )}

        <button
          type="button"
          onClick={() => void handleCreate()}
          disabled={loading || !name.trim() || selected.length < 2}
          className="w-full rounded-lg py-3 text-sm font-semibold text-white disabled:opacity-50"
          style={{ background: "var(--admin-primary)" }}
        >
          {loading ? "Creating…" : "Create group"}
        </button>
      </div>
    </div>
  );
}
