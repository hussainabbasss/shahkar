# Shahkar.store — Project Overview & Technical Specification
### Har Desi Masle Ka Hal
**Version:** 1.0  
**Last Updated:** June 29, 2026

---

## 1. Brand Identity

**Name:** Shahkar.store  
**Tagline:** "Har Desi Masle Ka Hal"  
**Tone:** Warm, relatable, Pakistani — not corporate  
**Language:** Roman Urdu + Urdu mixed with English where needed  
**Target Audience:** Women 25–45, Pakistani households, mobile users  
**Primary Color:** To be defined (suggest deep green or saffron — desi feel)  
**Font:** Clean, readable — Nunito or Plus Jakarta Sans  

---

## 2. Tech Stack

| Layer | Tech |
|---|---|
| Frontend | Next.js 14 (App Router) |
| Styling | Tailwind CSS |
| Backend | Next.js API Routes |
| Database | Supabase (PostgreSQL) |
| Auth | NextAuth.js (role based) |
| Cart Persistence | Supabase (user cart table) + localStorage fallback |
| Courier Integration | PostEx REST API |
| PDF Generation | jsPDF or react-pdf |
| Analytics | Custom dashboard + Supabase queries |
| Hosting | Vercel |

---

## 3. Site Structure

```
shahkar.store/
├── / (Homepage)
├── /products (All products)
├── /products/[slug] (Single product page)
├── /cart (Cart page)
├── /checkout (Checkout page)
├── /order/[orderNumber] (Order confirmation page)
└── /admin (Admin panel — protected)
     ├── /admin/dashboard
     ├── /admin/products
     ├── /admin/products/new
     ├── /admin/products/[id]/edit
     ├── /admin/orders
     ├── /admin/orders/[orderNumber]
     ├── /admin/sales
     ├── /admin/coupons
     └── /admin/analytics
```

---

## 4. Homepage Sections

### 4.1 — Sale Banner (Conditional — shows only during active sale)
- Full width banner at very top of page
- Background: Bold color (red or saffron)
- Content:
  - Sale name e.g. "Eid Sale 🎉 — 20% Off Sab Products Pe!"
  - Countdown timer: **DD : HH : MM : SS**
  - Coupon code if applicable: "Code: EID20"
- Dismissible: No — always visible during sale
- Auto disappears when timer hits zero
- Managed entirely from Admin Panel → Sales

---

### 4.2 — Navigation Bar
- Logo: Shahkar.store
- Links: Home, Products, About, Contact
- Cart icon with item count badge
- Mobile: Hamburger menu
- Sticky on scroll

---

### 4.3 — Hero Section
- **Headline:** "Har Desi Masle Ka Hal" (large, bold, Urdu)
- **Subheadline:** "Smart products for every Pakistani home — Cash on Delivery across Pakistan 🇵🇰"
- **Trust badges row:**
  - 📦 Cash on Delivery
  - 🚚 2–3 Din Delivery
  - 🔄 Easy Returns
  - ✅ 100% Genuine Products
- **CTA Button:** "Products Dekho" → scrolls to products section
- **Background:** Clean lifestyle image or subtle Pakistani pattern — no product shown here
- Mobile: Full width, stacked layout

---

### 4.4 — Why Shahkar? (3 Columns)
- 💡 **Smart Products** — "Woh cheezein jo ghar ki zindagi aasaan kar dein"
- 💰 **Sahi Daam** — "Market se sasta, quality mein aala"
- 🏠 **Ghar Tak** — "COD pe mangwao — pehle dekho phir dena"

---

### 4.5 — Top Products Section
- Section heading: **"Hamare Behtareen Products"**
- Shows top 4–6 products marked as "featured" in admin
- Each product card contains:
  - Product image
  - Product name
  - Original price (strikethrough if on sale)
  - Sale price (highlighted)
  - "Sale" badge if on sale
  - "Cart Mein Daalo" button
  - "Abhi Dekho" link → product page
- Responsive grid: 2 columns mobile, 4 columns desktop

---

### 4.6 — All Products Section
- Section heading: **"Tamam Products"**
- Filter by category (if multiple categories)
- Sort by: New, Price Low–High, Price High–Low, Popular
- Pagination or Load More button
- Same product card as above

---

