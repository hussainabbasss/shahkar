# Feature Spec — 05 Admin Messages (Staff DMs, Group Chats & Super Admin Audit)

read `AGENTS.md` before starting

**Module:** Internal messaging between admin panel users — 1:1 DMs, group chats, attachments, RBAC-gated group creation, Super Admin audit  
**Version:** 1.4  
**Last Updated:** June 29, 2026  
**References:** `context/feature-spec/04-admin-control.md`, `context/progress-tracker.md`, `supabase/migrations/002_admin_auth.sql`, `supabase/migrations/003_admin_rbac.sql`  
**Builds on:** Module 04 (RBAC, `admin_profiles`, Supabase Auth sessions, admin shell)

---

## What This Module Is

Adds an internal **Messages** area to the admin panel so every active staff member can **direct-message any other active staff member** and participate in **group chats**. Users with the **`create_message_groups`** permission (configured on the RBAC / Team page) can create named groups and invite other staff. All conversations support text, images, and file attachments.

Super Admin can **see every conversation** (DMs and groups) for oversight but **cannot send messages inside threads they are not part of** (audit / read-only mode). The dashboard surfaces **new unread messages** so staff do not miss team communication. When a staff member receives new messages, they get **one email alert per unread burst** (not one email per individual message).

This module is **admin-only**. Customers and the storefront are unchanged.

---

## Language We Agree On

| Term | Definition |
|---|---|
| **Staff user** | Any active `admin_profiles` account — Super Admin, Manager, Sales, or Custom. |
| **Direct conversation (DM)** | A 1:1 thread between exactly two staff users. |
| **Group chat** | A named thread with **3 or more** members. Created only by users with `create_message_groups` (Super Admin always). |
| **Participant / member** | A staff user in a conversation's `admin_conversation_members` row. |
| **Group creator** | The staff user who created the group (`created_by` on the conversation). Can add members in v1. |
| **My inbox** | Conversations where the current user is a member; they can read and send. |
| **Audit view** | Super Admin-only list of **all** conversations they are **not** a member of, opened read-only. |
| **Read-only thread** | A conversation the viewer is not a member of. Messages visible; composer hidden. |
| **Unread message** | A message in a member conversation where `message.created_at > last_read_at` for that user. |
| **Attachment** | Image or document uploaded to Supabase Storage and linked to a message row. |
| **New messages (dashboard)** | Recent unread conversations for the logged-in user — preview snippet + link to open the thread. |
| **`create_message_groups`** | RBAC permission (checkbox on Team create/edit). Controls whether the user sees **New group** and can call `createGroup`. Does **not** block 1:1 DMs or sending in groups they were added to. |
| **Sent time** | `created_at` on each message — shown on every bubble (PKT). Original send time; unchanged when a message is edited. |
| **Edited message** | A message whose text `body` was changed by the **original sender** after send. Tracked via `edited_at`; shows an "edited" label next to the sent time. |
| **Shared entity** | A **product** or **order** attached to a message via the composer **+** menu. Rendered as a tappable card in the thread; opens a detail dialog on click. |
| **Entity snapshot** | JSON copy of key product/order fields at send time — powers the in-thread card even if live data changes later. |
| **Email alert** | Transactional email to a recipient when they have new unread messages in a conversation. **At most one email per unread burst** — not one per message. |
| **Unread burst** | Continuous stretch of unread messages in a conversation since the recipient last opened/read that thread. |

---

## Routes

```
/admin/messages                              → Messages hub (inbox + thread)
/admin/messages?with=<userId>                → Open or create DM with staff member
/admin/messages/<conversationId>             → Deep link to a specific thread

/admin/dashboard                             → existing; add "New Messages" card
/admin/team/new, /admin/team/[id]            → existing; add permission checkbox
```

**Sidebar:** **Messages** item — visible to **all authenticated active staff**. Unread count badge when > 0.

**Super Admin audit:** Same `/admin/messages` page with an **Audit** tab. Lists all conversations the viewer is not a member of (DMs and groups).

---

## RBAC — New Permission

### Permission key

| Key | Controls | Default by role template |
|---|---|---|
| `create_message_groups` | Show **New group** button; allow `createGroup` server action | See below |

**Enforcement:** `requirePermission('create_message_groups')` on group creation only. Super Admin bypasses (same as all permissions).

**Not gated by this permission:**
- 1:1 DMs (all active staff)
- Sending messages in groups the user belongs to
- Being added to a group by someone else

### Role template defaults (starting presets — Super Admin can override per user)

