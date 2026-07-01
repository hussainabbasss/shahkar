# Feature Spec — 07 Admin Tickets (Epics, Stories, Tasks & Board)

read `AGENTS.md` before starting

**Module:** Internal issue tracking for admin staff — Jira-style hierarchy, department tracks, kanban board, assignee notifications, share tickets in Messages  
**Version:** 1.0  
**Last Updated:** June 30, 2026  
**References:** `context/feature-spec/04-admin-control.md`, `context/feature-spec/05-messages.md`, `context/progress-tracker.md`, `supabase/migrations/003_admin_rbac.sql`, `supabase/migrations/004_admin_messages.sql`  
**Builds on:** Module 04 (RBAC, `admin_profiles`), Module 05 (Messages, entity sharing, email alerts)

---

## What This Module Is

Adds a **Tickets** area to the admin panel so staff can log problems, feature work, and ops items in a **Jira-like hierarchy**: **Epic → Story → Task → Sub-task**. Each item has its own **assignee**, **status**, and **department** (Development, Sales, or Marketing).

A **central board** shows work in columns (To Do, In Progress, Done) with filters for department and parent Story/Epic. When someone is **assigned** (or reassigned), they get an **email alert** and a **dashboard highlight**. Tickets can be **shared in Messages** the same way products and orders are today — picker in the composer, card in the thread, detail dialog on click.

This module is **admin-only**. Customers and the storefront are unchanged.

---

## Language We Agree On

| Term | Definition |
|---|---|
| **Ticket** | Any row in `admin_tickets` — Epic, Story, Task, or Sub-task. |
| **Issue type** | Hierarchy level: `epic`, `story`, `task`, `subtask`. Controls allowed parent and board behavior. |
| **Department** | Which team owns the work: `development`, `sales`, or `marketing`. **Not** the same as issue type. |
| **Epic** | Large bucket of work (e.g. "PostEx integration"). Top of hierarchy; no parent. |
| **Story** | User-facing or team-facing slice under an Epic (optional parent in v1). |
| **Task** | Actionable unit of work; parent is a Story or Epic. |
| **Sub-task** | Smallest unit; parent **must** be a Task. |
| **Assignee** | One active `admin_profiles` user responsible for the ticket. Nullable (unassigned backlog). |
| **Reporter** | Staff user who created the ticket (`created_by`). |
| **Status** | Workflow state: `backlog`, `todo`, `in_progress`, `done`, `cancelled`. |
| **Board** | Kanban view at `/admin/tickets` — columns by status; cards draggable in v1. |
| **Ticket key** | Human-readable id, e.g. `TKT-1042` — shown in lists, board, and message cards. |
| **Shared ticket** | Ticket attached to a message via composer **+** menu; snapshot card + detail dialog. |
| **Assignment alert** | Email (and dashboard row) when a user becomes assignee — including create-with-assignee and reassignment. |

---

## Routes

```
/admin/tickets                              → Board (default) + list toggle
/admin/tickets?department=development       → Board filtered by department
/admin/tickets?story=<ticketId>             → Board filtered to descendants of a Story
/admin/tickets?epic=<ticketId>              → Board filtered to Epic subtree
/admin/tickets/new                          → Create ticket (type picker + form)
/admin/tickets/[ticketKey]                  → Ticket detail (e.g. /admin/tickets/TKT-1042)
/admin/tickets/[ticketKey]/edit             → Edit ticket (or inline on detail in v1)

/admin/dashboard                            → existing; add "My tickets" card
/admin/messages                             → composer + menu gains Ticket picker
/admin/team/new, /admin/team/[id]           → permission checkboxes
```

**Sidebar:** **Tickets** under **Operations** (below Messages). Badge = count of tickets assigned to current user with status `todo` or `in_progress` (optional v1 — at minimum dashboard card).

---

## RBAC — New Permissions

### Permission keys

| Key | Controls | Default by role template |
|---|---|---|
| `view_tickets` | See Tickets nav, board, detail, shared ticket cards/dialogs (read) | See below |
| `manage_tickets` | Create, edit, assign, change status, delete (own-created or any if Super Admin) | See below |

**Enforcement:** `requirePermission('view_tickets')` on read routes/actions; `requirePermission('manage_tickets')` on mutations. Super Admin bypasses.

