# Shahkar.store — Progress Tracker

**Last Updated:** June 29, 2026  
**Current Phase:** Phase 1 — Module 06 Admin Voice Calls shipped

### Netlify deploy ✅

- [x] `netlify.toml` — secrets scan omits expected `NEXT_PUBLIC_*` / `EMAIL_FROM` keys and feature-spec docs
- [x] `@opentelemetry/api` — fixes edge middleware bundling on Netlify

---

## Completed

### Module 01 — Landing Page ✅

- [x] Design tokens + Tailwind theme (Shahkar Green, Saffron, Off White, Plus Jakarta Sans)
- [x] Shared layout shell: `SaleBanner`, `Navbar`, `MobileMenu`, `Footer`, `WhatsAppFab`
- [x] Reusable UI: `PrimaryButton`, `SecondaryButton`, `UrgencyButton`, `SectionHeading`, `TrustBadges`, `CodBadge`, `SkeletonProductCard`, `ProductCard`
- [x] Homepage sections 4.1–4.9: Hero, Why Shahkar, Featured Products, All Products (filter/sort/load more), How It Works, Trust
- [x] Hero visual: two-column layout with product collage, decorative blobs, floating delivery badge
- [x] Static pages: `/about`, `/contact` (with Returns Policy anchor)
- [x] Sale banner with live DD:HH:MM:SS countdown (client timer)
- [x] Cart context (localStorage) + navbar badge + add-to-cart from product cards
- [x] SEO metadata + Open Graph on root layout

### Module 02 — Products, Cart & Checkout ✅

- [x] Supabase schema migration (`supabase/migrations/001_initial_schema.sql`) + seed SQL (`supabase/seed.sql`)
- [x] Supabase clients: server (anon), admin (service role), config guard
- [x] Data access layer: `lib/db/products.ts`, `sales.ts`, `coupons.ts`, `carts.ts`, `mappers.ts`
- [x] Pricing engine: `lib/pricing.ts` — `computeDisplayPrice` with sale scopes (all/products/categories)
- [x] Order number generator: `lib/orders/generate-order-number.ts` (SHA-XXXXXX)
- [x] Server actions: `createOrder`, `validateCoupon`, cart sync (`app/actions/*`)
- [x] Cart persistence: localStorage (7-day expiry) + Supabase `carts` sync via session cookie
- [x] Product detail page: gallery (swipe mobile + thumbnails desktop), info, description, trust, sticky bar, related products
- [x] Cart page: line items, qty controls, coupon input, order summary, checkout CTA
- [x] Checkout page: 5-field form, Roman Urdu validation, COD badge, order summary
- [x] Order confirmation: `/order/[orderNumber]` with copyable order number, details, WhatsApp CTA
- [x] Homepage wired to live data layer (Supabase when configured, seed fallback otherwise)
- [x] `.env.example` with required Supabase vars

### Module 03 — Admin Panel ✅

- [x] **Supabase Auth** (email/password) with `@supabase/ssr` cookie sessions — not NextAuth
- [x] `admin_profiles` table + migration `002_admin_auth.sql` + `scripts/seed-admin.mjs`
- [x] Middleware protecting `/admin/*` except `/admin/login`
- [x] Admin layout shell: sidebar, top bar, toast notifications, confirm dialogs
- [x] Dashboard: stat cards (orders/revenue today/week/month), status counts, low stock alerts, recent orders + quick status update
- [x] Products: list, create, edit, delete; slug auto-gen; feature bullets; image upload to Supabase Storage
- [x] Orders: filter by status, search by order #/phone, detail page, status workflow, PostEx tracking, internal notes
- [x] Sales: full CRUD, duplicate, scope (all/products/categories), date/time scheduling
- [x] Coupons: full CRUD, deactivate, usage limits, auto-uppercase codes
- [x] Analytics: revenue line chart, orders bar chart, top products, AOV, return rate, top cities, top coupons (Recharts)
- [x] Server actions under `app/actions/admin/*` using service role for mutations

### Module 04 — Admin Control (RBAC, Team Orders & Commission) ✅