| Role | `create_message_groups` |
|---|---|
| **admin** (Super Admin) | Always yes (bypass) |
| **manager** | `true` |
| **sales** | `false` |
| **custom** | Super Admin picks on Team form |

### Team / RBAC UI changes

Add one checkbox to `PermissionMatrix` on `/admin/team/new` and `/admin/team/[id]`:

| Label | Key |
|---|---|
| Create message groups | `create_message_groups` |

Place under a new subsection **Messages** in the permission matrix (or append after Orders block).

**Files to update at implementation time:**
- `lib/admin/permissions.ts` — add key to `PermissionKey`, `AdminPermissions`, `PERMISSION_LABELS`, role templates
- `components/admin/team/PermissionMatrix.tsx` — render checkbox
- `context/feature-spec/04-admin-control.md` — cross-reference optional; permission lives in JSONB like others (no migration column needed)

---

## Access Model

| Actor | 1:1 DM any staff | Create group | Send in own threads | Read others' threads | Send in others' threads |
|---|---|---|---|---|---|
| Staff (no `create_message_groups`) | Yes | No | Yes (member) | No | No |
| Staff (with `create_message_groups`) | Yes | Yes | Yes (member) | No | No |
| Super Admin | Yes | Yes (bypass) | Yes (member) | Yes (audit tab) | **No** — read-only when not a member |
| Inactive user | No | No | No | No | No |

**Super Admin own threads:** When Super Admin is a member (DM or group they created or were added to), full send/receive.

**Super Admin audit threads:** Non-member view shows amber banner: *"Audit view — read only. Aap is conversation mein message nahi bhej sakte."* Composer disabled; server rejects send.

---

## UX Layout

### Messages page (`/admin/messages`)

Two-panel layout (stack on mobile: list → thread).

| Panel | Staff | Super Admin |
|---|---|---|
| **Left — tabs** | **Chats** | **Chats** + **Audit** |
| **Left — Chats header** | **New group** button if `create_message_groups`; staff search for 1:1 | Same + Audit tab |
| **Left — Chats list** | DMs + groups mixed, sorted by `last_message_at`; unread dot; group shows name + member count | Same |
| **Left — Audit list** | Hidden | All conversations viewer is **not** in; label: DM = "A ↔ B", group = group name + members |
| **Right — thread header** | DM: other person's name; Group: name + member avatars/names | Same |
| **Right — thread body** | Bubbles, attachments, composer (if member) | Member = composer; audit = read-only |

**Mobile:** Full-width list; tap opens thread with back button.

### Create group flow

**Requires:** `create_message_groups` (UI hidden + server enforced).

| Step | UI |
|---|---|
| 1 | Modal or slide-over: **Group name** (required, max 80 chars) |
| 2 | Multi-select active staff (min **2** others — creator is added automatically → **3+ members** total) |
| 3 | **Create** → `createGroup` → open new thread |

Creator is stored as `created_by` and inserted as first member. Group creator can **add members** later via thread header menu (v1 — no remove member in v1).

### Message composer

The composer has a **+** button (left of the text input) that opens an attach menu. Text input and **Send** stay as today.

#### + Attach menu

| Menu item | Icon | Requires | Action |
|---|---|---|---|
| **Attachment** | Paperclip | — | File picker (images + documents) — existing behavior |
| **Product** | Package | `view_products` | Opens product picker sheet |
| **Order** | Receipt | `view_orders` | Opens order picker sheet |

Items the user lacks permission for are **hidden** (not disabled). Super Admin sees all three.

**Pending chips:** Selected attachments, products, and orders appear as removable chips above the text input before send. User can combine text + any mix in one message.

| Control | Behavior |
|---|---|
| Text input | Optional if message has attachments, products, or orders; max 4,000 chars |
| **+** menu | Attachment / Product / Order (permission-gated) |
| Attach image | jpeg, png, webp, gif — max 5 MB each |
| Attach file | pdf, doc, docx, xls, xlsx — max 10 MB each |
| Product picker | Search by name; tap to add; max **3 products** per message |
| Order picker | Search by order #, phone, customer name; tap to add; max **3 orders** per message |
| Send | Disabled while uploading; requires body and/or ≥1 attachment and/or ≥1 entity |
| Limits | Max 5 file attachments + max 3 products + max 3 orders per message |

**Images:** Inline thumbnail; tap for lightbox.  
**Files:** Download link with filename + size.

### Shared product & order cards (in thread)

Messages can include zero or more **shared entities**, rendered below the text body (if any) as compact cards.

#### Product card (in bubble)

