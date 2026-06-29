"use client";

import { useRouter } from "next/navigation";
import { deleteSaleAction, duplicateSaleAction } from "@/app/actions/admin/sales";
import { ConfirmDialog } from "@/components/admin/ConfirmDialog";
import { useToast } from "@/components/admin/ToastProvider";

export function SaleActions({ id }: { id: string }) {
  const router = useRouter();
  const { showToast } = useToast();

  return (
    <div className="flex gap-2">
      <button
        type="button"
        onClick={async () => {
          const result = await duplicateSaleAction(id);
          if (result.success) {
            showToast("Sale duplicated");
            router.refresh();
          } else showToast(result.error, "error");
        }}
        className="text-sm text-primary hover:underline"
      >
        Duplicate
      </button>
      <ConfirmDialog
        title="Delete Sale"
        message="This will remove the sale from the storefront."
        triggerLabel="Delete"
        onConfirm={async () => {
          const result = await deleteSaleAction(id);
          if (result.success) {
            showToast("Sale deleted");
            router.refresh();
          } else showToast(result.error, "error");
        }}
      />
    </div>
  );
}