**Sharing in Messages:** Requires `view_tickets` to see Ticket in **+** menu and open shared cards. Sending a ticket in a thread requires `manage_tickets` **or** being the reporter/assignee of that ticket (so assignees can forward context without full manage rights).

### Role template defaults

| Role | `view_tickets` | `manage_tickets` |
|---|---|---|
| **admin** (Super Admin) | Always yes | Always yes |
| **manager** | `true` | `true` |
| **sales** | `true` | `true` |
| **custom** | Super Admin picks | Super Admin picks |

### Team / RBAC UI

Add subsection **Tickets** on `PermissionMatrix`:

| Label | Key |
|---|---|
| View tickets | `view_tickets` |
| Manage tickets | `manage_tickets` |

**Files at implementation:**
- `lib/admin/permissions.ts` — keys, labels, templates
- `components/admin/team/PermissionMatrix.tsx`
- `lib/admin/nav.ts` — Tickets nav item with `view_tickets`

---

## Hierarchy Rules

Parent-child enforced in DB check + server validation:

| Issue type | Allowed parent | Appears on board |
|---|---|---|
| `epic` | none (`parent_id` null) | Optional — epics as swimlane headers only, not cards in v1 |
| `story` | `epic` or null | Yes — full-width card or grouped under epic filter |
| `task` | `story` or `epic` | Yes |
| `subtask` | `task` only | Yes — smaller card; filter "by story" includes subtasks under tasks in that story |

**Depth limit:** Max 4 levels (epic → story → task → subtask). No nesting beyond subtask.

**Deleting parent:** `ON DELETE SET NULL` for children — orphaned stories/tasks move to backlog with parent cleared; UI warns before delete.

---

## Department (Development / Sales / Marketing)

Required on every ticket. Used for:

- Board **filter chips**: All | Development | Sales | Marketing
- Badge color on cards (see UI)
- List sort/group

**Inheritance (optional v1):** When creating a child ticket, pre-fill department from parent; user can override.

---

## Status Workflow

| Status | Board column | Meaning |
|---|---|---|
| `backlog` | Hidden from board by default (toggle "Show backlog") | Not started; not prioritized |
| `todo` | **To Do** | Ready to pick up |
| `in_progress` | **In Progress** | Actively being worked |
| `done` | **Done** | Completed |
| `cancelled` | Hidden (filter on list view) | Won't do |

**Drag-and-drop:** Moving a card between To Do / In Progress / Done updates `status`. Requires `manage_tickets`.

**Sub-task completion:** Does **not** auto-close parent Task in v1 (manual only).

---

## Database Schema

Migration: `006_admin_tickets.sql`

```sql
-- Sequential ticket numbers for TKT-XXXX keys
CREATE SEQUENCE admin_ticket_number_seq START 1001;

CREATE TABLE admin_tickets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  ticket_number integer NOT NULL UNIQUE DEFAULT nextval('admin_ticket_number_seq'),
  issue_type text NOT NULL CHECK (issue_type IN ('epic', 'story', 'task', 'subtask')),
  department text NOT NULL CHECK (department IN ('development', 'sales', 'marketing')),
  parent_id uuid REFERENCES admin_tickets(id) ON DELETE SET NULL,
  title text NOT NULL CHECK (char_length(trim(title)) >= 2),
  description text,
  status text NOT NULL DEFAULT 'backlog'
    CHECK (status IN ('backlog', 'todo', 'in_progress', 'done', 'cancelled')),
  priority text NOT NULL DEFAULT 'medium'
    CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
  assignee_id uuid REFERENCES admin_profiles(id) ON DELETE SET NULL,
  reporter_id uuid NOT NULL REFERENCES admin_profiles(id) ON DELETE RESTRICT,
  due_date date,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  completed_at timestamptz,
  CONSTRAINT admin_tickets_parent_not_self CHECK (parent_id IS NULL OR parent_id <> id)
);

CREATE INDEX idx_admin_tickets_status ON admin_tickets(status);
CREATE INDEX idx_admin_tickets_assignee ON admin_tickets(assignee_id) WHERE assignee_id IS NOT NULL;
CREATE INDEX idx_admin_tickets_parent ON admin_tickets(parent_id);
CREATE INDEX idx_admin_tickets_department ON admin_tickets(department);
CREATE INDEX idx_admin_tickets_issue_type ON admin_tickets(issue_type);
CREATE INDEX idx_admin_tickets_updated ON admin_tickets(updated_at DESC);

-- Assignment notification debounce (one email per assignee per ticket until they view it)
CREATE TABLE admin_ticket_assignee_reads (
  ticket_id uuid NOT NULL REFERENCES admin_tickets(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES admin_profiles(id) ON DELETE CASCADE,
  last_notified_at timestamptz,
  last_viewed_at timestamptz,
  PRIMARY KEY (ticket_id, user_id)
);

-- Extend message entities for ticket sharing (migration alters existing table)
ALTER TABLE admin_message_entities
  DROP CONSTRAINT IF EXISTS admin_message_entities_entity_type_check;

ALTER TABLE admin_message_entities
  ADD CONSTRAINT admin_message_entities_entity_type_check
  CHECK (entity_type IN ('product', 'order', 'ticket'));

-- Realtime for board live updates
ALTER PUBLICATION supabase_realtime ADD TABLE admin_tickets;
```

