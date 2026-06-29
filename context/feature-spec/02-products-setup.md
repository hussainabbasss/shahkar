# Feature Spec — 02 Products, Cart & Checkout (Server + Data Layer)

**Module:** Product commerce flow, Supabase, API routes, server-side data  
**Version:** 1.0  
**Last Updated:** June 29, 2026  
**References:** `context/project-overview.md` §5–8, §10–11, `context/ui-context.md`

---

## What This Module Is

Everything that makes the store **work** beyond static UI: product pages, cart, checkout, order creation, Supabase database, Next.js API/server actions, and all **server-side data fetching** that feeds the landing page (Module 01) and admin panel (Module 03). This is the backbone — products, orders, carts, coupons, and sales logic live here.

---

## Routes

| Route | Purpose |
|---|---|
| `/products` | All products listing (optional v1 — homepage may suffice) |
| `/products/[slug]` | Single product detail page |
| `/cart` | Shopping cart |
| `/checkout` | Checkout form + order submission |
| `/order/[orderNumber]` | Order confirmation |

---

## Architecture Overview

```
┌─────────────────────────────────────────────────────────┐
│                    Next.js App Router                    │
├─────────────────────────────────────────────────────────┤
│  Server Components          │  Client Components        │
│  - Product data fetch       │  - CartProvider           │
│  - Sale price calculation   │  - Add to cart actions    │
│  - Order creation (action)  │  - Countdown timer        │
│  - Coupon validation        │  - Quantity controls      │
├─────────────────────────────────────────────────────────┤
│              API Routes / Server Actions                 │
│  /api/cart  /api/orders  /api/coupons/validate          │
├─────────────────────────────────────────────────────────┤
│                    Supabase (PostgreSQL)                 │
│  products · orders · sales · coupons · coupon_usage     │
│  carts                                                  │
└─────────────────────────────────────────────────────────┘
         ▲                              ▲
         │                              │
   Module 01 (read)              Module 03 (CRUD)
```

---

## Components Overview

### Product Detail Page (`/products/[slug]`)

| Component | Responsibility | Design Notes |
|---|---|---|
| `ProductGallery` | Swipeable image gallery | Mobile: swipe gestures. Desktop: thumbnails + main image. Min 3 images. 1:1 aspect ratio. |
| `ProductInfo` | Name, price, sale badge | Sale price green bold; original strikethrough. Sale badge + countdown if on sale. |
| `ProductDescription` | Short description + feature bullets | Roman Urdu, scannable bullets ("5 heads included", etc.) |
| `ProductActions` | Add to cart + buy now | "Cart Mein Daalo" primary full-width. "Abhi Kharido" → checkout with this item. |
| `ProductTrust` | COD badge, delivery estimate, return policy | Trust layer 2 per ui-context §10 |
| `StickyAddToCartBar` | Mobile fixed bottom bar | Price + "Cart Mein Daalo" — ui-context §9 rule 1 |
| `RelatedProducts` | Bottom grid | Same `ProductCard` from Module 01, same category or featured |

---

### Cart Page (`/cart`)

| Component | Responsibility | Design Notes |
|---|---|---|
| `CartItemList` | Line items with qty controls | Image, name, unit price, quantity +/- , remove button |
| `CartEmptyState` | No items | "Abhi tak kuch nahi daala? 🛒 Products dekhein →" |
| `CouponInput` | Discount code field | "Discount Code Lagao" + Apply button |
| `OrderSummary` | Price breakdown | Subtotal, discount, delivery Rs. 200, total |
| `CheckoutButton` | Proceed to checkout | "Checkout Karein" → `/checkout` |
| `ContinueShoppingLink` | Back link | "Shopping Jari Rakho" → products |

---

### Checkout Page (`/checkout`)

| Component | Responsibility | Design Notes |
|---|---|---|
| `CheckoutForm` | Customer details | Max 5 fields: Full Name, Phone, City, Address, Special Instructions (optional) |
| `CheckoutSummary` | Order recap | Products, qty, subtotal, coupon discount, delivery, total |
| `CodPaymentBadge` | COD only payment | Prominent COD badge near total — no other payment methods v1 |
| `PlaceOrderButton` | Submit order | "Order Karein" — creates order in Supabase |
| `TrustReassurance` | Data safety copy | "Aapka data safe hai" near form |

