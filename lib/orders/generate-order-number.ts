const MAX_ATTEMPTS = 3;

export function generateOrderNumberCandidate(): string {
  const digits = Math.floor(100000 + Math.random() * 900000);
  return `SHA-${digits}`;
}

export async function generateUniqueOrderNumber(): Promise<string> {
  const { createAdminClient } = await import("@/lib/supabase/admin");
  const { isSupabaseConfigured } = await import("@/lib/supabase/config");

  for (let attempt = 0; attempt < MAX_ATTEMPTS; attempt++) {
    const candidate = generateOrderNumberCandidate();

    if (!isSupabaseConfigured()) return candidate;

    const supabase = createAdminClient()!;
    const { data } = await supabase
      .from("orders")
      .select("id")
      .eq("order_number", candidate)
      .maybeSingle();

    if (!data) return candidate;
  }

  throw new Error("Order number generation failed after max attempts");
}