**Ticket key display:** `TKT-{ticket_number}` via `formatTicketKey(ticket_number)` in `lib/admin/tickets.ts`.

**RLS:** Service role from server actions (same pattern as orders/messages). No direct client writes.

---

## Entity Snapshot (Messages)

Stored in `admin_message_entities.snapshot` when a ticket is shared:

```json
{
  "id": "uuid",
  "ticketKey": "TKT-1042",
  "issueType": "task",
  "department": "development",
  "title": "Fix checkout phone validation",
  "status": "in_progress",
  "priority": "high",
  "assigneeName": "Ali Khan",
  "parentKey": "TKT-1001",
  "parentTitle": "Checkout improvements"
}
```

---

## Server Actions

File: `app/actions/admin/tickets.ts`

| Action | Permission | Notes |
|---|---|---|
| `createTicket` | `manage_tickets` | Validates parent/type rules; sets `reporter_id`; triggers assign notify if assignee set |
| `updateTicket` | `manage_tickets` | Title, description, department, priority, due date, parent |
| `updateTicketStatus` | `manage_tickets` | Sets `completed_at` when status → `done` |
| `assignTicket` | `manage_tickets` | Updates `assignee_id`; notify new assignee if changed |
| `deleteTicket` | `manage_tickets` | Soft preference: block if children exist unless `force` — v1 hard delete with orphan children |
| `getTicketByKey` | `view_tickets` | Detail page |
| `listTicketsForBoard` | `view_tickets` | Filtered query for kanban |
| `searchTicketsForPicker` | `view_tickets` | Messages picker search |
| `getSharedTicketDetail` | `view_tickets` | Dialog live fetch |
| `markTicketViewed` | assignee or `view_tickets` | Updates `last_viewed_at` for notify debounce |

**Ticket number in URLs:** Use `ticketKey` slug (`TKT-1042`), resolve to `id` server-side.

---

## Notifications

### Email — assignment alert

File: `lib/email/send-ticket-assignment-alert.ts` (Resend, same env as messages).

**Send when:**
- Ticket created with `assignee_id` set (notify assignee, not reporter)
- `assignee_id` changes to a new user
- Re-assign to same user after they viewed → **no** email unless status also changed to `todo`/`in_progress` from `done` (skip in v1 — only notify on assignee_id change)

**Debounce:** Track `last_notified_at` on `admin_ticket_assignee_reads`. If assignee already notified for this ticket and has not viewed (`last_viewed_at` null or `< last_notified_at`), skip duplicate on rapid saves. On assignee change, reset row for new assignee.

**Email content:**
- Subject: `Assigned: TKT-1042 — {title}`
- Body: department, issue type, priority, reporter name, link to `/admin/tickets/TKT-1042`
- CTA button: Shahkar Green, "Ticket kholo"

**Dev:** Skip when `RESEND_API_KEY` unset (non-blocking).

### Dashboard — My tickets card

`MyTicketsCard` on `/admin/dashboard` (requires `view_dashboard` + `view_tickets`):

| Row | Data |
|---|---|
| Up to 5 tickets | Assigned to me, status `todo` or `in_progress`, sorted by priority then updated_at |
| Empty | "Aap par koi active ticket nahi" |
| CTA | "Board dekho" → `/admin/tickets` |

### In-app (sidebar)

