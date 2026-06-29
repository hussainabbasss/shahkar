import type { Sale } from "@/lib/types";

/** Active sale seed — replaced by Supabase in Module 02 */
export const SEED_ACTIVE_SALE: Sale = {
  id: "sale-1",
  name: "Eid Sale 🎉 — 20% Off Sab Products Pe!",
  discountType: "percentage",
  discountValue: 20,
  appliesTo: "all",
  productIds: [],
  categoryNames: [],
  couponCode: "EID20",
  startDate: new Date().toISOString(),
  endDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
  active: true,
};
