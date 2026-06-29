"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import {
  createCouponAction,
  updateCouponAction,
} from "@/app/actions/admin/coupons";
import { useToast } from "@/components/admin/ToastProvider";
import {
  AdminField,
  AdminFormSection,
  AdminPrimaryButton,
  adminInputClass,
} from "@/components/admin/AdminUI";
import type { Coupon } from "@/lib/types";

type CouponFormProps = {
  coupon?: Coupon;
};

function toLocalDatetime(iso: string | null | undefined): string {
  if (!iso) return "";
  const d = new Date(iso);
  const offset = d.getTimezoneOffset();
  const local = new Date(d.getTime() - offset * 60000);
  return local.toISOString().slice(0, 16);
}

export function CouponForm({ coupon }: CouponFormProps) {
  const router = useRouter();
  const { showToast } = useToast();
  const [code, setCode] = useState(coupon?.code ?? "");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    const fd = new FormData(e.currentTarget);
    fd.set("code", code.toUpperCase());

    const result = coupon
      ? await updateCouponAction(coupon.id, fd)
      : await createCouponAction(fd);

    setLoading(false);
    if (result.success) {
      showToast(coupon ? "Coupon updated" : "Coupon created");
      router.push("/admin/coupons");
      router.refresh();
    } else {
      showToast(result.error, "error");
    }
  }

  return (
    <form onSubmit={handleSubmit} className="mx-auto max-w-2xl space-y-6">
      <AdminFormSection title="Coupon Details">
        <AdminField label="Code" hint="Auto uppercased">
          <input
            name="code"
            required
            value={code}
            onChange={(e) => setCode(e.target.value.toUpperCase())}
            className={`${adminInputClass} font-mono uppercase`}
            placeholder="EID20"
          />
        </AdminField>
        <div className="grid gap-4 sm:grid-cols-2">
          <AdminField label="Discount Type">
            <select
              name="discountType"
              defaultValue={coupon?.discountType ?? "percentage"}
              className={adminInputClass}
            >
              <option value="percentage">Percentage (%)</option>
              <option value="fixed">Fixed Amount (Rs.)</option>
            </select>
          </AdminField>
          <AdminField label="Discount Value">
            <input
              name="discountValue"
              type="number"
              required
              min={0}
              defaultValue={coupon?.discountValue ?? ""}
              className={adminInputClass}
            />
          </AdminField>
        </div>
        <AdminField label="Minimum Order (Rs.) — optional">
          <input
            name="minOrder"
            type="number"
            min={0}
            defaultValue={coupon?.minOrder ?? ""}
            className={adminInputClass}
          />
        </AdminField>
        <div className="grid gap-4 sm:grid-cols-2">
          <AdminField label="Usage Limit — optional">
            <input
              name="usageLimit"
              type="number"
              min={1}
              defaultValue={coupon?.usageLimit ?? ""}
              className={adminInputClass}
              placeholder="e.g. 100"
            />
          </AdminField>
          <AdminField label="Per User Limit">
            <input
              name="perUserLimit"
              type="number"
              min={1}
              defaultValue={coupon?.perUserLimit ?? 1}
              className={adminInputClass}
            />
          </AdminField>
        </div>
        <AdminField label="Expiry Date — optional">
          <input
            name="expiryDate"
            type="datetime-local"
            defaultValue={toLocalDatetime(coupon?.expiryDate)}
            className={adminInputClass}
          />
        </AdminField>
        <label className="flex items-center gap-2 text-sm">
          <input
            name="active"
            type="checkbox"
            defaultChecked={coupon?.active ?? true}
            className="rounded border-border"
          />
          Active
        </label>
      </AdminFormSection>

      <div className="flex gap-3">
        <AdminPrimaryButton type="submit" disabled={loading}>
          {loading ? "Saving…" : coupon ? "Save Changes" : "Create Coupon"}
        </AdminPrimaryButton>
        <a href="/admin/coupons" className="rounded-lg border border-border px-4 py-2 text-sm">
          Cancel
        </a>
      </div>
    </form>
  );
}
