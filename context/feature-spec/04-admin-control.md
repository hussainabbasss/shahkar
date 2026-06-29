# Feature Spec — 04 Admin Control (RBAC, Team Orders & Commission)

read `AGENTS.md` before starting

**Module:** Role-based admin access, manual order entry, per-user analytics, and commission tracking  
**Version:** 1.0  
**Last Updated:** June 29, 2026  
**References:** `context/feature-spec/03-admin-panel.md`, `context/progress-tracker.md`, `supabase/migrations/002_admin_auth.sql`  
**Builds on:** Module 03 (Supabase Auth, `admin_profiles`, admin panel shell)

---

## What This Module Is

Extends the single-admin panel into a **team control center**. The store owner (Super Admin) creates staff accounts, assigns role templates (Manager, Sales, etc.), and toggles fine-grained permissions per person. Staff can **manually insert orders** from the orders page; every order records **who created it**. Non-admin users see analytics scoped to **their own inserted orders** plus commission earned. Super Admin sees everything, compares performance across employees, and configures commission eligibility per user.

This module does **not** change the customer storefront checkout flow — website orders continue to be created via Module 02; they simply have no `created_by` staff member (or `source = 'storefront'`).

---

## Language We Agree On

| Term | Definition |
|---|---|
| **Super Admin** | The primary store owner account. Full access to all data, all settings, team management, and employee comparison. Role slug: `admin`. |
| **Staff user** | Any authenticated `admin_profiles` account that is not Super Admin — Manager, Sales, or custom permission set. |
| **RBAC page** | `/admin/team` — where Super Admin creates users, picks role templates, and toggles individual permissions. |
| **Inserted order** | An order created manually by a staff user from `/admin/orders/new` (or equivalent create flow). Stored with `created_by` = that user's id and `source = 'manual'`. |
| **Storefront order** | Order placed by a customer via `/checkout`. `source = 'storefront'`, `created_by` is null. |
| **Own analytics** | Charts and tables filtered to orders where `created_by = current_user.id`. Used for staff; not for Super Admin global views. |
| **Commission** | Optional per-user earnings on **delivered** manually-inserted orders only. Toggled on/off by Super Admin per staff member. |
| **Commission period** | Calendar month (PKT). Tier counts reset on the 1st of each month — order #1 in March starts at tier 1 again even if the user had 30 delivered orders in February. |
| **Commission tiers** | Per-user rate brackets set by Super Admin on the RBAC page (e.g. orders 1–14 → Rs. 50, 15+ → Rs. 100). Not hardcoded globally. |
| **Mark delivered** | Permission to change an order's status to `delivered` (and potentially `returned`). Separate from general status-update permission. |

---

## Routes

```
/admin/team                          → staff list (Super Admin only)
/admin/team/new                      → create staff user + set permissions
/admin/team/[id]                     → edit user, permissions, commission toggle
/admin/team/[id]/analytics           → per-user analytics (own orders + commission)
/admin/team/compare                  → Super Admin: compare employees side-by-side

/admin/orders/new                    → manual order creation form (permission-gated)
/admin/orders                        → existing list; add "Created by" column + source badge
/admin/orders/[orderNumber]          → existing detail; show creator if manual

/admin/analytics                     → Super Admin: global (unchanged scope)
                                     → Staff: redirects or renders own-analytics view only
```

**Sidebar changes:**
- Super Admin: add **Team** nav item → `/admin/team`
- Staff: hide nav items they lack permission for; **Analytics** shows own data only

---

## Roles & Permission Model

### Role templates (starting presets — Super Admin can override any toggle)

| Role | Typical use | Default permissions |
|---|---|---|
| **admin** (Super Admin) | Store owner | All permissions; cannot be restricted |
| **manager** | Operations lead | Dashboard, products (view/edit), orders (view/create/update status/mark delivered), sales & coupons (view/edit), analytics (global), no team management |
| **sales** | Phone/WhatsApp sales | Dashboard (limited), orders (view/create), analytics (own only), no products/sales/coupons/team |
| **custom** | Anything else | Super Admin picks each permission individually on create/edit |

Role template is a **starting point** — Super Admin can add or remove any permission per user regardless of template.

### Permission keys (all toggled per user on RBAC page)