### 4.7 — How It Works (3 Steps)
- Step 1: **"Product Chunein"** — Browse and add to cart
- Step 2: **"Order Karein"** — Fill in your details, COD select karein
- Step 3: **"Ghar Bethay Pao"** — 2–3 din mein delivery

---

### 4.8 — Trust Section
- "10,000+ Khush Customers" (update as you grow)
- Customer reviews / testimonials (add manually from admin)
- Star ratings display

---

### 4.9 — Footer
- Logo + tagline
- Links: Products, About, Contact, Returns Policy
- WhatsApp contact button
- "Cash on Delivery — Poore Pakistan Mein"
- Copyright: © 2026 Shahkar.store

---

## 5. Product Page (/products/[slug])

- Large product image gallery (swipeable on mobile)
- Product name
- Price (original + sale price if applicable)
- Sale badge + countdown timer if product is on sale
- Short description
- Feature bullets (e.g. "5 heads included", "USB rechargeable")
- **"Cart Mein Daalo"** button — full width on mobile
- **"Abhi Kharido"** button → goes directly to checkout with this product
- COD badge
- Delivery estimate
- Return policy note
- Related products at bottom

---

## 6. Cart (/cart)

### Persistence
- Cart stored in **Supabase** for logged-in users
- Cart stored in **localStorage** for guests
- On page refresh — cart remains exactly as left
- On returning after closing browser — cart still there (localStorage)
- If user logs in after adding to cart — guest cart merges with saved cart

### Cart Page Contains
- List of items with image, name, price, quantity controls
- Remove item button per product
- Coupon code input field → "Apply" button
- Order summary:
  - Subtotal
  - Discount (if coupon applied)
  - Delivery charges (flat Rs. 200)
  - **Total**
- "Checkout Karein" button → /checkout
- "Shopping Jari Rakho" link → back to products

---

## 7. Checkout Page (/checkout)

### Form Fields
- Full Name
- Phone Number
- City
- Complete Address
- Special Instructions (optional)

### Order Summary
- Products list with quantities
- Subtotal
- Coupon discount if applied
- Delivery: Rs. 200
- **Total Amount**

### Payment
- Cash on Delivery only (for now)
- COD badge prominently displayed

### On Submit
- Order created in Supabase
- Unique order number generated: **SHA-XXXXXX** (e.g. SHA-482910)
- Customer redirected to /order/[orderNumber]
- Admin notified (future: WhatsApp/email notification)
- PostEx booking triggered via API (future phase)

---

## 8. Order Confirmation Page (/order/[orderNumber])

- ✅ "Shukriya! Aapka Order Place Ho Gaya"
- Order number displayed prominently: **SHA-482910**
- Order summary
- Delivery estimate: 2–3 business days
- "Apna Order Track Karein" → enter order number to check status
- WhatsApp us link for queries
- "Aur Shopping Karein" button

---

## 9. Admin Panel (/admin)

### Authentication
- Email + password login
- Role based: Admin only
- Protected routes — redirect to login if not authenticated

---

### 9.1 Dashboard (/admin/dashboard)
**At a glance stats:**
- Total orders today / this week / this month
- Total revenue today / this week / this month
- Pending orders count
- Delivered orders count
- Returned orders count
- Active coupons count
- Low stock alerts

**Recent orders table:**
- Order number, customer name, amount, status, date
- Quick status update dropdown per order

---

### 9.2 Products (/admin/products)

**Product List:**
- Table: Image, Name, Price, Sale Price, Stock, Featured, Status
- Edit / Delete buttons per product
- "Naya Product Banao" button

**Create / Edit Product Form:**
- Product name
- Slug (auto generated from name)
- Description (rich text)
- Feature bullets (add/remove dynamically)
- Images (multiple upload)
- Category
- Original price
- Sale price (optional)
- Stock quantity
- Featured toggle (shows on homepage Top Products)
- Active / Draft toggle

---

### 9.3 Orders (/admin/orders)

**Orders Table:**
- Order number, customer name, phone, city, amount, status, date
- Filter by status: All, Pending, Confirmed, Dispatched, Delivered, Returned
- Search by order number or phone

**Order Detail Page:**
- Full customer info
- Products ordered
- Amount breakdown
- Status update: Pending → Confirmed → Dispatched → Delivered → Returned
- PostEx tracking number field
- Print shipping label button (PostEx API — future phase)
- Internal notes field

---

