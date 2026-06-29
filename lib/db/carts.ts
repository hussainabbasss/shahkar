import { createAdminClient } from "@/lib/supabase/admin";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import type { CartItem } from "@/lib/types";

export type StoredCartItem = {
  product_id: string;
  quantity: number;
  added_at: string;
};

export async function getCartBySession(
  sessionId: string,
): Promise<CartItem[] | null> {
  if (!isSupabaseConfigured()) return null;

  const supabase = createAdminClient()!;
  const { data, error } = await supabase
    .from("carts")
    .select("items")
    .eq("session_id", sessionId)
    .maybeSingle();

  if (error || !data?.items) return null;
  return data.items as unknown as CartItem[];
}

export async function upsertCart(
  sessionId: string,
  items: StoredCartItem[],
): Promise<void> {
  if (!isSupabaseConfigured()) return;

  const supabase = createAdminClient()!;
  await supabase.from("carts").upsert(
    {
      session_id: sessionId,
      items,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "session_id" },
  );
}

export async function deleteCart(sessionId: string): Promise<void> {
  if (!isSupabaseConfigured()) return;

  const supabase = createAdminClient()!;
  await supabase.from("carts").delete().eq("session_id", sessionId);
}