Optional badge on Tickets nav = count of my `todo` + `in_progress` tickets.

---

## Messages Integration

### Composer **+** menu

Add row (after Order):

| Menu item | Icon | Requires | Action |
|---|---|---|---|
| **Ticket** | Ticket / clipboard | `view_tickets` | Opens ticket picker sheet |

**Send rule:** User must have `view_tickets`; to share tickets they don't own, need `manage_tickets` OR be assignee/reporter of each selected ticket.

**Limits:** Max **3 tickets** per message (same as products/orders).

### Ticket card (in bubble)

| Field | Source |
|---|---|
| Key + title | `snapshot.ticketKey`, `snapshot.title` |
| Type badge | Epic / Story / Task / Sub-task |
| Department badge | Development / Sales / Marketing |
| Status + priority | snapshot |
| Assignee | `snapshot.assigneeName` or "Unassigned" |

Click → `SharedTicketDetailDialog` — live fetch when permitted, snapshot fallback.

### Detail dialog

- Full description (markdown plain text v1)
- Parent breadcrumb (Epic → Story → Task) with links
- Children list (tasks under story, subtasks under task)
- Status, assignee, dates
- **"Admin mein kholo"** → `/admin/tickets/[ticketKey]`
- **"Assign to me"** quick action if `manage_tickets` and unassigned

**Realtime:** Ticket shares ship with message INSERT — no separate subscription.

---

## UX Layout

### Board (`/admin/tickets`)

**Header:**
- Title: **Tickets**
- **Naya ticket** button (`manage_tickets`) → `/admin/tickets/new`
- View toggle: **Board** | **List**
- Filters: Department chips; **Story** dropdown (all stories + search); **Epic** dropdown (optional, narrows story list)

**Kanban (default):**
- Columns: **To Do** (`todo`) | **In Progress** (`in_progress`) | **Done** (`done`)
- Cards: `story`, `task`, `subtask` only (not epics in columns v1)
- Card shows: key, title, department badge, assignee avatar/initials, priority dot
- Sub-task cards: slightly compact; indent icon
- Drag between columns → `updateTicketStatus`
- Empty column: muted "Koi ticket nahi"

**List view:**
- Table: Key, Title, Type, Department, Status, Assignee, Parent, Updated
- Sort: updated, priority, key
- Same filters as board

**Mobile:** Single column stack with horizontal scroll for kanban OR list-only below 640px (list default on mobile if drag is awkward).

### Create / edit form

| Field | Required | Notes |
|---|---|---|
| Issue type | Yes | Epic / Story / Task / Sub-task — drives parent picker |
| Parent | Conditional | Filtered by hierarchy rules |
| Department | Yes | Development / Sales / Marketing |
| Title | Yes | Max 200 chars |
| Description | No | Textarea, max 8000 |
| Status | Yes | Default `backlog` on create |
| Priority | Yes | Default `medium` |
| Assignee | No | Searchable staff dropdown (active users) |
| Due date | No | Date picker |

Roman Urdu helper labels where appropriate; technical labels (Epic, Story) stay English for Jira familiarity.

### Detail page (`/admin/tickets/[ticketKey]`)

- Header: key, title, status badge, department badge
- Actions (`manage_tickets`): Edit, Change status, Assign, Delete
- Body: description, metadata sidebar (reporter, assignee, dates, parent link)
- **Children** section: list + "Add child" shortcut (pre-fills parent + department)
- **Activity** (v1 minimal): `created_at`, `updated_at`, `completed_at` only — no comment thread in v1

---

## UI — Department Badge Colors

Align with `ui-context.md` status palette — subtle, not decorative overload:

| Department | Badge background | Text |
|---|---|---|
| Development | `#E8F5EE` (Mint Glow) | `#1B6B3A` |
| Sales | `#FFF8ED` (Warm Cream) | `#D4820A` |
| Marketing | `#EFF6FF` (info tint) | `#2563EB` |

---

## Types & Files (implementation map)

