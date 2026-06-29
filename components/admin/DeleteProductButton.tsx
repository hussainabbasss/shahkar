"use client";

import { useRouter } from "next/navigation";
import { deleteProductAction } from "@/app/actions/admin/products";
import { ConfirmDialog } from "@/components/admin/ConfirmDialog";
import { useToast } from "@/components/admin/ToastProvider";

export function DeleteProductButton({ id }: { id: string }) {
  const router = useRouter();
  const { showToast } = useToast();

  return (
    <ConfirmDialog
      title="Delete Product"
      message="This will remove the product from the storefront. This action cannot be undone."
      triggerLabel="Delete"
      onConfirm={async () => {
        const result = await deleteProductAction(id);
        if (result.success) {
          showToast("Product deleted");
          router.refresh();
        } else {
          showToast(result.error, "error");
        }
      }}
    />
  );
}
