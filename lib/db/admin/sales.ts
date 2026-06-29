import { mapSale, type DbSale } from "@/lib/db/mappers";
import { createAdminClient } from "@/lib/supabase/admin";
import type { Sale } from "@/lib/types";

function requireAdmin() {
  const supabase = createAdminClient();
  if (!supabase) throw new Error("Supabase not configured");
  return supabase;
}

export type SaleInput = {
  name: string;
  discountType: "percentage" | "fixed";
  discountValue: number;
  appliesTo: "all" | "products" | "categories";
  productIds: string[];
  categoryNames: string[];
  couponCode: string | null;
  startDate: string;
  endDate: string;
  active: boolean;
};

export async function listSalesAdmin(): Promise<Sale[]> {
  const supabase = requireAdmin();
  const { data, error } = await supabase
    .from("sales")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) throw new Error(error.message);
  return (data as DbSale[]).map(mapSale);
}

export async function getSaleByIdAdmin(id: string): Promise<Sale | null> {
  const supabase = requireAdmin();
  const { data, error } = await supabase
    .from("sales")
    .select("*")
    .eq("id", id)
    .maybeSingle();

  if (error) throw new Error(error.message);
  if (!data) return null;
  return mapSale(data as DbSale);
}

export async function createSaleAdmin(input: SaleInput): Promise<Sale> {
  const supabase = requireAdmin();
  const { data, error } = await supabase
    .from("sales")
    .insert({
      name: input.name,
      discount_type: input.discountType,
      discount_value: input.discountValue,
      applies_to: input.appliesTo,
      product_ids: input.productIds.length ? input.productIds : null,
      category_names: input.categoryNames.length ? input.categoryNames : null,
      display_coupon_code: input.couponCode,
      start_date: input.startDate,
      end_date: input.endDate,
      active: input.active,
    })
    .select()
    .single();

  if (error) throw new Error(error.message);
  return mapSale(data as DbSale);
}

export async function updateSaleAdmin(
  id: string,
  input: SaleInput,
): Promise<Sale> {
  const supabase = requireAdmin();
  const { data, error } = await supabase
    .from("sales")
    .update({
      name: input.name,
      discount_type: input.discountType,
      discount_value: input.discountValue,
      applies_to: input.appliesTo,
      product_ids: input.productIds.length ? input.productIds : null,
      category_names: input.categoryNames.length ? input.categoryNames : null,
      display_coupon_code: input.couponCode,
      start_date: input.startDate,
      end_date: input.endDate,
      active: input.active,
    })
    .eq("id", id)
    .select()
    .single();

  if (error) throw new Error(error.message);
  return mapSale(data as DbSale);
}

export async function deleteSaleAdmin(id: string): Promise<void> {
  const supabase = requireAdmin();
  const { error } = await supabase.from("sales").delete().eq("id", id);
  if (error) throw new Error(error.message);
}

export async function duplicateSaleAdmin(id: string): Promise<Sale> {
  const sale = await getSaleByIdAdmin(id);
  if (!sale) throw new Error("Sale not found");

  return createSaleAdmin({
    name: `${sale.name} (Copy)`,
    discountType: sale.discountType,
    discountValue: sale.discountValue,
    appliesTo: sale.appliesTo,
    productIds: sale.productIds,
    categoryNames: sale.categoryNames,
    couponCode: sale.couponCode,
    startDate: sale.startDate,
    endDate: sale.endDate,
    active: false,
  });
}