- [x] Migration `003_admin_rbac.sql` — `permissions`, `commission_*`, `orders.source` / `created_by`, `commission_entries`
- [x] Permission library: `lib/admin/permissions.ts` (types, role templates, tier validation) + `lib/admin/guards.ts` (`requirePermission`, `requireSuperAdmin`)
- [x] Extended `getAdminUser()` with role, permissions, commission config, `active` flag; inactive users blocked at login/middleware
- [x] Team CRUD: `/admin/team`, `/admin/team/new`, `/admin/team/[id]` — create/edit staff, permission matrix, commission tier editor
- [x] Role templates: `manager`, `sales`, `custom` (Super Admin `admin` has full access)
- [x] Permission-gated sidebar nav + server enforcement on all admin pages/actions
- [x] Manual order entry: `/admin/orders/new` — catalog product picker, `source = manual`, `created_by` set
- [x] Orders list/detail: Created by column, Manual/Website badge, creator filter (Super Admin)
- [x] Storefront checkout sets `source = storefront`, `created_by = null`
- [x] Status permissions: `update_order_status` vs `mark_order_delivered` enforced in UI + server
- [x] Commission engine: monthly PKT reset, per-user tiers, accrues on `delivered`, reverses on `returned`
- [x] Staff analytics (`analytics_scope = own`): scoped charts + commission summary card
- [x] Super Admin employee comparison: `/admin/team/compare` with week/month filter
- [x] Per-user analytics page: `/admin/team/[id]/analytics`

### Module 05 — Admin Messages (DMs, Groups, Attachments & Audit) ✅

- [x] Migration `004_admin_messages.sql` — conversations, members, reads (`last_notified_at`), messages (`edited_at`), attachments, entities, RLS, storage bucket, Realtime
- [x] RBAC permission `create_message_groups` — Team matrix checkbox; manager template `true`, sales `false`
- [x] Data layer: `lib/db/admin/messages.ts`, helpers `lib/admin/messages.ts` (time formatting, DM pair, email debounce)
- [x] Server actions: `app/actions/admin/messages.ts` — DM, group, send, edit, read, upload, entity search, shared detail fetch
- [x] Email alerts via Resend — `lib/email/send-message-alert.ts`, one per unread burst (`last_notified_at` debounce)
- [x] Messages UI: `/admin/messages`, `/admin/messages/[conversationId]`, two-panel layout, mobile back navigation
- [x] 1:1 DMs (all active staff), group chats (3+ members, creator can add members)
- [x] Composer **+** menu: attachments, product picker (`view_products`), order picker (`view_orders`)
- [x] Shared product/order cards + detail dialogs (live fetch when permitted, snapshot fallback)
- [x] Sent time (PKT) on every bubble; sender-only edit with `· edited` label; Realtime INSERT + UPDATE
- [x] Super Admin Audit tab — read-only non-member threads with amber banner
- [x] Dashboard `NewMessagesCard` + sidebar Messages nav unread badge
- [x] `.env.example` updated: `RESEND_API_KEY`, `EMAIL_FROM`, `NEXT_PUBLIC_APP_URL`

### Module 06 — Admin Voice Calls (WebRTC) ✅

- [x] Migration `005_admin_voice_calls.sql` — calls, participants, RLS, Realtime, one-active-call partial unique index
- [x] Data layer: `lib/db/admin/voice.ts`; helpers `lib/admin/voice.ts` (constants, signal types, channels)
- [x] Server actions: `app/actions/admin/voice.ts` — start, respond, end, cancel, timeout, join active group call
- [x] ICE config API: `GET /api/admin/voice/ice-servers` — STUN + optional TURN from env
- [x] WebRTC client: `useVoiceCall.ts` — P2P + mesh peer map, Supabase Broadcast signaling on `voice:{callId}`
- [x] Ringtone: `useCallRingtone.ts` + `public/sounds/incoming-call.mp3` with autoplay-unlock + *Tap to hear ringtone*
- [x] Global overlay: `VoiceCallProvider` + `VoiceCallOverlay` in `VoiceCallShell` → `app/admin/layout.tsx` (`z-[200]`)
- [x] Personal incoming channel `voice-user:{userId}` + postgres_changes fallback on call/participant rows
- [x] `CallButton` in DM header + `GroupHeader` (members only; hidden in audit)
- [x] DM 1:1 P2P; group mesh (max 6); 45s ring timeout; concurrent-call guard; Roman Urdu call UI copy
- [x] `.env.example` updated: `VOICE_TURN_URL`, `VOICE_TURN_USERNAME`, `VOICE_TURN_CREDENTIAL`

---

## In Progress

_None_

---

## Next Up

- PostEx API integration (label printing)
- WhatsApp/email notifications on new orders
- Commission payout / wallet (reporting only today)

---

## Open Questions

1. **WhatsApp number** — placeholder `923001234567` in `lib/constants.ts`; replace with real business number before launch.
2. **Product images** — using SVG placeholders; replace with real 800×800 product photos before launch.
3. **Supabase project** — run migrations `001` through `005`, seed SQL, then `npm run admin:seed` with `ADMIN_SEED_EMAIL` / `ADMIN_SEED_PASSWORD`.
4. **Voice TURN (production)** — set `VOICE_TURN_*` in `.env.local` for reliable mobile NAT traversal (Metered.ca / Twilio).