| Field | Source |
|---|---|
| Thumbnail | First image from snapshot |
| Name | `snapshot.name` |
| Price | `snapshot.displayPrice` (PKR, sale-aware at send time) |
| Stock badge | `In stock` / `Low stock` / `Out of stock` from snapshot |

Label above card: **Product** (muted). Entire card is clickable.

#### Order card (in bubble)

| Field | Source |
|---|---|
| Order number | `snapshot.orderNumber` (e.g. SHA-482910) |
| Customer | `snapshot.customerName` |
| Total | `snapshot.total` (PKR) |
| Status badge | `snapshot.status` (pending / confirmed / …) |
| Source badge | `Manual` / `Website` from snapshot |

Label above card: **Order** (muted). Entire card is clickable.

#### Detail dialog (on card click)

Opens a modal / dialog — **does not navigate away** from the messages page.

**Product dialog** (`SharedProductDetailDialog`):
- Fetches **live** product via server action (permission: `view_products` or Super Admin)
- Shows: image gallery, name, prices (current sale-aware), stock, category, description excerpt, feature bullets
- Link: **"Admin mein kholo"** → `/admin/products/[id]/edit` (if `manage_products`)
- If product deleted: show snapshot only + "Product ab available nahi"
- If viewer lacks `view_products`: show snapshot card only + "Full detail ke liye permission chahiye"

**Order dialog** (`SharedOrderDetailDialog`):
- Fetches **live** order via server action (permission: `view_orders` or Super Admin)
- Shows: order number, status (with badge), customer name/phone/city/address, line items (image, name, qty, price), subtotal/discount/delivery/total, coupon, PostEx tracking, internal notes, created-by if manual
- Link: **"Admin mein kholo"** → `/admin/orders/[orderNumber]` (if `view_orders`)
- If order not found: snapshot only + note
- Staff with `analytics_scope = own` may only open orders they created **or** any order shared in a thread they are in (shared context grants read for that order in the dialog)

**Audit view:** Super Admin can open dialogs read-only (same as participant); no edit actions in dialog.

**Realtime:** Shared entities are part of the message INSERT payload — no separate subscription.

### Message bubbles — sent time & edit

Every message displays its **sent time** (`created_at`, timezone **Asia/Karachi**).

| Context | Display |
|---|---|
| **DM — own message** | Body + time below bubble (e.g. `3:42 PM`); if edited: `3:42 PM · edited` |
| **DM — other's message** | Same — time always visible |
| **Group** | Sender name above bubble + body + time (+ `edited` if applicable) |
| **Today** | `h:mm A` (e.g. `3:42 PM`) |
| **Yesterday** | `Yesterday, h:mm A` |
| **Older (same year)** | `MMM D, h:mm A` (e.g. `Jun 28, 3:42 PM`) |
| **Older (prior year)** | `MMM D, YYYY, h:mm A` |
| **Tooltip / long-press** | Full datetime: `Jun 29, 2026, 3:42:15 PM PKT` |

Use a shared formatter in `lib/admin/messages.ts` (e.g. `formatMessageTime(iso, now)`).

### Edit message (sender only)

Only the user who **sent** the message can edit it. No RBAC permission — ownership is the gate.

| Rule | Behavior |
|---|---|
| Who can edit | `message.sender_id === currentUser.id` only |
| What can be edited | **Text body** only — attachments and shared products/orders cannot be added, removed, or replaced in v1 |
| When | Any time after send (no edit window limit in v1) |
| Audit view | No edit controls — Super Admin in read-only mode cannot edit others' messages |
| Empty body | Rejected if message has no attachments **and** no shared entities; if attachments or entities exist, body may be cleared |
| Indicator | Set `edited_at = now()` on save; UI shows `· edited` next to sent time |
| Edit history | Not stored in v1 — only latest body + `edited_at` |

**UI flow:**
1. On **own** text messages: **⋮** menu or pencil icon on hover (desktop) / long-press (mobile) → **Edit**
2. Bubble becomes inline textarea (or small modal on mobile) with current body pre-filled
3. **Save** / **Cancel** — Save calls `editMessage`; Realtime broadcasts UPDATE to other members
4. Other users' messages: no edit affordance

### Dashboard widget

On `/admin/dashboard` for staff with `view_dashboard`:

| Component | Data |
|---|---|
| `NewMessagesCard` | Up to 5 unread conversations: DM = other party name; group = group name; preview + time |
| Empty state | "Koi nayi message nahi" |
| CTA | "Saari messages dekho" → `/admin/messages` |

Sidebar **Messages** nav badge = total unread across DMs and groups.

---

