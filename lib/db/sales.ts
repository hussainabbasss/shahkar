import { mapSale, type DbSale } from "@/lib/db/mappers";
import { SEED_ACTIVE_SALE } from "@/lib/data/seed-sale";
import { createServerClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import type { Sale } from "@/lib/types";

function seedActiveSale(): Sale | null {
  const sale = SEED_ACTIVE_SALE;
  if (!sale.active) return null;
  if (new Date(sale.endDate).getTime() <= Date.now()) return null;
  if (new Date(sale.startDate).getTime() > Date.now()) return null;
  return sale;
}

export async function getActiveSale(): Promise<Sale | null> {
  if (!isSupabaseConfigured()) return seedActiveSale();

  const supabase = createServerClient()!;
  const now = new Date().toISOString();

  const { data, error } = await supabase
    .from("sales")
    .select("*")
    .eq("active", true)
    .lte("start_date", now)
    .gte("end_date", now)
    .order("start_date", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error || !data) return seedActiveSale();
  return mapSale(data as DbSale);
}
