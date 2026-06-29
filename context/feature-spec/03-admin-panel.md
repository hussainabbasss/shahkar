# Feature Spec — 03 Admin Panel

**Module:** Protected admin dashboard for store management  
**Version:** 1.0  
**Last Updated:** June 29, 2026  
**References:** `context/project-overview.md` §9, §12 (Phases 2–4), `context/ui-context.md`

---

## What This Module Is

The internal control center at `/admin` — where the store owner manages products, orders, sales, coupons, and analytics. Protected by NextAuth.js with admin-only role. All CRUD operations here write to the same Supabase tables defined in Module 02. The admin UI can be functional-first (clean tables and forms) while the customer storefront follows the full design system.

---

## Routes

```
/admin                          → redirect to /admin/dashboard
/admin/login                    → email + password login
/admin/dashboard                → at-a-glance stats + recent orders
/admin/products                 → product list
/admin/products/new             → create product
/admin/products/[id]/edit       → edit product
/admin/orders                   → orders list with filters
/admin/orders/[orderNumber]     → order detail + status update
/admin/sales                    → sales list
/admin/sales/new                → create sale
/admin/sales/[id]/edit          → edit sale
/admin/coupons                  → coupons list
/admin/coupons/new              → create coupon
/admin/coupons/[id]/edit        → edit coupon
/admin/analytics                → charts + key metrics
```

---

## Authentication

| Concern | Implementation |
|---|---|
| Provider | NextAuth.js Credentials provider |
| Roles | Admin only for v1 |
| Session | JWT or database session |
| Protection | Middleware on `/admin/*` except `/admin/login` |
| Unauthorized | Redirect to `/admin/login` |
| Admin users | Stored in Supabase `admin_users` table or NextAuth adapter table |

```sql
-- Admin users (minimal v1)
admin_users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text UNIQUE NOT NULL,
  password_hash text NOT NULL,
  name text,
  role text DEFAULT 'admin',
  created_at timestamptz DEFAULT now()
)
```

Password hashed with bcrypt. No public signup — admin seeded manually.

---

## Components Overview

### Admin Layout Shell

| Component | Responsibility |
|---|---|
| `AdminLayout` | Sidebar + top bar + content area |
| `AdminSidebar` | Nav links: Dashboard, Products, Orders, Sales, Coupons, Analytics |
| `AdminTopBar` | Page title, admin name, logout button |
| `AdminTable` | Reusable sortable table with pagination |
| `AdminForm` | Reusable form wrapper with save/cancel |
| `StatusBadge` | Color-coded order/sale/coupon status pills |
| `ConfirmDialog` | Delete confirmation modal |
| `Toast` | Success/error notifications after actions |

**Admin UI note:** Functional over decorative. Use design system neutrals and Primary Green for actions. No need for hero sections or marketing copy.

---

### 9.1 Dashboard (`/admin/dashboard`)

| Component | Data Source |
|---|---|
| `StatCard` ×7 | Supabase aggregate queries |
| `RecentOrdersTable` | Last 10 orders |
| `QuickStatusUpdate` | Inline dropdown per order row |

**Stats displayed:**
- Total orders: today / this week / this month
- Total revenue: today / this week / this month
- Pending orders count
- Delivered orders count
- Returned orders count
- Active coupons count
- Low stock alerts (products where `stock < threshold`, default 5)

**Recent orders table columns:** Order number, customer name, amount, status, date, quick status dropdown.

---

### 9.2 Products (`/admin/products`)

| Component | Responsibility |
|---|---|
| `ProductListTable` | Image thumb, name, price, sale price, stock, featured, status (active/draft) |
| `ProductForm` | Create/edit all product fields |
| `ImageUploader` | Multiple image upload to Supabase Storage |
| `FeatureBulletsEditor` | Dynamic add/remove bullet points |
| `SlugPreview` | Auto-generated from name, editable |

**Product form fields:**
- Name, slug (auto from name), description (rich text or textarea v1)
- Feature bullets (dynamic list)
- Images (multiple upload → Supabase Storage URLs)
- Category
- Original price, sale price (optional)
- Stock quantity
- Featured toggle (shows on homepage Top Products — Module 01)
- Active / Draft toggle

**Actions:** Edit, Delete (with confirm), "Naya Product Banao" button.

---

### 9.3 Orders (`/admin/orders`)

| Component | Responsibility |
|---|---|
| `OrdersListTable` | Filterable, searchable order list |
| `OrderFilters` | Status filter: All, Pending, Confirmed, Dispatched, Delivered, Returned |
| `OrderSearch` | Search by order number or phone |
| `OrderDetail` | Full order view |
| `StatusUpdater` | Pending → Confirmed → Dispatched → Delivered → Returned |
| `TrackingNumberField` | PostEx tracking number (manual entry v1) |
| `InternalNotesField` | Admin-only notes on order |