---

## Architecture Notes

```
app/
├── layout.tsx              # Root: font, CartProvider, metadata
├── actions/
│   ├── cart.ts             # Cart sync server actions
│   ├── coupons.ts          # validateCoupon
│   ├── orders.ts           # createOrder (storefront)
│   └── admin/              # Admin CRUD + auth + team + manual orders + messages + voice
├── admin/                  # Protected admin routes
│   ├── login/page.tsx
│   ├── dashboard/page.tsx
│   ├── messages/           # inbox + [conversationId] deep links
│   ├── products/           # list, new, [id]/edit
│   ├── orders/             # list, new, [orderNumber]
│   ├── sales/              # list, new, [id]/edit
│   ├── coupons/            # list, new, [id]/edit
│   ├── team/               # list, new, [id], [id]/analytics, compare
│   └── analytics/page.tsx  # global or own-scoped
└── (public)/               # Storefront routes

components/
├── ui/                     # Buttons, badges, headings, skeleton
├── layout/                 # Shell components
├── home/                   # Homepage sections
├── products/                 # ProductCard, gallery, actions, sticky bar
├── cart/                   # CartItemList, CouponInput, OrderSummary
├── checkout/               # CheckoutForm, CheckoutSummary, COD badge
├── order/                  # Confirmation components
└── admin/                  # AdminLayout, forms, tables, charts, team/, messages/, voice/

lib/
├── admin/                  # auth, guards, permissions, commission, nav, messages, voice utils
├── data/                   # Re-exports from lib/db (backward compat)
├── db/                     # Supabase data access + mappers
│   └── admin/              # Admin-only queries (orders, team, analytics, messages, voice, …)
├── email/                  # send-message-alert.ts (Resend)
├── supabase/               # browser, server, server-auth, middleware clients
├── cart/                   # CartProvider + session cookie
├── pricing.ts              # computeDisplayPrice, coupon discount
├── orders/                 # Order number generation
├── types.ts
└── constants.ts

middleware.ts               # Supabase Auth session refresh + /admin guard + active check

supabase/
├── migrations/001_initial_schema.sql
├── migrations/002_admin_auth.sql
├── migrations/003_admin_rbac.sql
├── migrations/004_admin_messages.sql
├── migrations/005_admin_voice_calls.sql
└── seed.sql

scripts/seed-admin.mjs      # Create Supabase Auth Super Admin user
```

---

## Admin Setup Checklist

1. Apply `001_initial_schema.sql` through `005_admin_voice_calls.sql` to Supabase
2. Run `supabase/seed.sql` for products/sales/coupons
3. Copy `.env.example` → `.env.local` with Supabase keys + optional Resend vars
4. Run `ADMIN_SEED_EMAIL=... ADMIN_SEED_PASSWORD=... npm run admin:seed`
5. Visit `/admin/login` and sign in as Super Admin
6. Create staff accounts from `/admin/team/new` and assign role templates / permissions

---

## Verification Checklist (Module 05)

- [ ] Apply migration `004_admin_messages.sql` to Supabase
- [ ] Manager template pre-checks **Create message groups**; Sales does not
- [ ] Staff A can DM staff B; duplicate pair reuses one conversation
- [ ] User with `create_message_groups` creates group with 3+ members
- [ ] Super Admin Audit tab lists non-member threads; composer hidden, send returns 403
- [ ] Attachments, product/order shares, sent time, edit, Realtime work in thread
- [ ] Dashboard shows unread messages card; sidebar badge updates
- [ ] First message in unread burst sends email; rapid messages debounced to one email
- [ ] Message send succeeds when `RESEND_API_KEY` is unset (dev skip)

## Verification Checklist (Module 06)

- [ ] Apply migration `005_admin_voice_calls.sql` to Supabase
- [ ] Call button visible in DM/group for members; hidden in Super Admin audit threads
- [ ] Callee sees incoming overlay + ringtone on `/admin/dashboard` (not only Messages)
- [ ] DM accept connects audio; decline/cancel/45s timeout/end tear down correctly
- [ ] Group rings all members; 2+ joined enters active; 7th join rejected; mesh audio among joined
- [ ] Second call attempt blocked with *Pehle current call khatam karein.*
- [ ] `GET /api/admin/voice/ice-servers` returns STUN; TURN when env set
- [ ] Mic mute/unmute works; permission denial shows clear error

---

*Shahkar.store — Har Desi Masle Ka Hal*