| Key | Controls |
|---|---|
| `view_dashboard` | Access `/admin/dashboard` |
| `view_products` | See products list |
| `manage_products` | Create, edit, delete products + image upload |
| `view_orders` | See orders list and detail |
| `create_orders` | Manual order entry (`/admin/orders/new`) |
| `update_order_status` | Change status (pending → confirmed → dispatched) |
| `mark_order_delivered` | Change status to `delivered` or `returned` |
| `view_sales` | See sales list |
| `manage_sales` | Create, edit, delete, duplicate sales |
| `view_coupons` | See coupons list |
| `manage_coupons` | Create, edit, delete, deactivate coupons |
| `view_analytics` | Access analytics section |
| `analytics_scope` | `own` (staff default) or `global` (manager/admin) — enum, not boolean |
| `manage_team` | Access `/admin/team` — create/edit users and permissions (Super Admin only in v1) |
| `commission_enabled` | User earns commission on their delivered manual orders |

**Enforcement:** Server actions and page loaders call `requirePermission(key)` after auth. UI hides nav/actions the user lacks; server always re-checks (never trust client).

---

## Database Changes

Migration: `003_admin_rbac.sql`

### Extend `admin_profiles`

```sql
ALTER TABLE admin_profiles
  DROP CONSTRAINT IF EXISTS admin_profiles_role_check;

ALTER TABLE admin_profiles
  ALTER COLUMN role SET DEFAULT 'sales';

ALTER TABLE admin_profiles
  ADD CONSTRAINT admin_profiles_role_check
  CHECK (role IN ('admin', 'manager', 'sales', 'custom'));

ALTER TABLE admin_profiles
  ADD COLUMN permissions jsonb NOT NULL DEFAULT '{}',
  ADD COLUMN commission_enabled boolean NOT NULL DEFAULT false,
  ADD COLUMN commission_config jsonb NOT NULL DEFAULT '{
    "reset_period": "monthly",
    "timezone": "Asia/Karachi",
    "tiers": [
      { "from_order": 1, "to_order": 14, "rate": 50 },
      { "from_order": 15, "to_order": null, "rate": 100 }
    ]
  }',
  ADD COLUMN active boolean NOT NULL DEFAULT true;
```

`permissions` stores the permission keys above as booleans (plus `analytics_scope`). Super Admin (`role = 'admin'`) ignores stored permissions — code treats admin as all-access.

`commission_config` shape:

```json
{
  "reset_period": "monthly",
  "timezone": "Asia/Karachi",
  "tiers": [
    { "from_order": 1, "to_order": 14, "rate": 50 },
    { "from_order": 15, "to_order": 30, "rate": 100 },
    { "from_order": 31, "to_order": null, "rate": 100 }
  ]
}
```

- `from_order` / `to_order` — inclusive bracket within the **current commission period** (monthly delivered-manual-order count). `to_order: null` = no upper limit (31+ stays at Rs. 100 until admin changes it).
- `rate` — PKR per delivered manual order in that bracket.
- Tiers must be contiguous, non-overlapping, and validated on save (server rejects gaps or overlaps).
- Default preset when enabling commission: 1–14 @ Rs. 50, 15+ @ Rs. 100.

### Extend `orders`

```sql
ALTER TABLE orders
  ADD COLUMN source text NOT NULL DEFAULT 'storefront'
    CHECK (source IN ('storefront', 'manual')),
  ADD COLUMN created_by uuid REFERENCES admin_profiles(id) ON DELETE SET NULL;

CREATE INDEX idx_orders_created_by ON orders(created_by);
CREATE INDEX idx_orders_source ON orders(source);
```

- **Storefront checkout:** `source = 'storefront'`, `created_by = null`
- **Manual entry:** `source = 'manual'`, `created_by = <staff user id>`

### Optional: commission ledger (recommended for audit)

```sql
CREATE TABLE commission_entries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES admin_profiles(id) ON DELETE CASCADE,
  order_id uuid NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  amount numeric NOT NULL,
  period_month date NOT NULL,
  period_order_number integer NOT NULL,
  tier_from_order integer NOT NULL,
  tier_to_order integer,
  tier_rate numeric NOT NULL,
  delivered_at timestamptz NOT NULL,
  created_at timestamptz DEFAULT now(),
  UNIQUE (order_id)
);

CREATE INDEX idx_commission_entries_user_period ON commission_entries(user_id, period_month);
```

