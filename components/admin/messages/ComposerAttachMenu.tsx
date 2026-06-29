"use client";

import { useRef, useState } from "react";
import { Package, Paperclip, Plus, Receipt } from "lucide-react";

type ComposerAttachMenuProps = {
  canShareProducts: boolean;
  canShareOrders: boolean;
  onAttachFile: (file: File) => void;
  onShareProduct: () => void;
  onShareOrder: () => void;
  disabled?: boolean;
};

export function ComposerAttachMenu({
  canShareProducts,
  canShareOrders,
  onAttachFile,
  onShareProduct,
  onShareOrder,
  disabled,
}: ComposerAttachMenuProps) {
  const [open, setOpen] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  return (
    <div className="relative">
      <button
        type="button"
        disabled={disabled}
        onClick={() => setOpen((v) => !v)}
        className="flex h-10 w-10 items-center justify-center rounded-lg transition-colors"
        style={{
          border: "1px solid var(--admin-border)",
          color: "var(--admin-text-muted)",
        }}
        aria-label="Attach"
      >
        <Plus size={18} />
      </button>

      {open && (
        <>
          <div
            className="fixed inset-0 z-10"
            onClick={() => setOpen(false)}
          />
          <div
            className="absolute bottom-full left-0 z-20 mb-2 min-w-[180px] rounded-lg py-1 shadow-lg"
            style={{
              background: "var(--admin-surface)",
              border: "1px solid var(--admin-border)",
            }}
          >
            <button
              type="button"
              className="flex w-full items-center gap-2 px-4 py-2.5 text-sm hover:bg-[color-mix(in_srgb,var(--admin-primary)_6%,transparent)]"
              onClick={() => {
                fileRef.current?.click();
                setOpen(false);
              }}
            >
              <Paperclip size={16} />
              Attachment
            </button>
            {canShareProducts && (
              <button
                type="button"
                className="flex w-full items-center gap-2 px-4 py-2.5 text-sm hover:bg-[color-mix(in_srgb,var(--admin-primary)_6%,transparent)]"
                onClick={() => {
                  onShareProduct();
                  setOpen(false);
                }}
              >
                <Package size={16} />
                Product
              </button>
            )}
            {canShareOrders && (
              <button
                type="button"
                className="flex w-full items-center gap-2 px-4 py-2.5 text-sm hover:bg-[color-mix(in_srgb,var(--admin-primary)_6%,transparent)]"
                onClick={() => {
                  onShareOrder();
                  setOpen(false);
                }}
              >
                <Receipt size={16} />
                Order
              </button>
            )}
          </div>
        </>
      )}

      <input
        ref={fileRef}
        type="file"
        className="hidden"
        accept="image/jpeg,image/png,image/webp,image/gif,.pdf,.doc,.docx,.xls,.xlsx"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) onAttachFile(file);
          e.target.value = "";
        }}
      />
    </div>
  );
}
