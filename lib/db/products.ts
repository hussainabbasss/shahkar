import { PRODUCTS_PER_PAGE } from "@/lib/constants";
import { mapProduct, type DbProduct } from "@/lib/db/mappers";
import { createServerClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { SEED_PRODUCTS } from "@/lib/data/seed-products";
import type {
  Product,
  ProductSortOption,
  ProductsQuery,
  ProductsResult,
  ProductWithRelated,
} from "@/lib/types";

function sortProducts(products: Product[], sort: ProductSortOption): Product[] {
  const sorted = [...products];
  switch (sort) {
    case "price-asc":
      return sorted.sort(
        (a, b) =>
          (a.salePrice ?? a.originalPrice) - (b.salePrice ?? b.originalPrice),
      );
    case "price-desc":
      return sorted.sort(
        (a, b) =>
          (b.salePrice ?? b.originalPrice) - (a.salePrice ?? a.originalPrice),
      );
    case "popular":
      return sorted.sort((a, b) => b.popularScore - a.popularScore);
    case "new":
    default:
      return sorted.sort(
        (a, b) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
      );
  }
}

function seedFallback(): Product[] {
  return SEED_PRODUCTS.filter((p) => p.active);
}

async function fetchActiveProducts(): Promise<Product[]> {
  if (!isSupabaseConfigured()) return seedFallback();

  const supabase = createServerClient()!;
  const { data, error } = await supabase
    .from("products")
    .select("*")
    .eq("active", true);

  if (error || !data?.length) return seedFallback();
  return (data as DbProduct[]).map(mapProduct);
}

export async function getCategories(): Promise<string[]> {
  const products = await fetchActiveProducts();
  return Array.from(new Set(products.map((p) => p.category))).sort();
}

export async function getFeaturedProducts(): Promise<Product[]> {
  if (!isSupabaseConfigured()) {
    return seedFallback()
      .filter((p) => p.featured)
      .slice(0, 6);
  }

  const supabase = createServerClient()!;
  const { data, error } = await supabase
    .from("products")
    .select("*")
    .eq("active", true)
    .eq("featured", true)
    .limit(6);

  if (error || !data?.length) {
    return seedFallback()
      .filter((p) => p.featured)
      .slice(0, 6);
  }
  return (data as DbProduct[]).map(mapProduct);
}

export async function getProducts(
  query: ProductsQuery = {},
): Promise<ProductsResult> {
  const {
    page = 1,
    limit = PRODUCTS_PER_PAGE,
    category = null,
    sort = "new",
  } = query;

  let products = await fetchActiveProducts();
  if (category) {
    products = products.filter((p) => p.category === category);
  }
  products = sortProducts(products, sort);

  const total = products.length;
  const totalPages = Math.max(1, Math.ceil(total / limit));
  const start = (page - 1) * limit;

  return {
    products: products.slice(start, start + limit),
    total,
    page,
    totalPages,
    categories: await getCategories(),
  };
}

export async function getProductBySlug(
  slug: string,
): Promise<Product | null> {
  if (!isSupabaseConfigured()) {
    return seedFallback().find((p) => p.slug === slug) ?? null;
  }

  const supabase = createServerClient()!;
  const { data, error } = await supabase
    .from("products")
    .select("*")
    .eq("slug", slug)
    .eq("active", true)
    .maybeSingle();

  if (error || !data) {
    return seedFallback().find((p) => p.slug === slug) ?? null;
  }
  return mapProduct(data as DbProduct);
}

export async function getProductWithRelated(
  slug: string,
): Promise<ProductWithRelated | null> {
  const product = await getProductBySlug(slug);
  if (!product) return null;

  const all = await fetchActiveProducts();
  const related = all
    .filter((p) => p.id !== product.id && p.category === product.category)
    .slice(0, 4);

  const fallbackRelated =
    related.length > 0
      ? related
      : all.filter((p) => p.id !== product.id && p.featured).slice(0, 4);

  return { product, related: fallbackRelated };
}

export async function getProductsByIds(ids: string[]): Promise<Product[]> {
  if (!ids.length) return [];
  const all = await fetchActiveProducts();
  return ids
    .map((id) => all.find((p) => p.id === id))
    .filter((p): p is Product => Boolean(p));
}

export async function decrementStock(
  productId: string,
  quantity: number,
): Promise<boolean> {
  if (!isSupabaseConfigured()) return true;

  const { createAdminClient } = await import("@/lib/supabase/admin");
  const supabase = createAdminClient()!;

  const { data: product } = await supabase
    .from("products")
    .select("stock")
    .eq("id", productId)
    .single();

  if (!product || product.stock < quantity) return false;

  const { error } = await supabase
    .from("products")
    .update({ stock: product.stock - quantity })
    .eq("id", productId)
    .gte("stock", quantity);

  return !error;
}