### 9.4 Sales (/admin/sales)

**Create Sale:**
- Sale name (e.g. "Eid Sale")
- Discount type: Percentage (%) or Fixed Amount (Rs.)
- Discount value
- Applies to: All products / Specific products / Specific categories
- Start date + time
- End date + time (this drives the countdown timer on homepage)
- Active toggle

**What happens when sale is created:**
- Homepage banner appears automatically with countdown timer
- Affected product prices update with strikethrough
- Sale badge appears on product cards
- Timer counts down to end date/time
- When timer hits zero — banner disappears, prices revert automatically

**Sales List:**
- Name, discount, start, end, status (Active/Scheduled/Expired)
- Edit / Delete / Duplicate buttons

---

### 9.5 Coupons (/admin/coupons)

**Create Coupon:**
- Coupon code (e.g. EID20 — auto caps)
- Discount type: Percentage or Fixed
- Discount value
- Minimum order amount (optional)
- Usage limit (e.g. max 100 uses)
- Per user limit (e.g. 1 use per customer)
- Expiry date
- Active toggle

**Coupons List:**
- Code, discount, uses/limit, expiry, status
- Edit / Delete / Deactivate buttons

---

### 9.6 Analytics (/admin/analytics)

**Revenue Chart:**
- Daily/weekly/monthly toggle
- Line chart — revenue over time

**Orders Chart:**
- Orders placed vs delivered vs returned

**Top Products:**
- Which products sell most
- Revenue per product

**Key Metrics:**
- Average order value
- Return rate %
- Conversion rate (future — when website orders tracked)
- Most used coupon codes
- Top cities by order volume

---

## 10. Database Schema (Supabase)

```sql
-- Products
products (
  id, name, slug, description, features[],
  images[], category, original_price, sale_price,
  stock, featured, active, created_at
)

-- Orders
orders (
  id, order_number (SHA-XXXXXX), customer_name,
  customer_phone, city, address, instructions,
  products (jsonb), subtotal, discount, delivery_fee,
  total, coupon_code, status, postex_tracking,
  notes, created_at, updated_at
)

-- Sales
sales (
  id, name, discount_type, discount_value,
  applies_to, product_ids[], start_date,
  end_date, active, created_at
)

-- Coupons
coupons (
  id, code, discount_type, discount_value,
  min_order, usage_limit, per_user_limit,
  uses_count, expiry_date, active, created_at
)

-- Coupon Usage
coupon_usage (
  id, coupon_id, customer_phone, order_id, used_at
)

-- Cart (for persistence)
carts (
  id, session_id, items (jsonb), created_at, updated_at
)
```

---

## 11. Order Number System

- Format: **SHA-XXXXXX**
- XXXXXX = 6 digit random number
- Generated on checkout submission
- Unique constraint in database
- Customer sees it on confirmation page
- Searchable in admin panel
- Customer can track status by entering order number on site (future phase)

---

## 12. Build Priority

| Phase | What | When |
|---|---|---|
| Phase 1 | Homepage + Product pages + Cart + Checkout | This week |
| Phase 2 | Admin — Products + Orders management | After first 10 orders |
| Phase 3 | Admin — Sales + Coupons + countdown timer | After validation |
| Phase 4 | Admin — Analytics dashboard | After 20+ orders/day |
| Phase 5 | PostEx API — auto booking + label printing | When volume demands |
| Phase 6 | Intern dashboard (Sales + Ops panels) | When interns join |

---

## 13. UI/UX Rules (Non Negotiable)

- Mobile first — design for 390px, everything else scales up
- Page load under 2 seconds — no heavy assets
- Max 2-3 CTAs per page
- COD badge always visible above the fold
- Cart count always visible in navbar
- All forms: max 5 fields — no unnecessary friction
- Countdown timer: real time, no page refresh needed
- All prices in PKR — clearly displayed
- Roman Urdu copy throughout — not corporate English

---

## 14. Future Features (Parking Lot)

- WhatsApp notification on new order
- Customer order tracking page by order number
- SMS confirmation via jazz/telenor API
- Intern sales dashboard
- Ops packing panel with QR scanning
- PostEx auto booking on order confirmation
- Product reviews system
- Wishlist
- Referral system

---

*Shahkar.store — Har Desi Masle Ka Hal*  
*Built with ❤️ in Pakistan*