**Form validation messages** — helpful Roman Urdu, never technical (ui-context §11.2).

---

### Order Confirmation (`/order/[orderNumber]`)

| Component | Responsibility | Design Notes |
|---|---|---|
| `OrderSuccessHeader` | Celebration moment | "Shukriya! Aapka Order Place Ho Gaya ✅" |
| `OrderNumberDisplay` | SHA-XXXXXX prominent | Large, copyable |
| `OrderSummary` | Items + totals | Same breakdown as checkout |
| `DeliveryEstimate` | 2–3 business days | Clear expectation setting |
| `WhatsAppSupport` | Query link | WhatsApp us for questions |
| `ContinueShoppingButton` | "Aur Shopping Karein" | Back to homepage/products |

---

### Server / Data Layer

| Layer | Files / Concerns |
|---|---|
| Supabase client | Server-side client (service role for writes), anon client for reads where appropriate |
| Database migrations | All tables per schema below |
| Data access | `lib/db/products.ts`, `lib/db/orders.ts`, `lib/db/carts.ts`, `lib/db/sales.ts`, `lib/db/coupons.ts` |
| Pricing engine | `lib/pricing.ts` — applies active sale discounts to product prices |
| Order number generator | `lib/orders/generate-order-number.ts` — SHA-XXXXXX, unique constraint |
| Cart sync | `lib/cart/` — localStorage (guest) + Supabase `carts` table merge on session |
| Server Actions | `createOrder`, `validateCoupon`, `updateCart` |
| API Routes (if needed) | REST endpoints for cart sync, coupon validation |

---

## Database Schema (Supabase)

```sql
-- Products
products (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  slug text UNIQUE NOT NULL,
  description text,
  features text[],
  images text[],
  category text,
  original_price numeric NOT NULL,
  sale_price numeric,
  stock integer DEFAULT 0,
  featured boolean DEFAULT false,
  active boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
)

-- Orders
orders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_number text UNIQUE NOT NULL,  -- SHA-XXXXXX
  customer_name text NOT NULL,
  customer_phone text NOT NULL,
  city text NOT NULL,
  address text NOT NULL,
  instructions text,
  products jsonb NOT NULL,          -- [{ product_id, name, slug, price, quantity, image }]
  subtotal numeric NOT NULL,
  discount numeric DEFAULT 0,
  delivery_fee numeric DEFAULT 200,
  total numeric NOT NULL,
  coupon_code text,
  status text DEFAULT 'pending',    -- pending | confirmed | dispatched | delivered | returned
  postex_tracking text,
  notes text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
)

-- Sales (site-wide or targeted promotions)
sales (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  discount_type text NOT NULL,        -- percentage | fixed
  discount_value numeric NOT NULL,
  applies_to text NOT NULL,           -- all | products | categories
  product_ids uuid[],
  category_names text[],
  start_date timestamptz NOT NULL,
  end_date timestamptz NOT NULL,
  active boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
)

-- Coupons (checkout discount codes)
coupons (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code text UNIQUE NOT NULL,
  discount_type text NOT NULL,        -- percentage | fixed
  discount_value numeric NOT NULL,
  min_order numeric,
  usage_limit integer,
  per_user_limit integer DEFAULT 1,
  uses_count integer DEFAULT 0,
  expiry_date timestamptz,
  active boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
)

-- Coupon usage tracking
coupon_usage (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  coupon_id uuid REFERENCES coupons(id),
  customer_phone text NOT NULL,
  order_id uuid REFERENCES orders(id),
  used_at timestamptz DEFAULT now()
)

-- Cart persistence (guest sessions)
carts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id text UNIQUE NOT NULL,
  items jsonb DEFAULT '[]',           -- [{ product_id, quantity, added_at }]
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
)
```

### Row Level Security (RLS)

- `products`: public read where `active = true`; admin write via service role
- `orders`: insert via server action only; no public read
- `carts`: read/write by `session_id` cookie
- `sales`, `coupons`: public read for active records; admin write only