```
lib/
  admin/tickets.ts              # formatTicketKey, hierarchy validation, status labels
  db/admin/tickets.ts           # CRUD, board queries, search, snapshots
  email/send-ticket-assignment-alert.ts

app/
  actions/admin/tickets.ts
  admin/tickets/page.tsx        # Board + list
  admin/tickets/new/page.tsx
  admin/tickets/[ticketKey]/page.tsx

components/admin/tickets/
  TicketBoard.tsx               # Kanban + DnD
  TicketCard.tsx
  TicketListTable.tsx
  TicketForm.tsx
  TicketFilters.tsx
  TicketPickerSheet.tsx         # Messages integration
  SharedTicketCard.tsx
  SharedTicketDetailDialog.tsx
  MyTicketsCard.tsx             # Dashboard

components/admin/messages/
  ComposerAttachMenu.tsx        # add Ticket item
  MessageBubble.tsx             # render ticket entities
```

Extend `insertMessage` / `sendMessageAction` for `ticketIds` + snapshots (mirror products/orders).

---

## Verification Checklist

### RBAC & nav
- [ ] `view_tickets` / `manage_tickets` on Team matrix; templates applied
- [ ] Sidebar Tickets hidden without `view_tickets`
- [ ] Server rejects mutations without `manage_tickets`

### Hierarchy
- [ ] Epic creates with no parent
- [ ] Story under Epic; Task under Story or Epic; Sub-task under Task only
- [ ] Invalid parent/type rejected server-side

### Board & filters
- [ ] Columns show correct statuses; drag updates status
- [ ] Department filter works
- [ ] Story filter shows task + subtask subtree
- [ ] List view sort and filters match board

### CRUD & assignment
- [ ] Create with assignee sends one email
- [ ] Reassign sends email to new assignee only
- [ ] `TKT-XXXX` key in URL resolves
- [ ] Delete parent orphans children with warning

### Messages
- [ ] Ticket in **+** menu with `view_tickets`
- [ ] Picker search; max 3 per message
- [ ] Card in thread; dialog opens live detail
- [ ] Share works for assignee without full `manage_tickets`

### Notifications
- [ ] Dashboard My tickets card
- [ ] Email skipped when `RESEND_API_KEY` unset
- [ ] Rapid assign saves debounced to one email until viewed

---

## Build Order

1. Migration `006_admin_tickets.sql` + extend `admin_message_entities` entity_type
2. `lib/admin/permissions.ts` + `PermissionMatrix` + nav
3. Types, `lib/admin/tickets.ts`, `lib/db/admin/tickets.ts`
4. `app/actions/admin/tickets.ts`
5. Ticket form + create/detail pages
6. Board (kanban + filters + list)
7. `send-ticket-assignment-alert.ts` + `MyTicketsCard`
8. Messages: picker, snapshot, card, dialog, `sendMessage` ticketIds
9. Realtime board refresh (optional polish)
10. Update `.env.example` (no new vars if Resend reused) + `context/progress-tracker.md`

---

## Implementation Plan — Admin Tickets

### What we are building

Jira-style internal ticketing: Epic/Story/Task/Sub-task hierarchy, Development/Sales/Marketing departments, kanban board with story filtering, per-item assignment with email alerts, dashboard "my tickets", and share-via-Messages with snapshot cards.

### Language we agreed on

- **Issue type:** epic / story / task / subtask (hierarchy)
- **Department:** development / sales / marketing (team track)
- **Board:** kanban columns todo / in_progress / done
- **Ticket key:** `TKT-{number}`
- **Shared ticket:** message entity with snapshot + dialog

### Decisions made

- **Schema:** single `admin_tickets` table + `parent_id`; sequence for keys
- **RBAC:** `view_tickets` + `manage_tickets`; all role templates get both by default
- **Board:** stories/tasks/subtasks on board; epics as filter headers only in v1
- **Status:** backlog + cancelled off board by default
- **Notify:** Resend email on assignee set/change; debounce via `admin_ticket_assignee_reads`
- **Messages:** extend entity_type `ticket`; max 3 per message; picker + card + dialog
- **No comments/attachments on tickets in v1** — description field only

### Assumptions (confirm with product owner)

- All staff with ticket access see **all** tickets (no per-department visibility lock in v1)
- English issue-type labels (Epic, Story, Task) kept for familiarity
- Drag-and-drop on desktop; mobile uses list view or status dropdown on detail
- Parent auto-complete does not roll up status (child done ≠ parent done)

### How to build it

See **Build Order** above. Migration and permissions first, then data layer and CRUD, then board UI, then notifications, then Messages integration.

---

*Module 07 — Admin Tickets · Shahkar.store*
