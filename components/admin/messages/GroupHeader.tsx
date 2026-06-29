"use client";

import { useState } from "react";
import { UserPlus } from "lucide-react";
import { addGroupMembersAction } from "@/app/actions/admin/messages";
import { CallButton } from "@/components/admin/messages/CallButton";
import type { ConversationMember, StaffMember } from "@/lib/db/admin/messages";

type GroupHeaderProps = {
  conversationId: string;
  name: string;
  members: ConversationMember[];
  isCreator: boolean;
  availableStaff: StaffMember[];
  showCallButton?: boolean;
  onMembersAdded: () => void;
};

export function GroupHeader({
  conversationId,
  name,
  members,
  isCreator,
  availableStaff,
  showCallButton,
  onMembersAdded,
}: GroupHeaderProps) {
  const [addOpen, setAddOpen] = useState(false);
  const [selected, setSelected] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);

  const memberIds = new Set(members.map((m) => m.id));
  const toAdd = availableStaff.filter((s) => !memberIds.has(s.id));

  async function handleAdd() {
    if (!selected.length) return;
    setLoading(true);
    const result = await addGroupMembersAction(conversationId, selected);
    setLoading(false);
    if (result.success) {
      setSelected([]);
      setAddOpen(false);
      onMembersAdded();
    }
  }

  return (
    <div
      className="flex items-center justify-between border-b px-4 py-3"
      style={{ borderColor: "var(--admin-border)" }}
    >
      <div className="min-w-0 flex-1">
        <h2
          className="truncate font-bold"
          style={{ color: "var(--admin-text-heading)" }}
        >
          {name}
        </h2>
        <p
          className="truncate text-xs"
          style={{ color: "var(--admin-text-muted)" }}
        >
          {members.map((m) => m.name).join(", ")}
        </p>
      </div>

      <div className="flex shrink-0 items-center gap-2">
        {showCallButton && <CallButton conversationId={conversationId} />}

        {isCreator && toAdd.length > 0 && (
          <div className="relative shrink-0">
          <button
            type="button"
            onClick={() => setAddOpen((v) => !v)}
            className="flex items-center gap-1 rounded-lg px-2 py-1.5 text-xs font-medium"
            style={{
              border: "1px solid var(--admin-border)",
              color: "var(--admin-text-muted)",
            }}
          >
            <UserPlus size={14} />
            Add
          </button>

          {addOpen && (
            <>
              <div
                className="fixed inset-0 z-10"
                onClick={() => setAddOpen(false)}
              />
              <div
                className="absolute right-0 top-full z-20 mt-1 max-h-48 w-56 overflow-y-auto rounded-lg py-1 shadow-lg"
                style={{
                  background: "var(--admin-surface)",
                  border: "1px solid var(--admin-border)",
                }}
              >
                {toAdd.map((s) => (
                  <label
                    key={s.id}
                    className="flex items-center gap-2 px-3 py-2 text-sm"
                  >
                    <input
                      type="checkbox"
                      checked={selected.includes(s.id)}
                      onChange={() =>
                        setSelected((prev) =>
                          prev.includes(s.id)
                            ? prev.filter((x) => x !== s.id)
                            : [...prev, s.id],
                        )
                      }
                    />
                    {s.name}
                  </label>
                ))}
                <button
                  type="button"
                  disabled={!selected.length || loading}
                  onClick={() => void handleAdd()}
                  className="mx-2 mb-2 mt-1 w-[calc(100%-16px)] rounded py-1.5 text-xs font-semibold text-white disabled:opacity-50"
                  style={{ background: "var(--admin-primary)" }}
                >
                  Add members
                </button>
              </div>
            </>
          )}
          </div>
        )}
      </div>
    </div>
  );
}