Populated when an order transitions to `delivered` (server action), if `commission_enabled` for `created_by` and `source = 'manual'`. Reversal on `returned` removes or voids the entry.

`period_month` = first day of the calendar month (PKT) when the order was marked delivered. `period_order_number` = that user's Nth delivered manual order **in that month** (used to pick the tier from `commission_config`).

---

## Commission Rules

Enabled only when Super Admin turns on **Commission** for that user on the RBAC page. Super Admin configures **tier brackets and rates per user** on the same RBAC form (`commission_config`).

**Eligible orders:** `source = 'manual'` AND `created_by = user` AND `status = 'delivered'`.

**Period reset:** Tiers count **delivered manual orders per calendar month** (timezone: Asia/Karachi). On the 1st of each month, the user's period order count resets to 0 — their next delivered order is again order #1 for tier lookup.

**Default tier preset** (applied when commission is first enabled; admin can edit):

| Delivered manual order # (this month) | Rate per order |
|---|---|
| 1 – 14 | Rs. 50 |
| 15 – 30 | Rs. 100 |
| 31+ | Rs. 100 |

**Admin-configurable tiers (RBAC page):**
- Super Admin can add, edit, or remove tier rows per user
- Each row: **From order #**, **To order #** (blank = unlimited), **Rate (Rs.)**
- Example custom setup: 1–10 @ Rs. 40, 11–25 @ Rs. 75, 26+ @ Rs. 120
- Changes apply to **future** deliveries only — already-recorded `commission_entries` are not recalculated

**Calculation on deliver:**
1. Resolve `period_month` from delivery timestamp (PKT)
2. Count user's existing delivered manual orders this month (excluding current order) → `period_order_number = count + 1`
3. Look up matching tier in user's `commission_config.tiers`
4. Write `commission_entries` row with amount = tier rate

**Examples (default tiers, single month):**
- User has 10 delivered manual orders in March → 10 × Rs. 50 = **Rs. 500**
- User reaches 20 in March → (14 × 50) + (6 × 100) = **Rs. 1,300**
- April 1st: count resets; first March delivered order in April is tier 1 again (Rs. 50)

Commission accrues **only when status becomes `delivered`**, not at order creation. If status reverts to `returned`, commission for that order is removed from totals.

Staff without `mark_order_delivered` cannot mark orders delivered themselves; Super Admin or a user with that permission must do it for commission to apply.

---

## Feature Sections

### 4.1 Team / RBAC (`/admin/team`)

**Super Admin only** (`manage_team` — hard-coded to `role = 'admin'` in v1).

| Component | Responsibility |
|---|---|
| `TeamListTable` | Name, email, role template, commission on/off, active, last login (if available) |
| `CreateUserForm` | Email, temporary password, name, role template, permission toggles |
| `PermissionMatrix` | Checkboxes for every permission key + analytics scope radio |
| `CommissionToggle` | Enable/disable commission for this user |
| `CommissionTierEditor` | Dynamic tier rows: from order #, to order # (optional), rate Rs.; add/remove rows; shows monthly reset note |
| `MarkDeliveredToggle` | Maps to `mark_order_delivered` permission |

**Create user flow:**
1. Super Admin enters email, name, password (or invite link — out of scope v1)
2. Picks role template (Manager, Sales, Custom) — pre-fills permission matrix
3. Adjusts individual permissions
4. Toggles commission on/off; if on, configures tier brackets (defaults pre-filled)
5. Server creates Supabase Auth user + `admin_profiles` row (service role)

**Edit user:** Same form; can deactivate account (`active = false`) without deleting history.

---

### 4.2 Manual Order Creation (`/admin/orders/new`)

**Requires:** `create_orders`

| Field | Notes |
|---|---|
| Customer name, phone, city, address | Same as checkout |
| Instructions | Optional |
| Line items | **Catalog product picker only** — search/select from active products, set qty per line; no custom/free-form line items |
| Subtotal, discount, delivery fee, total | Auto-calculated; delivery default Rs. 200 |
| Coupon code | Optional; validate if `manage_coupons` or skip validation for admin entry |
| Initial status | Default `pending`; user with `mark_order_delivered` may set `delivered` directly |

