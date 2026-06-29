import { mapCoupon, type DbCoupon } from "@/lib/db/mappers";
import { createAdminClient } from "@/lib/supabase/admin";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import type { Coupon } from "@/lib/types";

export { getOrderByNumber, insertOrder } from "@/lib/db/orders";

export async function getCouponByCode(code: string): Promise<Coupon | null> {
  if (!isSupabaseConfigured()) {
    return getSeedCoupon(code);
  }

  const supabase = createAdminClient()!;
  const { data, error } = await supabase
    .from("coupons")
    .select("*")
    .eq("code", code.toUpperCase())
    .maybeSingle();

  if (error || !data) return getSeedCoupon(code);
  return mapCoupon(data as DbCoupon);
}

function getSeedCoupon(code: string): Coupon | null {
  if (code.toUpperCase() !== "EID20") return null;
  return {
    id: "seed-coupon-eid20",
    code: "EID20",
    discountType: "percentage",
    discountValue: 20,
    minOrder: 500,
    usageLimit: 1000,
    perUserLimit: 1,
    usesCount: 0,
    expiryDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
    active: true,
  };
}

export async function countCouponUsageByPhone(
  couponId: string,
  phone: string,
): Promise<number> {
  if (!isSupabaseConfigured()) return 0;

  const supabase = createAdminClient()!;
  const { count, error } = await supabase
    .from("coupon_usage")
    .select("*", { count: "exact", head: true })
    .eq("coupon_id", couponId)
    .eq("customer_phone", phone);

  if (error) return 0;
  return count ?? 0;
}

export async function recordCouponUsage(
  couponId: string,
  phone: string,
  orderId: string,
): Promise<void> {
  if (!isSupabaseConfigured()) return;

  const supabase = createAdminClient()!;

  await supabase.from("coupon_usage").insert({
    coupon_id: couponId,
    customer_phone: phone,
    order_id: orderId,
  });

  const { data: coupon } = await supabase
    .from("coupons")
    .select("uses_count")
    .eq("id", couponId)
    .single();

  if (coupon) {
    await supabase
      .from("coupons")
      .update({ uses_count: coupon.uses_count + 1 })
      .eq("id", couponId);
  }
}
