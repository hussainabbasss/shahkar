"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { updateOrderStatusAction } from "@/app/actions/admin/auth";
import { StatusDropdown } from "@/components/admin/StatusDropdown";
import type { OrderStatus } from "@/lib/types";

type OrderStatusSelectProps = {
  orderNumber: string;
  currentStatus: OrderStatus;
};

export function OrderStatusSelect({
  orderNumber,
  currentStatus,
}: OrderStatusSelectProps) {
  const router = useRouter();
  const [status, setStatus] = useState(currentStatus);
  const [loading, setLoading] = useState(false);

  async function handleChange(next: OrderStatus) {
    setStatus(next);
    setLoading(true);
    const result = await updateOrderStatusAction(orderNumber, next);
    setLoading(false);
    if (result.success) router.refresh();
    else setStatus(currentStatus);
  }

  return (
    <StatusDropdown value={status} onChange={handleChange} loading={loading} />
  );
}
