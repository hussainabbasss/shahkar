import type { Coupon, Order, Product, Sale } from "@/lib/types";

export type DbProduct = {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  features: string[] | null;
  images: string[] | null;
  category: string | null;
  original_price: number;
  sale_price: number | null;
  stock: number;
  featured: boolean;
  active: boolean;
  popular_score: number | null;
  created_at: string;
};

export type DbSale = {
  id: string;
  name: string;
  discount_type: "percentage" | "fixed";
  discount_value: number;
  applies_to: "all" | "products" | "categories";
  product_ids: string[] | null;
  category_names: string[] | null;
  display_coupon_code: string | null;
  start_date: string;
  end_date: string;
  active: boolean;
};

export type DbCoupon = {
  id: string;
  code: string;
  discount_type: "percentage" | "fixed";
  discount_value: number;
  min_order: number | null;
  usage_limit: number | null;
  per_user_limit: number | null;
  uses_count: number;
  expiry_date: string | null;
  active: boolean;
};

export type DbOrder = {
  id: string;
  order_number: string;
  customer_name: string;
  customer_phone: string;
  city: string;
  address: string;
  instructions: string | null;
  products: OrderProductSnapshot[];
  subtotal: number;
  discount: number;
  delivery_fee: number;
  total: number;
  coupon_code: string | null;
  status: string;
  postex_tracking: string | null;
  notes: string | null;
  source?: string;
  created_by?: string | null;
  created_at: string;
  updated_at?: string;
};

export type OrderProductSnapshot = {
  product_id: string;
  name: string;
  slug: string;
  price: number;
  quantity: number;
  image: string;
};

export function mapProduct(row: DbProduct): Product {
  return {
    id: row.id,
    name: row.name,
    slug: row.slug,
    description: row.description ?? "",
    features: row.features ?? [],
    images: row.images ?? [],
    category: row.category ?? "",
    originalPrice: Number(row.original_price),
    salePrice: row.sale_price !== null ? Number(row.sale_price) : null,
    stock: row.stock,
    featured: row.featured,
    active: row.active,
    popularScore: row.popular_score ?? 0,
    createdAt: row.created_at,
  };
}

export function mapSale(row: DbSale): Sale {
  return {
    id: row.id,
    name: row.name,
    discountType: row.discount_type,
    discountValue: Number(row.discount_value),
    appliesTo: row.applies_to,
    productIds: row.product_ids ?? [],
    categoryNames: row.category_names ?? [],
    couponCode: row.display_coupon_code,
    startDate: row.start_date,
    endDate: row.end_date,
    active: row.active,
  };
}

export function mapCoupon(row: DbCoupon): Coupon {
  return {
    id: row.id,
    code: row.code,
    discountType: row.discount_type,
    discountValue: Number(row.discount_value),
    minOrder: row.min_order !== null ? Number(row.min_order) : null,
    usageLimit: row.usage_limit,
    perUserLimit: row.per_user_limit ?? 1,
    usesCount: row.uses_count,
    expiryDate: row.expiry_date,
    active: row.active,
  };
}

export function mapOrder(row: DbOrder): Order {
  return {
    id: row.id,
    orderNumber: row.order_number,
    customerName: row.customer_name,
    customerPhone: row.customer_phone,
    city: row.city,
    address: row.address,
    instructions: row.instructions,
    products: row.products,
    subtotal: Number(row.subtotal),
    discount: Number(row.discount),
    deliveryFee: Number(row.delivery_fee),
    total: Number(row.total),
    couponCode: row.coupon_code,
    status: row.status as Order["status"],
    postexTracking: row.postex_tracking,
    notes: row.notes,
    source: (row.source ?? "storefront") as Order["source"],
    createdBy: row.created_by ?? null,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}
