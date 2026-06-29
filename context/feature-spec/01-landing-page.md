# Feature Spec — 01 Landing Page

read `AGENTS.md` before starting 

**Module:** Public storefront UI (homepage + shared layout)  
**Version:** 1.0  
**Last Updated:** June 29, 2026  
**References:** `context/project-overview.md` §4, `context/ui-context.md`

---

## What This Module Is

The customer-facing landing experience at `/` — everything she sees before she taps into a product, cart, or checkout. This module owns the **presentation layer** of the homepage and the **shared shell** (navbar, footer, sale banner slot) used across public pages. Product data is **read** from the server (see Module 02); this module does not own database writes, cart logic, or checkout.

---

## Routes

| Route | Purpose |
|---|---|
| `/` | Homepage — all sections below |
| `/about` | Static about page (linked from nav/footer) |
| `/contact` | Static contact page with WhatsApp CTA |

Shared layout wraps all public routes above plus product/cart/checkout routes (owned partially by Module 02).

---

## Components Overview

### Layout Shell (shared across public pages)

| Component | Responsibility | Design Notes |
|---|---|---|
| `SaleBanner` | Conditional top banner during active sale | Saffron Gold `#D4820A`, 48px mobile height. Sale name left, countdown center (DD:HH:MM:SS monospace), coupon code right. Not dismissible. Hidden when no active sale or timer expired. |
| `Navbar` | Sticky navigation | White bg, 60px mobile / 70px desktop, sticky top. Logo left, links center/desktop, cart icon + count badge right. Hamburger on mobile. Cart badge: green circle with white count. |
| `MobileMenu` | Hamburger drawer/sheet | Links: Home, Products, About, Contact. Full-width tap targets (min 52px). |
| `Footer` | Site footer | Logo + tagline, nav links (Products, About, Contact, Returns Policy), WhatsApp button, "Cash on Delivery — Poore Pakistan Mein", © 2026 Shahkar.store |
| `WhatsAppFab` | Floating contact button | Bottom-right on mobile, always accessible per UI context §9 |

---

### Homepage Sections (top to bottom)

| # | Section | Component(s) | Design & Behavior |
|---|---|---|---|
| 4.1 | Sale Banner | `SaleBanner` | Renders only when Module 02 provides an active sale. Real-time countdown without page refresh. |
| 4.2 | Navigation | `Navbar`, `MobileMenu` | Cart count synced from cart state (Module 02). Sticky on scroll. |
| 4.3 | Hero | `HeroSection`, `TrustBadges`, `CodBadge` | H1: "Har Desi Masle Ka Hal". Subheadline with COD + Pakistan flag. 4 trust badges row. Primary CTA "Products Dekho" scrolls to `#products`. Clean lifestyle/pattern background — no product image. Mobile: stacked full-width. |
| 4.4 | Why Shahkar | `WhyShahkarSection`, `FeatureColumn` ×3 | 3 columns: Smart Products, Sahi Daam, Ghar Tak. Mint Glow `#E8F5EE` or white cards on Off White `#FAFAF8` background. |
| 4.5 | Top Products | `FeaturedProductsSection`, `ProductCard` | Heading: "Hamare Behtareen Products". 4–6 featured products from server. Grid: 2 col mobile, 4 col desktop. |
| 4.6 | All Products | `AllProductsSection`, `ProductGrid`, `ProductFilters`, `ProductSort`, `LoadMore` | Heading: "Tamam Products". Category filter (if categories exist), sort (New, Price L–H, Price H–L, Popular), pagination or Load More. Same `ProductCard` as featured. |
| 4.7 | How It Works | `HowItWorksSection`, `StepCard` ×3 | 3 steps: Product Chunein → Order Karein → Ghar Bethay Pao. Simple icon + Roman Urdu copy. |
| 4.8 | Trust | `TrustSection`, `TestimonialCard` | "10,000+ Khush Customers" stat. Manual testimonials from admin data (future: admin-managed). Star ratings display. |
| 4.9 | Footer | `Footer` | As layout shell above. |

