-- Shahkar.store — Module 02 initial schema

-- Products
CREATE TABLE IF NOT EXISTS products (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  slug text UNIQUE NOT NULL,
  description text,
  features text[] DEFAULT '{}',
  images text[] DEFAULT '{}',
  category text,
  original_price numeric NOT NULL,
  sale_price numeric,
  stock integer DEFAULT 0,
  featured boolean DEFAULT false,
  active boolean DEFAULT true,
  popular_score integer DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_products_slug ON products(slug);
CREATE INDEX IF NOT EXISTS idx_products_active_featured ON products(active, featured);
CREATE INDEX IF NOT EXISTS idx_products_category ON products(category);

-- Orders
CREATE TABLE IF NOT EXISTS orders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_number text UNIQUE NOT NULL,
  customer_name text NOT NULL,
  customer_phone text NOT NULL,
  city text NOT NULL,
  address text NOT NULL,
  instructions text,
  products jsonb NOT NULL,
  subtotal numeric NOT NULL,
  discount numeric DEFAULT 0,
  delivery_fee numeric DEFAULT 200,
  total numeric NOT NULL,
  coupon_code text,
  status text DEFAULT 'pending',
  postex_tracking text,
  notes text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_orders_order_number ON orders(order_number);
CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);

-- Sales
CREATE TABLE IF NOT EXISTS sales (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  discount_type text NOT NULL CHECK (discount_type IN ('percentage', 'fixed')),
  discount_value numeric NOT NULL,
  applies_to text NOT NULL CHECK (applies_to IN ('all', 'products', 'categories')),
  product_ids uuid[],
  category_names text[],
  display_coupon_code text,
  start_date timestamptz NOT NULL,
  end_date timestamptz NOT NULL,
  active boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_sales_active_dates ON sales(active, start_date, end_date);

-- Coupons
CREATE TABLE IF NOT EXISTS coupons (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code text UNIQUE NOT NULL,
  discount_type text NOT NULL CHECK (discount_type IN ('percentage', 'fixed')),
  discount_value numeric NOT NULL,
  min_order numeric,
  usage_limit integer,
  per_user_limit integer DEFAULT 1,
  uses_count integer DEFAULT 0,
  expiry_date timestamptz,
  active boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_coupons_code ON coupons(code);

-- Coupon usage
CREATE TABLE IF NOT EXISTS coupon_usage (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  coupon_id uuid REFERENCES coupons(id) ON DELETE CASCADE,
  customer_phone text NOT NULL,
  order_id uuid REFERENCES orders(id) ON DELETE SET NULL,
  used_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_coupon_usage_phone ON coupon_usage(customer_phone);

-- Carts
CREATE TABLE IF NOT EXISTS carts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id text UNIQUE NOT NULL,
  items jsonb DEFAULT '[]',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_carts_session_id ON carts(session_id);

-- RLS
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE sales ENABLE ROW LEVEL SECURITY;
ALTER TABLE coupons ENABLE ROW LEVEL SECURITY;
ALTER TABLE coupon_usage ENABLE ROW LEVEL SECURITY;
ALTER TABLE carts ENABLE ROW LEVEL SECURITY;

-- Products: public read active only
CREATE POLICY products_public_read ON products
  FOR SELECT USING (active = true);

-- Orders: no public access (server uses service role)
CREATE POLICY orders_no_public ON orders
  FOR ALL USING (false);

-- Sales: public read active in window
CREATE POLICY sales_public_read ON sales
  FOR SELECT USING (
    active = true
    AND now() >= start_date
    AND now() <= end_date
  );

-- Coupons: public read active non-expired
CREATE POLICY coupons_public_read ON coupons
  FOR SELECT USING (
    active = true
    AND (expiry_date IS NULL OR expiry_date > now())
  );

-- Coupon usage: no public access
CREATE POLICY coupon_usage_no_public ON coupon_usage
  FOR ALL USING (false);

-- Carts: access by session_id (anon key + matching header/cookie enforced in app layer)
CREATE POLICY carts_session_access ON carts
  FOR ALL USING (true)
  WITH CHECK (true);