## Email alerts (new message)

When a staff member receives a new message, send a **transactional email** to alert them. The goal is awareness — not a copy of every message.

### When to send

Trigger on **`sendMessage`** only (new messages). **Do not** email on `editMessage`.

For each **recipient** in the conversation (all members except the sender):

| Condition | Send email? |
|---|---|
| First message in thread while conversation is unread for them | **Yes** |
| Sender sends 2nd, 3rd, … message before recipient reads | **No** — same unread burst |
| Recipient opens thread (`markConversationRead`), then sender messages again | **Yes** — new burst |
| Recipient is inactive | **No** |
| Sender emails themselves | **No** (sender excluded) |

### Debounce rule (one email per unread burst)

Track `last_notified_at` per user per conversation on `admin_conversation_reads`.

```
Send email when:
  last_notified_at IS NULL
  OR last_read_at > last_notified_at

After sending:
  SET last_notified_at = now()

Do not send when:
  last_notified_at >= last_read_at   -- already notified for current unread stretch
```

**Read row bootstrap:** If no `admin_conversation_reads` row exists for the recipient, treat as unread (`last_notified_at` null → send). On notify, upsert the row and set `last_notified_at = now()` **without** advancing `last_read_at` (only `markConversationRead` updates `last_read_at`).

**Example:** Ali sends 5 messages to Sara without Sara opening the thread → **1 email**. Sara reads, then Ali sends again → **1 more email**.

### Email content

| Field | Value |
|---|---|
| **To** | `admin_profiles.email` of recipient |
| **From** | `EMAIL_FROM` env (e.g. `Shahkar Admin <noreply@shahkar.store>`) |
| **Subject (DM)** | `Nayi message — {senderName} ne aap ko message bheja` |
| **Subject (group)** | `Nayi message — {senderName} ne "{groupName}" mein message bheja` |
| **Body** | Short Roman Urdu text: who messaged, conversation type, CTA button **"Messages kholo"** → `{APP_URL}/admin/messages/{conversationId}` |
| **Not included** | Message body text, attachments, product/order details (privacy + keep email simple) |

### Delivery implementation

| Piece | Choice |
|---|---|
| Provider | **Resend** via `resend` package (v1); `RESEND_API_KEY` + `EMAIL_FROM` in `.env.local` |
| Module | `lib/email/send-message-alert.ts` |
| Invocation | Called **after** successful `sendMessage` insert — `void notifyMessageRecipients(...)` (non-blocking; failures logged, message send still succeeds) |
| `APP_URL` | `NEXT_PUBLIC_APP_URL` or `VERCEL_URL` fallback for link in email |

**Failure handling:** Log error server-side; never roll back the message if email fails.

### Env vars (add to `.env.example`)

```
RESEND_API_KEY=
EMAIL_FROM=Shahkar Admin <noreply@shahkar.store>
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

If `RESEND_API_KEY` is missing in dev, skip email silently and log once (same pattern as optional Supabase).

---

## Database Changes

Migration: `004_admin_messages.sql`

### Tables

```sql
CREATE TABLE admin_conversations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  type text NOT NULL CHECK (type IN ('dm', 'group')),
  name text,  -- required for group; null for dm
  created_by uuid REFERENCES admin_profiles(id) ON DELETE SET NULL,
  -- DM dedup: canonical pair (null when type = 'group')
  participant_low uuid REFERENCES admin_profiles(id) ON DELETE CASCADE,
  participant_high uuid REFERENCES admin_profiles(id) ON DELETE CASCADE,
  last_message_at timestamptz,
  last_message_preview text,
  created_at timestamptz DEFAULT now(),
  CONSTRAINT admin_conversations_dm_pair_unique
    UNIQUE (participant_low, participant_high),
  CONSTRAINT admin_conversations_dm_pair_check CHECK (
    (type = 'dm' AND participant_low IS NOT NULL AND participant_high IS NOT NULL
     AND participant_low < participant_high AND name IS NULL)
    OR
    (type = 'group' AND participant_low IS NULL AND participant_high IS NULL
     AND name IS NOT NULL AND length(trim(name)) > 0)
  )
);

CREATE INDEX idx_admin_conversations_last_message
  ON admin_conversations(last_message_at DESC NULLS LAST);

CREATE INDEX idx_admin_conversations_type
  ON admin_conversations(type);