**Order detail shows:** Customer info, products ordered (from JSONB snapshot), amount breakdown, status history, tracking number, notes.

**Future placeholder (disabled v1):** Print shipping label button (PostEx API).

---

### 9.4 Sales (`/admin/sales`)

| Component | Responsibility |
|---|---|
| `SalesListTable` | Name, discount, start, end, status (Active/Scheduled/Expired) |
| `SaleForm` | Create/edit sale |

**Sale form fields:**
- Sale name (e.g. "Eid Sale")
- Discount type: Percentage (%) or Fixed Amount (Rs.)
- Discount value
- Applies to: All products / Specific products / Specific categories
- Product picker (when specific products)
- Category picker (when specific categories)
- Start date + time
- End date + time (drives homepage countdown — Module 01)
- Active toggle

**Actions:** Edit, Delete, Duplicate.

**Side effects when sale is active (handled by Module 02 pricing engine + Module 01 UI):**
- Homepage sale banner appears with countdown
- Affected product prices show strikethrough + sale badge
- When timer hits zero — banner disappears, prices revert automatically

---

### 9.5 Coupons (`/admin/coupons`)

| Component | Responsibility |
|---|---|
| `CouponsListTable` | Code, discount, uses/limit, expiry, status |
| `CouponForm` | Create/edit coupon |

**Coupon form fields:**
- Code (auto uppercase, e.g. EID20)
- Discount type: Percentage or Fixed
- Discount value
- Minimum order amount (optional)
- Usage limit (e.g. max 100 uses)
- Per user limit (e.g. 1 use per customer phone)
- Expiry date
- Active toggle

**Actions:** Edit, Delete, Deactivate.

---

### 9.6 Analytics (`/admin/analytics`)

| Component | Responsibility |
|---|---|
| `RevenueChart` | Line chart — daily/weekly/monthly toggle |
| `OrdersChart` | Orders placed vs delivered vs returned |
| `TopProductsTable` | Best sellers by quantity and revenue |
| `MetricsGrid` | Key metric cards |

**Key metrics:**
- Average order value
- Return rate %
- Most used coupon codes
- Top cities by order volume
- Conversion rate — placeholder/disabled until tracking added (future)

**Chart library:** Lightweight option (Recharts or Chart.js). No heavy dependencies.

---

## Build Phases (aligned with project overview §12)

| Phase | Admin Features | When |
|---|---|---|
| Phase 2 | Products CRUD + Orders list/detail/status | After first storefront launch |
| Phase 3 | Sales + Coupons management | After validation |
| Phase 4 | Analytics dashboard | After 20+ orders/day |

This spec documents the **full admin panel**; implementation can follow phased rollout above.

---

## In Scope

- NextAuth.js setup with credentials provider and admin role
- Middleware protecting all `/admin/*` routes except login
- Admin layout with sidebar navigation
- Dashboard with stat cards and recent orders table
- Products: list, create, edit, delete with image upload to Supabase Storage
- Product slug auto-generation from name
- Featured toggle controlling Module 01 homepage featured section
- Active/Draft toggle controlling product visibility on storefront
- Orders: list with status filter and search, detail page, status workflow updates
- PostEx tracking number field (manual entry)
- Internal notes on orders
- Sales: full CRUD with date/time scheduling, duplicate action
- Sale scope: all products, specific products, or categories
- Coupons: full CRUD with usage limits and expiry
- Analytics: revenue chart, orders chart, top products, key metrics
- Low stock alerts on dashboard
- Toast notifications for CRUD success/failure
- Delete confirmations for destructive actions
- Server-side mutations via Server Actions or API routes (service role)
- Supabase Storage bucket for product images with public read URL

---

## Out of Scope

- Customer-facing pages — Modules 01 & 02
- PostEx API auto-booking and label printing — future phase (UI placeholder ok)
- WhatsApp/email notification on new order — future phase
- Multi-admin roles (sales intern, ops, packing) — Phase 6 per project overview
- Intern sales dashboard — future phase
- Ops packing panel with QR scanning — future phase
- Product review moderation — future phase
- Customer management / CRM — not in v1
- Bulk product import (CSV) — future phase
- Inventory purchase orders / supplier management — not in v1
- Refund processing — manual outside system for v1
- Audit log of admin actions — future phase
- Two-factor authentication — future phase
- Admin mobile app — desktop-first admin is acceptable
- Testimonial management for homepage trust section — future (static seed for v1)
- Email/password reset for admin — manual reset for v1
- Public admin signup — never; seed only