---

### Reusable UI Components (this module owns)

| Component | Used In | Spec Reference |
|---|---|---|
| `ProductCard` | Featured + All Products sections | ui-context §5.2 — image 1:1, sale badge overlay, price row (green sale + gray strikethrough), "Cart Mein Daalo" primary button, "Abhi Dekho" link |
| `TrustBadges` | Hero, product pages (Module 02) | ui-context §5.3 — 4 badges: COD, 2–3 Din Delivery, Easy Returns, 100% Genuine |
| `CodBadge` | Hero, checkout (Module 02) | ui-context §5.7 — green border, "Cash on Delivery Available" |
| `PrimaryButton` | CTAs site-wide | ui-context §5.1 — green, 52px min height, full width mobile |
| `SecondaryButton` | Secondary actions | ui-context §5.1 — green outline |
| `UrgencyButton` | Sale contexts | ui-context §5.1 — Saffron Gold |
| `SectionHeading` | All sections | H2: 22px mobile / 36px desktop, Near Black |
| `SkeletonProductCard` | Loading states | ui-context §8 — skeleton screens, not blank white |

---

### Page Structure (component tree)

```
RootLayout
├── SaleBanner (conditional)
├── Navbar
│   └── CartBadge (count from cart provider)
├── {page content}
└── Footer

HomePage
├── HeroSection
│   ├── TrustBadges
│   └── PrimaryButton → scroll to #products
├── WhyShahkarSection
├── FeaturedProductsSection → ProductCard[]
├── AllProductsSection
│   ├── ProductFilters (bottom sheet mobile)
│   ├── ProductSort
│   └── ProductGrid → ProductCard[]
├── HowItWorksSection
├── TrustSection
└── WhatsAppFab
```

---

## Data Dependencies (read-only from Module 02)

| Data | Source | Used By |
|---|---|---|
| Featured products (4–6) | Supabase `products` where `featured = true` | FeaturedProductsSection |
| All products (paginated) | Supabase `products` where `active = true` | AllProductsSection |
| Active sale | Supabase `sales` where active + in date range | SaleBanner, ProductCard pricing |
| Testimonials | Static seed or admin-managed (Phase 2+) | TrustSection |
| Cart item count | Cart context (Module 02) | Navbar badge |

This module **consumes** server-fetched data via Server Components or props — it does not define Supabase queries (that lives in Module 02).

---

## In Scope

- Homepage with all 9 sections (§4.1–4.9) per project overview
- Shared public layout: `SaleBanner`, `Navbar`, `Footer`, `WhatsAppFab`
- Static pages: `/about`, `/contact`
- Reusable UI components listed above (buttons, badges, product card, section headings)
- Mobile-first responsive layout per ui-context §6 (390px base, 2-col product grid mobile, 4-col desktop)
- Design system implementation: colors, typography (Plus Jakarta Sans), spacing tokens, micro-interactions (card hover, button press, skeleton loaders)
- Roman Urdu copy throughout — no corporate English CTAs
- Smooth scroll from hero CTA to products section
- Sale banner UI with live countdown (client component for timer ticks)
- Product card "Cart Mein Daalo" triggers add-to-cart (handler from Module 02 cart context)
- Product card "Abhi Dekho" links to `/products/[slug]`
- Lazy-loaded images via Next.js `Image`, WebP, above-fold priority for hero
- SEO basics: page title, meta description, Open Graph for homepage
- Accessibility: semantic HTML, alt text on images, focus states on interactive elements

---

## Out of Scope

