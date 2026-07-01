import { mapProduct, type DbProduct } from "@/lib/db/mappers";
import { createAdminClient } from "@/lib/supabase/admin";
import type { Product } from "@/lib/types";

export type ProductInput = {
  name: string;
  slug: string;
  description: string;
  features: string[];
  images: string[];
  category: string;
  originalPrice: number;
  salePrice: number | null;
  stock: number;
  featured: boolean;
  active: boolean;
};

function requireAdmin() {
  const supabase = createAdminClient();
  if (!supabase) throw new Error("Supabase not configured");
  return supabase;
}

export async function listAllProductsAdmin(): Promise<Product[]> {
  const supabase = requireAdmin();
  const { data, error } = await supabase
    .from("products")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) throw new Error(error.message);
  return (data as DbProduct[]).map(mapProduct);
}

export async function getProductByIdAdmin(id: string): Promise<Product | null> {
  const supabase = requireAdmin();
  const { data, error } = await supabase
    .from("products")
    .select("*")
    .eq("id", id)
    .maybeSingle();

  if (error) throw new Error(error.message);
  if (!data) return null;
  return mapProduct(data as DbProduct);
}

export async function createProductAdmin(input: ProductInput): Promise<Product> {
  const supabase = requireAdmin();
  const { data, error } = await supabase
    .from("products")
    .insert({
      name: input.name,
      slug: input.slug,
      description: input.description,
      features: input.features,
      images: input.images,
      category: input.category,
      original_price: input.originalPrice,
      sale_price: input.salePrice,
      stock: input.stock,
      featured: input.featured,
      active: input.active,
    })
    .select()
    .single();

  if (error) throw new Error(error.message);
  return mapProduct(data as DbProduct);
}

export async function updateProductAdmin(
  id: string,
  input: ProductInput,
  options?: { actorId?: string },
): Promise<Product> {
  const supabase = requireAdmin();

  const { data: existing } = await supabase
    .from("products")
    .select("stock")
    .eq("id", id)
    .maybeSingle();

  const previousStock = existing ? Number(existing.stock) : input.stock;

  const { data, error } = await supabase
    .from("products")
    .update({
      name: input.name,
      slug: input.slug,
      description: input.description,
      features: input.features,
      images: input.images,
      category: input.category,
      original_price: input.originalPrice,
      sale_price: input.salePrice,
      stock: input.stock,
      featured: input.featured,
      active: input.active,
    })
    .eq("id", id)
    .select()
    .single();

  if (error) throw new Error(error.message);

  const { notifyStockChange } = await import("@/lib/db/admin/ticket-automation");
  await notifyStockChange(id, previousStock, input.stock, options?.actorId);

  return mapProduct(data as DbProduct);
}

export async function deleteProductAdmin(id: string): Promise<void> {
  const supabase = requireAdmin();
  const { error } = await supabase.from("products").delete().eq("id", id);
  if (error) throw new Error(error.message);
}

export async function getLowStockProducts(
  threshold: number,
): Promise<Product[]> {
  const supabase = requireAdmin();
  const { data, error } = await supabase
    .from("products")
    .select("*")
    .lt("stock", threshold)
    .eq("active", true)
    .order("stock", { ascending: true });

  if (error) throw new Error(error.message);
  return (data as DbProduct[]).map(mapProduct);
}

export async function uploadProductImage(
  file: File,
): Promise<string> {
  const supabase = requireAdmin();
  const ext = file.name.split(".").pop() ?? "jpg";
  const path = `${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;

  const { error } = await supabase.storage
    .from("product-images")
    .upload(path, file, { contentType: file.type, upsert: false });

  if (error) throw new Error(error.message);

  const { data } = supabase.storage.from("product-images").getPublicUrl(path);
  return data.publicUrl;
}

export async function getAdminCategories(): Promise<string[]> {
  const supabase = requireAdmin();
  const { data, error } = await supabase
    .from("products")
    .select("category")
    .not("category", "is", null);

  if (error) throw new Error(error.message);
  const cats = new Set(
    (data ?? []).map((r) => r.category as string).filter(Boolean),
  );
  return Array.from(cats).sort();
}