-- Members for all conversation types (DM: exactly 2 rows; group: 3+)
CREATE TABLE admin_conversation_members (
  conversation_id uuid NOT NULL REFERENCES admin_conversations(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES admin_profiles(id) ON DELETE CASCADE,
  joined_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (conversation_id, user_id)
);

CREATE INDEX idx_admin_conversation_members_user
  ON admin_conversation_members(user_id);

CREATE TABLE admin_conversation_reads (
  conversation_id uuid NOT NULL REFERENCES admin_conversations(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES admin_profiles(id) ON DELETE CASCADE,
  last_read_at timestamptz NOT NULL DEFAULT now(),
  last_notified_at timestamptz,  -- last email alert sent for this conversation
  PRIMARY KEY (conversation_id, user_id)
);

CREATE TABLE admin_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id uuid NOT NULL REFERENCES admin_conversations(id) ON DELETE CASCADE,
  sender_id uuid NOT NULL REFERENCES admin_profiles(id) ON DELETE CASCADE,
  body text,
  created_at timestamptz NOT NULL DEFAULT now(),
  edited_at timestamptz  -- null until first edit; sent time stays created_at
);

CREATE INDEX idx_admin_messages_conversation_created
  ON admin_messages(conversation_id, created_at);

CREATE TABLE admin_message_attachments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  message_id uuid NOT NULL REFERENCES admin_messages(id) ON DELETE CASCADE,
  storage_path text NOT NULL,
  file_name text NOT NULL,
  mime_type text NOT NULL,
  size_bytes integer NOT NULL CHECK (size_bytes > 0),
  created_at timestamptz DEFAULT now()
);

CREATE INDEX idx_admin_message_attachments_message
  ON admin_message_attachments(message_id);

