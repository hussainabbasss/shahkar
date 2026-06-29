export type Product = {
  id: string;
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
  createdAt: string;
  popularScore: number;
};

export type Sale = {
  id: string;
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

export type Coupon = {
  id: string;
  code: string;
  discountType: "percentage" | "fixed";
  discountValue: number;
  minOrder: number | null;
  usageLimit: number | null;
  perUserLimit: number;
  usesCount: number;
  expiryDate: string | null;
  active: boolean;
};

export type OrderSource = "storefront" | "manual";

export type OrderStatus =
  | "pending"
  | "confirmed"
  | "dispatched"
  | "delivered"
  | "returned";

export type OrderProductLine = {
  product_id: string;
  name: string;
  slug: string;
  price: number;
  quantity: number;
  image: string;
};

export type Order = {
  id: string;
  orderNumber: string;
  customerName: string;
  customerPhone: string;
  city: string;
  address: string;
  instructions: string | null;
  products: OrderProductLine[];
  subtotal: number;
  discount: number;
  deliveryFee: number;
  total: number;
  couponCode: string | null;
  status: OrderStatus;
  postexTracking: string | null;
  notes: string | null;
  source: OrderSource;
  createdBy: string | null;
  createdAt: string;
  updatedAt?: string;
};

export type OrderWithCreator = Order & {
  creatorName: string | null;
};

export type ManualOrderLineInput = {
  productId: string;
  quantity: number;
};

export type CreateManualOrderInput = {
  customerName: string;
  customerPhone: string;
  city: string;
  address: string;
  instructions?: string;
  items: ManualOrderLineInput[];
  couponCode?: string;
  status?: OrderStatus;
  deliveryFee?: number;
};

export type Testimonial = {
  id: string;
  name: string;
  city: string;
  rating: number;
  text: string;
};

export type ProductSortOption = "new" | "price-asc" | "price-desc" | "popular";

export type ProductDisplayPrice = {
  currentPrice: number;
  originalPrice: number;
  onSale: boolean;
};

export type CartItem = {
  productId: string;
  slug: string;
  name: string;
  price: number;
  image: string;
  quantity: number;
  addedAt?: string;
};

export type ProductsQuery = {
  page?: number;
  limit?: number;
  category?: string | null;
  sort?: ProductSortOption;
};

export type ProductsResult = {
  products: Product[];
  total: number;
  page: number;
  totalPages: number;
  categories: string[];
};

export type ProductWithRelated = {
  product: Product;
  related: Product[];
};

export type CouponValidationResult =
  | { valid: true; discount: number; code: string }
  | { valid: false; error: string };

export type CreateOrderInput = {
  customerName: string;
  customerPhone: string;
  city: string;
  address: string;
  instructions?: string;
  items: CartItem[];
  couponCode?: string;
};

export type CreateOrderResult =
  | { success: true; orderNumber: string }
  | { success: false; error: string };