---

## Server-Side Data for Landing Page (Module 01)

These queries/functions are owned by **this module** and consumed by Module 01 Server Components:

| Function | Query | Returns |
|---|---|---|
| `getFeaturedProducts()` | `products` WHERE `featured = true AND active = true` LIMIT 6 | Product[] with computed sale prices |
| `getProducts({ page, sort, category })` | Paginated active products | Product[] + total count |
| `getActiveSale()` | `sales` WHERE `active = true AND now() BETWEEN start_date AND end_date` | Sale or null |
| `getProductBySlug(slug)` | Single product + related | Product + related Product[] |
| `computeDisplayPrice(product, activeSale)` | Pricing engine | `{ original, sale, onSale, badge }` |

All product prices shown on the landing page must go through `computeDisplayPrice` so sale rules are consistent everywhere.

---

## Cart Persistence Rules

| Scenario | Behavior |
|---|---|
| Guest adds to cart | Stored in `localStorage` + synced to Supabase `carts` by `session_id` cookie |
| Page refresh | Cart restored from localStorage first, then merged with Supabase if newer |
| Browser closed and reopened | Cart persists via localStorage (7-day expiry acceptable) |
| Guest → logged-in (future) | Guest cart merges with saved cart (v1: guest-only, no login) |
| Add same product twice | Quantity increments, not duplicate line items |
| Product out of stock | Block add; show "Abhi Available Nahi" |
| Product deactivated after in cart | Show warning on cart page; block checkout |

---

## Checkout & Order Flow

```
Cart (/cart)
  → Apply coupon (optional, validated server-side)
  → Checkout Karein
Checkout (/checkout)
  → Fill form (name, phone, city, address, instructions)
  → Review summary + COD badge
  → Order Karein (server action)
      → Validate stock
      → Validate coupon (usage limits, min order, expiry)
      → Generate SHA-XXXXXX order number
      → Insert order in Supabase
      → Increment coupon uses_count + coupon_usage row
      → Decrement product stock
      → Clear cart
  → Redirect to /order/[orderNumber]
Order Confirmation
  → Display success + order details
```

**Order number format:** `SHA-` + 6 random digits. Unique constraint enforced. Retry on collision (max 3 attempts).

**Delivery fee:** Flat Rs. 200 on every order.

**Payment:** Cash on Delivery only.

---

## Coupon Validation Rules

- Code normalized to uppercase
- Must be `active = true`
- Not expired (`expiry_date > now()`)
- `uses_count < usage_limit` (if limit set)
- Order subtotal ≥ `min_order` (if set)
- Per-user limit checked by `customer_phone` in `coupon_usage`
- Discount applied to subtotal before delivery fee
- Percentage capped at 100%; fixed amount capped at subtotal

---

## In Scope

- Supabase project setup, env vars (`NEXT_PUBLIC_SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`)
- Database migrations for all tables above + indexes (slug, order_number, session_id, coupon code)
- RLS policies for public read / server write patterns
- Product detail page with gallery, actions, related products, sticky mobile bar
- Cart page with quantity controls, remove, coupon apply, order summary
- Checkout page with form validation and COD-only flow
- Order confirmation page
- Server Actions: `createOrder`, `validateCoupon`, cart mutations
- Cart persistence: localStorage + Supabase `carts` table with session cookie
- Pricing engine applying active sales to product display prices
- Order number generation (SHA-XXXXXX)
- Stock decrement on successful order
- Coupon validation and usage tracking
- Server-side data fetching functions consumed by Module 01
- Seed script or initial product data for development
- Error handling with Roman Urdu user-facing messages
- Form validation: phone format (Pakistani mobile), required fields
- Empty states for cart and out-of-stock products
- API route or server action protection (no direct client Supabase writes for orders)

---

## Out of Scope