---

## Verification Criteria

### Authentication & Security

- [ ] Unauthenticated visit to `/admin/dashboard` redirects to `/admin/login`
- [ ] Valid admin credentials grant access; invalid credentials show error
- [ ] Logout clears session and redirects to login
- [ ] No admin API routes callable without valid session
- [ ] Supabase service role key never exposed to client
- [ ] Admin password stored hashed (bcrypt), not plaintext

### Dashboard

- [ ] Stat cards show correct counts for orders and revenue (today/week/month)
- [ ] Pending, delivered, returned counts match database
- [ ] Low stock alert shows products below threshold
- [ ] Recent orders table shows last 10 orders with correct data
- [ ] Quick status update from dashboard table persists to database

### Products

- [ ] Product list shows all products with correct columns
- [ ] Create product saves to Supabase with all fields
- [ ] Slug auto-generates from name; editable before save
- [ ] Multiple images upload to Supabase Storage and URLs saved
- [ ] Feature bullets add/remove works dynamically
- [ ] Featured toggle: product appears in Module 01 featured section when enabled
- [ ] Active/Draft toggle: draft products hidden from storefront
- [ ] Edit product updates existing record
- [ ] Delete product removes from list (with confirmation); storefront 404s
- [ ] Stock quantity updates reflect on product page

### Orders

- [ ] Orders list shows all orders with filter by status
- [ ] Search by order number and phone returns correct results
- [ ] Order detail shows customer info, products, amount breakdown
- [ ] Status update: Pending → Confirmed → Dispatched → Delivered → Returned
- [ ] PostEx tracking number saves and displays on detail page
- [ ] Internal notes save and persist

### Sales

- [ ] Create sale with percentage discount applies to storefront prices (Module 02 engine)
- [ ] Create sale with fixed discount applies correctly
- [ ] "All products" scope affects every active product
- [ ] "Specific products" scope affects only selected products
- [ ] "Specific categories" scope affects category members only
- [ ] Scheduled sale (future start) shows status "Scheduled"; not active on storefront yet
- [ ] Active sale drives Module 01 sale banner and countdown
- [ ] Expired sale (past end_date) shows status "Expired"; prices revert on storefront
- [ ] Edit and duplicate sale work correctly
- [ ] Delete sale removes promotion from storefront

### Coupons

- [ ] Create coupon with code auto-uppercased
- [ ] Active coupon validates on Module 02 checkout
- [ ] Inactive coupon rejected at checkout
- [ ] Usage limit enforced (blocks after max uses)
- [ ] Per-user limit enforced by phone number
- [ ] Expired coupon rejected at checkout
- [ ] Uses count displayed correctly in admin list
- [ ] Deactivate coupon immediately blocks checkout usage

### Analytics

- [ ] Revenue chart renders with daily/weekly/monthly toggle
- [ ] Orders chart shows placed vs delivered vs returned counts
- [ ] Top products table ranked by sales volume
- [ ] Average order value calculated correctly
- [ ] Return rate percentage calculated correctly
- [ ] Top cities by order volume displayed
- [ ] Most used coupon codes listed

### Cross-Module Integration

- [ ] Product created in admin appears on Module 01 homepage (when featured/active)
- [ ] Sale created in admin triggers Module 01 banner within 1 page load (or ISR revalidation)
- [ ] Order placed via Module 02 checkout appears in admin orders list
- [ ] Stock decremented by Module 02 order reflects in admin product list

---

## Admin UI Guidelines

- Desktop-first layout (min 1024px optimized); usable on tablet
- Tables with horizontal scroll on small screens rather than broken layout
- Form labels in English (admin audience); customer copy remains Roman Urdu
- Primary action buttons use Shahkar Green
- Destructive actions (delete) use Error red with confirmation dialog
- Date/time pickers for sale scheduling must support timezone (PKT / UTC stored consistently)
- Image upload shows preview before save
- Loading states on all form submissions

---

## Environment Variables (additions)

```
NEXTAUTH_SECRET=
NEXTAUTH_URL=
ADMIN_SEED_EMAIL=       # for initial admin creation script
ADMIN_SEED_PASSWORD=
```

---

## Build Order (within this module)

1. NextAuth setup + admin user seed + middleware
2. Admin layout shell (sidebar, top bar)
3. Products CRUD + Supabase Storage for images
4. Orders list + detail + status updates
5. Dashboard stats (depends on orders existing)
6. Sales CRUD + verify storefront integration
7. Coupons CRUD + verify checkout integration
8. Analytics charts + metrics
9. Polish: toasts, confirmations, empty states

---

*Module 03 — Admin Panel · Shahkar.store*