-- Shared products / orders (references + send-time snapshot for card UI)
CREATE TABLE admin_message_entities (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  message_id uuid NOT NULL REFERENCES admin_messages(id) ON DELETE CASCADE,
  entity_type text NOT NULL CHECK (entity_type IN ('product', 'order')),
  entity_id uuid NOT NULL,
  snapshot jsonb NOT NULL,
  sort_order smallint NOT NULL DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX idx_admin_message_entities_message
  ON admin_message_entities(message_id);

CREATE INDEX idx_admin_message_entities_lookup
  ON admin_message_entities(entity_type, entity_id);
```

**`snapshot` shapes (stored at send time):**

```json
// product
{
  "id": "uuid",
  "name": "Hair Remover",
  "slug": "hair-remover",
  "image": "https://...",
  "displayPrice": 1299,
  "originalPrice": 1599,
  "stock": 42,
  "active": true
}

// order
{
  "id": "uuid",
  "orderNumber": "SHA-482910",
  "customerName": "Ayesha Khan",
  "customerPhone": "03001234567",
  "total": 2499,
  "status": "pending",
  "source": "manual",
  "lineItemCount": 2
}
```

**DM identity:** `getOrCreateDm(userA, userB)` → sort UUIDs → `participant_low`, `participant_high` → insert `type = 'dm'` + two `admin_conversation_members` rows on conflict do nothing / return existing.

**Group identity:** `createGroup({ name, memberIds, createdBy })` → insert `type = 'group'`, `created_by`, members = creator + selected ids (dedupe, min 3 total).

**Membership check:** `isMember(conversationId, userId)` via `admin_conversation_members` (not dm pair columns alone).

**Message body:** Nullable when attachments or entities present; server requires non-empty body OR ≥1 attachment OR ≥1 entity.

**Denormalized preview:** On insert message, update `last_message_at`, `last_message_preview`:
- Text snippet if body present
- Else first entity: `📦 Product: {name}` or `🧾 Order: {orderNumber}`
- Else `📎 Attachment`
- Groups prefix optional: `Ali: …`
On **edit**, if the edited message is the latest by `created_at`, refresh preview from new body (entities unchanged).

**Edit columns:** `created_at` = original send time (never changes). `edited_at` = last edit time (null if never edited).

### Storage bucket

Same as v1.0 — private `message-attachments` bucket, path `{conversation_id}/{message_id}/{uuid}.{ext}`.

### Realtime

Enable on `admin_messages` (INSERT + **UPDATE** for edits) and optionally `admin_conversations` for list preview updates.

---

## RLS Policies (Supabase)

```sql
-- admin_conversations SELECT: member OR Super Admin
-- admin_conversation_members SELECT: member OR Super Admin
-- admin_messages SELECT: member OR Super Admin
-- admin_messages INSERT: sender_id = auth.uid() AND is member
-- admin_messages UPDATE: sender_id = auth.uid() AND is member (body + edited_at only)
-- admin_conversation_reads: user_id = auth.uid()
-- admin_message_attachments SELECT: via message → member OR Super Admin
-- admin_message_entities SELECT: via message → member OR Super Admin
```

Mutations via server actions (service role) with `requireAdmin`, `isMember`, `requirePermission('create_message_groups')` for group create, `hasPermission('view_products'|'view_orders')` for entity pickers and detail fetches.

---

## Server Actions & Data Layer

### New files

```
lib/db/admin/messages.ts
lib/admin/messages.ts             — isMember, canSend, isAuditView, canonicalDmPair, shouldSendEmailAlert
lib/email/send-message-alert.ts   — Resend transactional email
app/actions/admin/messages.ts     — sendMessage, editMessage, createGroup, addGroupMembers, markRead, upload
components/admin/messages/
  MessagesLayout, ConversationList, MessageThread, MessageBubble, MessageComposer,
  ComposerAttachMenu, ProductPickerSheet, OrderPickerSheet,
  SharedProductCard, SharedOrderCard, SharedProductDetailDialog, SharedOrderDetailDialog,
  CreateGroupModal, GroupHeader, AuditTab, NewMessagesCard
app/admin/messages/page.tsx
```

### Key functions

| Function | Responsibility |
|---|---|
| `listActiveStaff(excludeSelf)` | Active staff for directory + group picker |
| `listMyConversations(userId)` | DMs + groups with unread count, preview, labels |
| `listAuditConversations()` | Super Admin: conversations where user is not a member |
| `getOrCreateDm(userA, userB)` | Canonical pair + ensure 2 member rows |
| `createGroup({ name, memberIds })` | Requires `create_message_groups`; min 3 members |
| `addGroupMembers(conversationId, userIds)` | Creator only; group type only; dedupe |
| `getConversationMembers(conversationId)` | For group header |
| `getMessages(conversationId, cursor?)` | Paginated with attachments + entities |
| `searchProductsForShare(query)` | Active products; requires `view_products` |
| `searchOrdersForShare(query)` | Orders by #/phone/name; requires `view_orders`; respect own-scope unless global |
| `buildProductSnapshot(product)` | Sale-aware price for entity row |
| `buildOrderSnapshot(order)` | Minimal card + dialog fields |
| `getSharedProductDetail(productId)` | Live product for dialog |
| `getSharedOrderDetail(orderId)` | Live order for dialog; scope check |
| `sendMessage(...)` | Member only; body and/or attachments and/or entity ids |
| `editMessage({ messageId, body })` | Sender only; update body + `edited_at`; refresh preview if latest |
| `formatMessageTime(createdAt)` | PKT-relative display for bubbles |
| `markConversationRead(conversationId)` | Upsert read cursor |
| `getUnreadSummary(userId, limit)` | Dashboard + nav badge |
| `uploadMessageAttachment(...)` | Storage upload |
| `shouldSendEmailAlert(lastReadAt, lastNotifiedAt)` | Unread-burst debounce check |
| `notifyMessageRecipients({ conversation, message, sender })` | Email all eligible members; update `last_notified_at` |

### Send validation (server)

1. `requireAdmin()` — active user
2. `isMember(currentUser, conversationId)` → else 403
3. Super Admin not a member → 403 on send (audit)
4. Body / attachment / entity validation (see limits above)
5. Verify each `productId` exists and sender has `view_products`; each `orderId` exists and sender has `view_orders` (+ own-scope if applicable)
6. Insert message; insert attachment rows; insert entity rows with snapshots
7. Update preview; Realtime broadcasts
8. `void notifyMessageRecipients(...)` — email eligible recipients (non-blocking)

### Share entity validation (server)

| Entity | Picker / send | Detail dialog |
|---|---|---|
| **Product** | `hasPermission(user, 'view_products')` | Live fetch with same permission; else snapshot-only |
| **Order** | `hasPermission(user, 'view_orders')`; staff with `analytics_scope = own` see only own `created_by` orders in picker | Live fetch if `view_orders` + (global scope OR `created_by` OR order appears in a message in a conversation user is member of) |

Super Admin: bypass all permission checks.

### Create group validation (server)

1. `requirePermission('create_message_groups')`
2. Name trimmed, 1–80 chars
3. `memberIds` unique, all active staff, not including self twice
4. Total members ≥ 3 (creator + at least 2 others)
5. Insert conversation + member rows in transaction

### Edit validation (server)

1. `requireAdmin()` — active user
2. Load message + conversation; `message.sender_id === currentUser.id` → else 403
3. `isMember(currentUser, conversationId)` → else 403
4. Trim body; max 4,000 chars; reject if empty and no attachments and no entities
5. `UPDATE body, edited_at = now()` — do **not** change `created_at`
6. If this message is the latest in the thread, update `last_message_preview`
7. Realtime broadcasts UPDATE

---

## Auth & Middleware

- `/admin/messages` behind existing admin auth
- `requireAdmin()` on all message actions
- Audit tab: `isSuperAdmin(user)`
- `create_message_groups` on Team form persists to `admin_profiles.permissions` JSONB (no new DB column)

---

## In Scope

- Migration `004_admin_messages.sql`
- 1:1 DMs + group chats (create, message, list)
- RBAC checkbox **`create_message_groups`** on Team create/edit + role template defaults
- Group creator can add members (v1)
- Super Admin audit tab (DMs + groups), read-only when not a member
- Dashboard unread card + sidebar badge
- Attachments, Realtime, mobile layout
- **Sent time** on every message bubble (PKT formatting)
- **Edit message** — sender-only, text body, `edited_at` indicator
- **+ composer menu** — attachments, share products, share orders (permission-gated pickers)
- **Shared entity cards** + **detail dialogs** on click (live data when permitted)
- **Email alerts** — one per unread burst via Resend; `last_notified_at` debounce
- Server enforcement on all mutations

---

## Out of Scope

- Customer messaging
- WhatsApp / push / in-app browser notifications
- Per-message email (full message body in email)
- User opt-out / mute email per conversation (future)
- @mentions, reactions, threads/replies
- Message delete
- Edit history / version log
- Editing attachments or shared entities (add/remove/replace)
- Deep-linking shared cards to storefront product pages (admin context only)
- Remove member from group / leave group (v1)
- Rename group (v1 — create with correct name)
- Transfer group ownership
- Typing indicators / per-message read receipts
- Search message bodies
- `use_messages` gate for all messaging — DMs remain open to all active staff
- End-to-end encryption
- Auto-delete / retention policies

---

## Assumptions

1. **DMs:** all active staff; **groups:** create requires `create_message_groups`; participate if member.
2. **Minimum group size:** 3 members (creator + 2 others).
3. **Super Admin** audits all non-member threads; cannot send there.
4. **Inactive users** excluded from directory and member pickers.
5. **Permission** stored in existing `permissions` JSONB — update `lib/admin/permissions.ts` only.
6. **Manager** template defaults `create_message_groups: true`; **Sales** defaults `false`.
7. **Sent time** always shows `created_at` (original send), not `edited_at`.
8. **Only the sender** can edit; no time limit on edits in v1.
9. **Share product** requires `view_products`; **share order** requires `view_orders`.
10. **Entity snapshot** is immutable after send; dialog may show fresher live data.
11. **Email** uses `admin_profiles.email`; skipped when `RESEND_API_KEY` unset (dev).
12. **One email per unread burst** — not per message; edits do not trigger email.

---

## Verification Criteria

### RBAC

- [ ] Super Admin can toggle `create_message_groups` per user on Team edit
- [ ] Manager template pre-checks **Create message groups**; Sales does not
- [ ] User without permission does not see **New group** button
- [ ] `createGroup` server action returns 403 without permission
- [ ] User without permission can still DM and send in groups they belong to

### DMs

- [ ] Staff A can DM staff B; duplicate pair reuses one conversation
- [ ] User C cannot read A↔B unless C is Super Admin or a member

### Groups

- [ ] User with permission creates group with name + 2+ others (3+ total)
- [ ] Group appears in all members' chat lists
- [ ] Any member can send messages in the group
- [ ] Creator can add a new member from thread header
- [ ] Group with < 3 members rejected on create

### Audit

- [ ] Super Admin Audit tab lists non-member DMs and groups
- [ ] Audit thread: messages visible, composer hidden, send returns 403
- [ ] Super Admin member of a group can send normally in that group

### Attachments, unread, realtime

- [ ] Image inline + file download work in DM and group
- [ ] Unread badge on dashboard, sidebar, and per-conversation
- [ ] Realtime delivers new messages without full refresh

### Sent time & edit

- [ ] Every message bubble shows sent time in PKT (today / yesterday / date rules)
- [ ] Group messages show sender name + sent time
- [ ] Sender sees **Edit** on own text messages only
- [ ] `editMessage` succeeds for sender; returns 403 for non-sender
- [ ] After edit: `edited_at` set; UI shows `· edited`; `created_at` unchanged
- [ ] Edited latest message updates conversation list preview
- [ ] Realtime UPDATE refreshes edited bubble for other members
- [ ] Super Admin in audit view cannot edit any message
- [ ] Attachment-only message: body cannot be emptied without attachments or entities remaining

### Share products & orders

- [ ] **+** menu shows Attachment always; Product only with `view_products`; Order only with `view_orders`
- [ ] Product picker search adds chip; max 3 products per message enforced
- [ ] Order picker search adds chip; max 3 orders per message enforced
- [ ] Send with product/order only (no text) works; preview shows `📦 Product: …` or `🧾 Order: …`
- [ ] Product card in thread shows image, name, price; click opens dialog with live details
- [ ] Order card shows order #, customer, total, status; click opens dialog with line items
- [ ] Dialog **Admin mein kholo** links work for users with manage/view access
- [ ] User without `view_products` sees snapshot-only product dialog (no live fetch)
- [ ] Sales user with own scope can share and open their manual orders; cannot pick others' orders in picker
- [ ] Shared order in DM grants recipient dialog access even if own-scope (conversation context)
- [ ] Deleted product/order: card still renders from snapshot with unavailable note

### Email alerts

- [ ] First new message in unread burst sends email to recipient
- [ ] 5 rapid messages from same sender → **1 email** total until recipient reads
- [ ] After recipient reads, next message sends a **new** email
- [ ] `editMessage` does **not** send email
- [ ] Group email subject includes group name + sender name
- [ ] DM email subject includes sender name
- [ ] Email CTA link opens correct conversation in `/admin/messages`
- [ ] Message send succeeds even if Resend fails
- [ ] No email sent when `RESEND_API_KEY` missing (dev skip)
- [ ] Sender does not receive email for their own message
- [ ] Inactive recipient does not receive email

---

## Build Order

1. Migration `004_admin_messages.sql`
2. `lib/admin/permissions.ts` — add `create_message_groups` + role template defaults
3. `PermissionMatrix` — Messages checkbox on Team forms
4. Types, mappers, `lib/admin/messages.ts`, `lib/db/admin/messages.ts`
5. `app/actions/admin/messages.ts` — DM, group, send, read, upload
6. Messages UI — list, thread, `MessageBubble`, `ComposerAttachMenu`, file attachments
7. `ProductPickerSheet`, `OrderPickerSheet`, entity chips, `sendMessage` with entities + snapshots
8. `SharedProductCard` / `SharedOrderCard` + detail dialogs
9. `editMessage` action + inline edit UI + Realtime UPDATE handler
10. `CreateGroupModal` + `GroupHeader` + `addGroupMembers`
11. Super Admin `AuditTab` + read-only mode
12. Realtime hook (INSERT + UPDATE)
13. Sidebar badge + `NewMessagesCard` on dashboard
14. `lib/email/send-message-alert.ts` + `notifyMessageRecipients` debounce logic
15. Update `.env.example` + `context/progress-tracker.md`

---

## Implementation Plan — Admin Messages

### What we are building

Internal staff messaging: 1:1 DMs, group chats, attachments, share products/orders, detail dialogs, sent timestamps, sender-only edit, Super Admin audit, dashboard unread highlights, and **email alerts** (one per unread burst).

### Language we agreed on

- **DM:** 1:1 between two staff
- **Group chat:** named thread, 3+ members
- **`create_message_groups`:** permission to create groups
- **Audit view:** Super Admin read-only on non-member threads
- **Sent time:** `created_at` on each bubble (PKT)
- **Edited message:** sender-updated text; `edited_at` + label
- **Shared entity:** product or order attached to a message; snapshot card + detail dialog
- **Email alert:** one transactional email per unread burst when someone messages you

### Decisions made

- **DMs:** all active staff; no permission required
- **Groups:** require `create_message_groups`; Super Admin always allowed
- **Schema:** `admin_conversation_members`, `admin_messages.edited_at`, `admin_message_entities`, `admin_conversation_reads.last_notified_at`
- **Composer + menu:** Attachment (all), Product (`view_products`), Order (`view_orders`)
- **Limits:** 5 attachments, 3 products, 3 orders per message
- **Cards:** snapshot at send time; dialog fetches live data when permitted
- **Order dialog access:** shared-in-conversation grants read for recipients in that thread
- **Super Admin:** audit read-only on non-member threads; full share/view permissions
- **Sent time / edit:** unchanged from v1.2
- **Email:** Resend; debounce via `last_notified_at` vs `last_read_at`; no email on edits; non-blocking after send

### How to build it

See **Build Order** above. Schema + permission key first, then data layer, then DM UI, then groups + RBAC gating, then audit and dashboard.

---

*Module 05 — Admin Messages · Shahkar.store*