- Homepage UI sections and layout — Module 01
- Admin CRUD for products, orders, sales, coupons — Module 03
- NextAuth admin login — Module 03
- PostEx API booking on order submit — future phase (field `postex_tracking` reserved)
- WhatsApp/email notification on new order — future phase
- Customer order tracking page (enter order number to check status) — future phase
- SMS confirmation — future phase
- Online payment (JazzCash, EasyPaisa, card) — future phase
- User accounts / customer login — not v1
- Product reviews — future phase
- Wishlist — future phase
- Inventory alerts / low stock emails — Module 03 dashboard display only
- PDF shipping label generation — future phase
- Multi-city delivery fee tiers — flat Rs. 200 only for v1
- Tax / GST calculation — not in v1
- Order edit or cancel by customer — not in v1
- Real-time order status updates to customer — future phase

---

## Verification Criteria

### Database & Server

- [ ] All tables created with correct schema and indexes
- [ ] RLS policies prevent public direct order reads/writes
- [ ] `getFeaturedProducts()` returns only active, featured products with correct sale prices
- [ ] `getProducts()` pagination, sort, and category filter work correctly
- [ ] `getActiveSale()` returns null outside sale window; returns sale within window
- [ ] `computeDisplayPrice()` applies percentage and fixed sales correctly for all/products/categories scopes
- [ ] Seed data loads at least 4 products for development

### Product Page

- [ ] `/products/[slug]` renders product from database (not 404 for valid slug)
- [ ] Image gallery swipeable on mobile
- [ ] Sticky add-to-cart bar visible on mobile product page
- [ ] "Cart Mein Daalo" adds to cart with correct price (including active sale)
- [ ] "Abhi Kharido" navigates to checkout with single item
- [ ] Out-of-stock product shows "Abhi Available Nahi"; add buttons disabled
- [ ] Related products shown at bottom
- [ ] COD badge and delivery estimate visible

### Cart

- [ ] Adding product from homepage/product page updates cart count in navbar
- [ ] Cart persists after page refresh (localStorage)
- [ ] Cart persists after closing and reopening browser
- [ ] Quantity +/- updates totals correctly
- [ ] Remove item works; empty state shown when cart cleared
- [ ] Coupon "EID20" (or test coupon) applies discount when valid; shows error when invalid/expired/over limit
- [ ] Order summary: subtotal + discount + Rs. 200 delivery = correct total
- [ ] "Checkout Karein" disabled when cart empty
- [ ] Sale prices reflected in cart line items

### Checkout & Orders

- [ ] Form validates required fields with Roman Urdu error messages
- [ ] Phone validation rejects invalid Pakistani numbers
- [ ] Submitting order creates row in `orders` table with correct JSONB products snapshot
- [ ] Order number format SHA-XXXXXX generated and unique
- [ ] Redirect to `/order/[orderNumber]` after successful submit
- [ ] Order confirmation page shows correct order details
- [ ] Cart cleared after successful order
- [ ] Product stock decremented by ordered quantity
- [ ] Coupon `uses_count` incremented; `coupon_usage` row created
- [ ] Order fails gracefully if stock insufficient at submit time
- [ ] COD badge visible on checkout page

### Integration with Module 01

- [ ] Landing page featured/all products sections render live Supabase data
- [ ] Sale banner countdown driven by active sale `end_date` from this module
- [ ] Product card prices match product page prices for same product + sale state

### Performance & Security

- [ ] No Supabase service role key exposed to client bundle
- [ ] Order creation only via server action (not client-side insert)
- [ ] Product slugs URL-safe; 404 for inactive/draft products
- [ ] Checkout form max 5 fields; no forced account creation

---

## Environment Variables

```
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
```

Optional for v1:
```
WHATSAPP_NUMBER=          # for confirmation page link
DELIVERY_FEE=200          # default flat fee
```

---

## Build Order (within this module)

1. Supabase setup + migrations + RLS
2. Supabase client utilities + data access layer
3. Pricing engine + `getActiveSale` + product queries
4. Cart context/provider + localStorage + Supabase sync
5. Product detail page
6. Cart page + coupon validation
7. Checkout form + `createOrder` server action
8. Order confirmation page
9. Wire server queries to Module 01 homepage sections
10. Seed data + end-to-end order flow test

---

*Module 02 — Products, Cart & Checkout · Shahkar.store*