On save:
- Generate `order_number` (existing SHA-XXXXXX generator)
- Set `source = 'manual'`, `created_by = current user id`
- Decrement stock (same as storefront order)
- If status set to `delivered` on create and commission applies → create commission entry

**Orders list additions:**
- Column: **Created by** — staff name or "Website" for storefront
- Badge: `Manual` / `Website`
- Filter: by creator (Super Admin only)

---

### 4.3 Per-User Analytics (`/admin/team/[id]/analytics` or scoped `/admin/analytics`)

**Staff with `analytics_scope = own`:**
- Revenue chart — only their inserted orders
- Orders chart — placed vs delivered vs returned (own only)
- Table: their orders with order #, customer, amount, status, date
- **Commission card:** total earned this month, delivered count this month, current tier + rate, breakdown by tier bracket, note when period resets

**Super Admin on user page:** same view for any staff member.

**Global `/admin/analytics`:** unchanged for Super Admin / users with `analytics_scope = global`.

---

### 4.4 Employee Comparison (`/admin/team/compare`)

**Super Admin only.**

| Component | Data |
|---|---|
| `EmployeeComparisonTable` | Rows = staff; columns = orders created, delivered, revenue, commission, conversion to delivered % |
| Date range filter | This week / month / custom |
| Bar chart | Orders by employee (optional) |

Compares **inserted (manual) orders** per employee. Storefront orders appear in a separate "Website" row or excluded from employee comparison (Super Admin global analytics still includes all).

---

### 4.5 Order Detail & Status Permissions

| Permission | Allowed transitions |
|---|---|
| `update_order_status` | pending → confirmed → dispatched |
| `mark_order_delivered` | → delivered, → returned |
| Neither | Read-only on order detail |

Super Admin: all transitions.

When status → `delivered`: run commission calculation if eligible.  
When status → `returned` from `delivered`: reverse commission entry.

---

## Auth & Middleware Updates

- `getAdminUser()` → return `role`, `permissions`, `commission_enabled`
- `requireAdmin()` → keep for any authenticated staff
- `requireSuperAdmin()` → `role === 'admin'`
- `requirePermission(key)` → check permissions map; admin bypasses
- Middleware: still guard `/admin/*`; permission checks in layouts/pages/actions
- Inactive users (`active = false`): reject login / force logout

---

## In Scope

- Migration `003_admin_rbac.sql` (profiles, orders columns, commission_entries)
- Permission helper library (`lib/admin/permissions.ts`)
- Team CRUD (create/edit/deactivate staff) via service role
- Permission matrix UI on RBAC page
- Role templates: admin, manager, sales, custom
- Manual order create form on orders section
- `created_by` + `source` on all orders; visible in list and detail
- Staff analytics scoped to own inserted orders
- Per-user commission tier config on RBAC page (`commission_config`)
- Commission calculation on delivered manual orders (monthly reset); display on user analytics
- `mark_order_delivered` as separate permission toggle
- Super Admin employee comparison view
- Sidebar and action buttons gated by permissions
- Server-side enforcement on every admin mutation

---

## Out of Scope

- Customer-facing changes
- Public signup for staff — Super Admin creates accounts only
- Email invite / password reset flows — manual password set v1
- Commission payout / wallet / bank transfer — reporting only
- Weekly or custom commission reset periods — monthly only in v1
- Audit log of permission changes — future
- Fine-grained per-field editing (e.g. edit phone but not address) — permission is per feature area
- RLS per staff user on Supabase — app-layer + service role checks (same pattern as Module 03)
- WhatsApp notifications on manual orders
- Bulk import of manual orders
- Custom / free-form line items on manual orders — catalog products only

---

## Assumptions