- Product detail page (`/products/[slug]`) — Module 02
- Cart page, checkout, order confirmation — Module 02
- Supabase schema, migrations, API routes — Module 02
- Cart persistence (localStorage / Supabase) — Module 02
- Admin panel and content management — Module 03
- User authentication / login for customers — not in v1
- Product reviews submission — future phase
- Customer order tracking by order number — future phase
- PostEx integration — future phase
- Analytics tracking / conversion pixels — future phase
- Sale/coupon **creation** — Module 03 (this module only displays active sale)
- Dynamic testimonial admin CRUD — defer to Module 03 or static seed for v1
- `/products` standalone listing page (homepage All Products section covers v1; dedicated route optional later)
- Search functionality — future phase
- Wishlist — future phase
- i18n / language toggle — Roman Urdu only for v1
- Email capture / newsletter — not in spec

---

## Verification Criteria

### Visual & Design

- [ ] Homepage renders correctly at 390px width with no horizontal scroll
- [ ] All colors match ui-context palette (Primary Green `#1B6B3A`, Saffron `#D4820A`, Off White `#FAFAF8` page bg)
- [ ] Plus Jakarta Sans loaded with `display=swap`; no text below 14px
- [ ] Hero H1 readable; trust badges visible above the fold on mobile
- [ ] Product cards match §5.2 spec: 1:1 image, sale badge overlay, price hierarchy (sale price most prominent)
- [ ] Primary CTA buttons are full-width on mobile, min 52px height
- [ ] COD badge visible in hero without scrolling on 390px viewport
- [ ] Navbar sticky; cart badge visible top-right

### Functional

- [ ] "Products Dekho" scrolls smoothly to All Products section
- [ ] Featured products section shows only products marked `featured` from database
- [ ] All Products section supports sort (New, Price L–H, Price H–L, Popular) and category filter
- [ ] Load More or pagination loads additional products without full page reload
- [ ] "Cart Mein Daalo" on product card adds item and updates navbar cart count
- [ ] "Abhi Dekho" navigates to correct `/products/[slug]`
- [ ] Sale banner appears only when an active sale exists; countdown ticks in real time (DD:HH:MM:SS)
- [ ] Sale banner hides automatically when countdown reaches zero
- [ ] Product cards show strikethrough original price + sale badge when product is on sale
- [ ] Hamburger menu opens/closes on mobile; all nav links work
- [ ] WhatsApp FAB opens correct WhatsApp link
- [ ] Footer links navigate to correct pages

### Performance

- [ ] First Contentful Paint < 1.5s on 4G throttled mobile (PageSpeed Insights)
- [ ] Largest Contentful Paint < 2.5s
- [ ] Cumulative Layout Shift < 0.1 (skeleton loaders prevent layout jump)
- [ ] Total mobile page weight < 500KB (excluding product images)
- [ ] Product images lazy-loaded below fold; hero/above-fold images prioritized

### Trust & Copy

- [ ] All CTAs use Roman Urdu ("Cart Mein Daalo", not "Add to Cart")
- [ ] Empty featured products state handled gracefully (hide section or show message)
- [ ] No more than 2–3 primary CTAs visible per viewport at once
- [ ] Passes the ui-context §14 test: "Agar woh baji pehli baar aaye, kya woh 10 seconds mein samjhay gi aur trust karegi?"

### Cross-Module Integration

- [ ] Product data fetched server-side (not hardcoded mock data in production)
- [ ] Cart count in navbar reflects Module 02 cart state after add/remove
- [ ] Sale pricing on cards reflects active sale rules from Module 02/03

---

## Build Order (within this module)

1. Design tokens + Tailwind config (colors, fonts, spacing)
2. Shared layout shell (Navbar, Footer, buttons, badges)
3. `ProductCard` + skeleton variant
4. Hero + Why Shahkar + How It Works (static content)
5. Featured + All Products sections (wired to server data)
6. SaleBanner (wired to active sale data)
7. Trust section + static About/Contact pages
8. Mobile menu, WhatsApp FAB, micro-interactions
9. Performance pass + PageSpeed verification

---

*Module 01 — Landing Page · Shahkar.store*
