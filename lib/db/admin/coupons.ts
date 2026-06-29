import { mapCoupon, type DbCoupon } from "@/lib/db/mappers";
import { createAdminClient } from "@/lib/supabase/admin";
import type { Coupon } from "@/lib/types";

function requireAdmin() {
  const supabase = createAdminClient();
  if (!supabase) throw new Error("Supabase not configured");
  return supabase;
}

export type CouponInput = {
  code: string;
  discountType: "percentage" | "fixed";
  discountValue: number;
  minOrder: number | null;
  usageLimit: number | null;
  perUserLimit: number;
  expiryDate: string | null;
  active: boolean;
};

export async function listCouponsAdmin(): Promise<Coupon[]> {
  const supabase = requireAdmin();
  const { data, error } = await supabase
    .from("coupons")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) throw new Error(error.message);
  return (data as DbCoupon[]).map(mapCoupon);
}

export async function getCouponByIdAdmin(id: string): Promise<Coupon | null> {
  const supabase = requireAdmin();
  const { data, error } = await supabase
    .from("coupons")
    .select("*")
    .eq("id", id)
    .maybeSingle();

  if (error) throw new Error(error.message);
  if (!data) return null;
  return mapCoupon(data as DbCoupon);
}

export async function createCouponAdmin(input: CouponInput): Promise<Coupon> {
  const supabase = requireAdmin();
  const { data, error } = await supabase
    .from("coupons")
    .insert({
      code: input.code.toUpperCase(),
      discount_type: input.discountType,
      discount_value: input.discountValue,
      min_order: input.minOrder,
      usage_limit: input.usageLimit,
      per_user_limit: input.perUserLimit,
      expiry_date: input.expiryDate,
      active: input.active,
    })
    .select()
    .single();

  if (error) throw new Error(error.message);
  return mapCoupon(data as DbCoupon);
}

export async function updateCouponAdmin(
  id: string,
  input: CouponInput,
): Promise<Coupon> {
  const supabase = requireAdmin();
  const { data, error } = await supabase
    .from("coupons")
    .update({
      code: input.code.toUpperCase(),
      discount_type: input.discountType,
      discount_value: input.discountValue,
      min_order: input.minOrder,
      usage_limit: input.usageLimit,
      per_user_limit: input.perUserLimit,
      expiry_date: input.expiryDate,
      active: input.active,
    })
    .eq("id", id)
    .select()
    .single();

  if (error) throw new Error(error.message);
  return mapCoupon(data as DbCoupon);
}

export async function deleteCouponAdmin(id: string): Promise<void> {
  const supabase = requireAdmin();
  const { error } = await supabase.from("coupons").delete().eq("id", id);
  if (error) throw new Error(error.message);
}

export async function countActiveCoupons(): Promise<number> {
  const supabase = requireAdmin();
  const { count, error } = await supabase
    .from("coupons")
    .select("*", { count: "exact", head: true })
    .eq("active", true);

  if (error) throw new Error(error.message);
  return count ?? 0;
}
