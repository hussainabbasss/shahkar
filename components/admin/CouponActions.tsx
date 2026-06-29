"use client";

import { useRouter } from "next/navigation";
import {
  deactivateCouponAction,
  deleteCouponAction,
} from "@/app/actions/admin/coupons";
import { ConfirmDialog } from "@/components/admin/ConfirmDialog";
import { useToast } from "@/components/admin/ToastProvider";

export function CouponActions({ id, active }: { id: string; active: boolean }) {
  const router = useRouter();
  const { showToast } = useToast();

  return (
    <div className="flex gap-2">
      {active && (
        <button
          type="button"
          onClick={async () => {
            const result = await deactivateCouponAction(id);
            if (result.success) {
              showToast("Coupon deactivated");
              router.refresh();
            } else showToast(result.error, "error");
          }}
          className="text-sm text-accent hover:underline"
        >
          Deactivate
        </button>
      )}
      <ConfirmDialog
        title="Delete Coupon"
        message="This will permanently delete the coupon."
        triggerLabel="Delete"
        onConfirm={async () => {
          const result = await deleteCouponAction(id);
          if (result.success) {
            showToast("Coupon deleted");
            router.refresh();
          } else showToast(result.error, "error");
        }}
      />
    </div>
  );
}