1. Commission tier counts **reset each calendar month** (PKT). Confirmed.
2. Default last tier is open-ended at Rs. 100 (orders 31+). Super Admin can change rate or add more tiers per user on RBAC page.
3. Commission applies to **manual** orders only, not storefront checkout orders.
4. Only Super Admin (`role = admin`) can access Team and Compare pages in v1.
5. `manager` template gets `analytics_scope = global`; `sales` gets `own`.
6. Manual orders use the same `orders` table and status workflow as storefront orders.
7. Existing Module 03 admin user seeded via `admin:seed` becomes Super Admin with full access.
8. Storefront orders are **hidden** from staff own-analytics (manual orders only) unless `analytics_scope = global`.
9. Manual orders use **catalog product picker only** — no custom line items. Confirmed.

---

## Verification Criteria

### RBAC & Team

- [ ] Super Admin can create staff user with email/password
- [ ] Role template pre-fills permissions; individual toggles persist
- [ ] Staff user without `view_products` cannot access `/admin/products` (redirect or 403)
- [ ] Deactivated user cannot log in
- [ ] Non-admin cannot access `/admin/team`

### Manual Orders

- [ ] User with `create_orders` can create order from `/admin/orders/new` using catalog product picker only
- [ ] Manual order line items must reference products from catalog (no free-form items)
- [ ] Created order has `source = manual` and `created_by` set
- [ ] Orders list shows creator name and Manual/Website badge
- [ ] Storefront checkout still sets `source = storefront`, `created_by = null`

### Permissions

- [ ] User without `mark_order_delivered` cannot set status to delivered (UI hidden + server rejects)
- [ ] User with `update_order_status` can set confirmed/dispatched only
- [ ] Super Admin can perform all actions regardless of stored permissions

### Analytics & Commission

- [ ] Sales user analytics shows only orders they created
- [ ] Super Admin global analytics includes all orders
- [ ] Commission disabled → no commission entries on deliver
- [ ] Super Admin can set custom commission tiers per user on RBAC page
- [ ] Invalid tier config (gaps/overlaps) rejected on save
- [ ] Commission enabled with defaults → Rs. 50 for orders 1–14, Rs. 100 for 15+ in current month
- [ ] Tier count resets on new calendar month (PKT)
- [ ] 15th delivered manual order in a month earns Rs. 100 (default config)
- [ ] Orders 31+ earn Rs. 100 with default open-ended tier
- [ ] Returned order removes commission from user total
- [ ] Commission summary shows current-month earned + tier breakdown on staff analytics

### Comparison

- [ ] Super Admin compare view shows per-employee order counts and commission
- [ ] Date filter updates comparison correctly

---

## Build Order

1. Migration `003_admin_rbac.sql` + types
2. `lib/admin/permissions.ts` — helpers, role templates, `requirePermission`
3. Extend `getAdminUser` / middleware for role + permissions
4. Team list + create/edit user + permission matrix UI
5. Gate existing admin nav and pages by permissions
6. `orders.created_by` / `source` — update checkout + admin order queries
7. Manual order create form + server action
8. Commission tier editor on RBAC page + validation
9. Commission engine (monthly period, configurable tiers, on status → delivered) + `commission_entries`
10. Scoped analytics for staff + commission card (current month)
11. Super Admin employee comparison page
12. Update `context/progress-tracker.md`

---

## Implementation Plan — Admin Control

### What we are building

A permission-controlled team layer on top of Module 03: Super Admin manages staff accounts and granular access, staff insert orders tied to their identity, analytics and commission reflect only their work, and Super Admin compares employee performance across the business.

### Decisions made

- **Permissions:** JSONB on `admin_profiles` with named keys; role templates are presets, not hard limits.
- **Order attribution:** `created_by` + `source` on `orders`; manual vs website clearly labeled.
- **Commission:** Opt-in per user; tiers and rates configured per user on RBAC page; default 1–14 @ Rs. 50, 15+ @ Rs. 100 (31+ stays Rs. 100); **resets each calendar month**; accrues on `delivered` only.
- **Mark delivered:** Separate permission from general status updates.
- **Analytics split:** `analytics_scope` = `own` | `global`; staff default to own inserted orders.
- **Super Admin:** `role = admin` always has full access; Team and Compare pages restricted to admin.
- **Manual order lines:** Catalog product picker only; prices from product/sale engine at time of entry.

### How to build it

See **Build Order** above. Start with schema and permission helpers, then Team UI, then manual orders and commission, then scoped analytics and comparison.

---

*Module 04 — Admin Control · Shahkar.store*
