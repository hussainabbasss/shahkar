# Feature Spec — 06 Admin Voice Calls (WebRTC)

read `AGENTS.md` before starting

**Module:** Voice calls inside admin Messages — 1:1 and group, WebRTC audio, global incoming-call overlay with ringtone  
**Version:** 1.0  
**Last Updated:** June 29, 2026  
**References:** `context/feature-spec/05-messages.md`, `context/progress-tracker.md`, `supabase/migrations/004_admin_messages.sql`  
**Builds on:** Module 05 (conversations, members, Realtime, admin shell)

---

## What This Module Is

Adds **voice-only calls** to the existing admin Messages module. Staff can start a call from the **thread header** of any DM or group chat they belong to. When someone is called, they see a **global dialog** on top of whatever admin page they are on — dashboard, orders, products, etc. — with an audible **ringtone** until they accept, decline, or the call times out.

Calls use **WebRTC** for peer audio. **Supabase Realtime** carries signaling (offer/answer/ICE, call state). No video in v1.

This module is **admin-only**. Customers and the storefront are unchanged.

---

## Language We Agree On

| Term | Definition |
|---|---|
| **Voice call** | Real-time audio session tied to an `admin_conversations` row (DM or group). No video. |
| **Caller** | Staff member who taps the call button and initiates the session. |
| **Callee** | In a **DM**, the single other member. In a **group**, every other active member who receives a ring. |
| **Ringing** | Call exists; callee UI shows incoming overlay + ringtone; WebRTC not connected yet. |
| **Active call** | At least two participants have accepted and media is flowing (or attempting ICE). |
| **Global call overlay** | Dialog mounted in `app/admin/layout.tsx` — visible on **any** `/admin/*` route, not only Messages. |
| **Signaling** | SDP offers/answers and ICE candidates exchanged via Supabase Realtime (not over WebRTC data channel). |
| **ICE / TURN** | STUN discovers public addresses; TURN relays audio when P2P fails (common on mobile / strict NAT). |
| **Mesh group call** | Each participant sends audio to every other participant (N×(N−1) streams). Acceptable for small internal groups (≤ 6). |
| **Audit view** | Super Admin read-only thread — **no call button**, same gate as hidden composer. |
| **Missed call** | Ringing ended without accept (timeout, all declined, or caller cancelled before anyone joined). |

---

## Routes

No new pages. Calls are initiated from existing Messages UI and surfaced globally.

```
/admin/messages                              → unchanged; call button in thread header
/admin/messages/<conversationId>             → unchanged
/admin/*                                     → incoming/active call overlay may appear on any route
```

**Optional API route (signaling fallback / ICE config):**

```
GET  /api/admin/voice/ice-servers            → returns STUN + TURN credentials for WebRTC
POST /api/admin/voice/calls                  → start call (server validates membership)
POST /api/admin/voice/calls/[id]/respond     → accept | decline | end
```

Primary signaling stays on **Supabase Realtime broadcast** on channel `voice:{callId}`; server actions create/end call rows and authorize participants.

---

## Access Model

| Actor | Start call in own DM/group | Receive call | Join group call | Call from audit thread |
|---|---|---|---|---|
| Staff (member) | Yes | Yes | Yes | No |
| Super Admin (member of thread) | Yes | Yes | Yes | No |
| Super Admin (audit / non-member) | **No** | No | No | No |
| Inactive user | No | No | No | No |

**No new RBAC permission** in v1 — if you are a **member** of the conversation, you can call (mirrors send-message access). Server enforces `isMember` on every call action.

**Concurrent calls:** One **active or ringing** call per user at a time. Starting a new call while already in one returns a friendly error: *"Pehle current call khatam karein."*

---

## UX Layout

### Call button — thread header

Add a **phone** icon button to the right side of both headers:

| Thread type | Location | Visibility |
|---|---|---|
| **DM** | `MessageThread` DM header row (next to name) | Member only; hidden in audit |
| **Group** | `GroupHeader` toolbar (beside Add members) | Member only; hidden in audit |

| State | Button |
|---|---|
| Idle | Green-outline phone icon — tooltip *"Voice call"* |
| Disabled | Greyed when user already in another call, or microphone permission permanently denied |
| During call | Header button hidden or replaced by *"On call"* indicator in global overlay only |

Tap → confirm nothing in v1; immediately starts outgoing call flow.

### Global overlay (`VoiceCallOverlay`)

Mounted once in `app/admin/layout.tsx` inside `VoiceCallProvider` (client). `z-index` above sidebar, toasts, and modals (e.g. `z-[200]`).

| Phase | UI |
|---|---|
| **Outgoing (caller)** | Centered card: callee name (DM) or group name + *"Calling…"* + pulsing avatar(s). **Cancel** button. Optional quiet ringback tone (lower volume than incoming). |
| **Incoming (callee)** | Full-viewport dimmed scrim + card: caller name, conversation label (DM name or group name), animated ring indicator. **Accept** (green) + **Decline** (red). **Ringtone loops** until accept, decline, timeout, or caller cancels. |
| **Active** | Card: participant name(s), elapsed timer (`mm:ss`), **Mute** toggle, **End call** (red). Group: scrollable row of participant chips (name + muted icon). Minimize not in v1 — overlay stays until end. |
| **Ended / missed** | Brief toast: *"Call ended"* / *"Missed call from {name}"* — overlay closes after ~2s. |

**Roman Urdu microcopy examples:**
- Accept: *"Jawab dein"*
- Decline: *"Reject"*
- End: *"Call khatam karein"*
- Mute on: *"Mic band"*

### Ringtone

| Property | Value |
|---|---|
| Asset | `public/sounds/incoming-call.mp3` (short loop-friendly tone, ~2–4s seamless loop) |
| Playback | `HTMLAudioElement` `loop = true` while status = `ringing` and user is callee |
| Stop | On accept, decline, timeout, caller cancel, or component unmount |
| Autoplay | Browsers block autoplay until user gesture. **Mitigation:** on first admin login session, `VoiceCallProvider` registers a one-time click/keydown listener to unlock `AudioContext`; if still blocked, show *"Tap to hear ringtone"* on incoming card |
| Volume | User device volume; no in-app volume slider in v1 |

### Microphone permission

- Request `navigator.mediaDevices.getUserMedia({ audio: true })` when user **accepts** (callee) or when caller **starts** call (so connect is fast).
- If denied: show inline error on overlay + toast; end call gracefully.
- No camera permission requested.

### Mobile

- Overlay is full-screen friendly; Accept/Decline buttons min 52px height.
- Call works when thread is open on mobile or when user navigated away to another admin page.

---

## Call Flows

### DM (1:1)

```
Caller taps phone
  → server creates call row (status=ringing)
  → Realtime notifies callee(s) on personal channel voice-user:{userId}
  → Callee hears ringtone + sees overlay (any admin page)
  → Callee Accept
      → both exchange SDP/ICE via voice:{callId} broadcast
      → P2P audio connects; status=active
  → Either party End → status=ended; cleanup tracks & channels
```

**Timeout:** If callee does not accept within **45 seconds**, status → `missed`; caller sees *"No answer"*.

### Group

```
Caller taps phone in group header
  → server creates call + participant rows for all members except caller (status=invited)
  → each callee gets personal ring on voice-user:{userId}
  → each Accept/Decline independently
  → when ≥2 participants (including caller) are joined → status=active
  → mesh: each joined peer maintains RTCPeerConnection to every other joined peer
```

| Rule | Behavior |
|---|---|
| Who rings | All active group **members** except caller |
| Min to start audio | Caller + **1 accept** (2 people) |
| Max participants | **6** joined (config constant `MAX_GROUP_CALL_PARTICIPANTS`) — server rejects join if full |
| Late join | If call still `active`, member can tap phone in thread → join remaining mesh (v1: allow if within 6) |
| Decline | That user stops ringing; others unaffected |

**Mesh limit rationale:** Internal staff groups are small (3–6). Mesh avoids a paid SFU in v1. Document upgrade path to Livekit/Daily if groups grow.

---

## WebRTC Architecture

### Stack

| Layer | Choice |
|---|---|
| Media | `RTCPeerConnection` + `getUserMedia` audio only |
| Signaling transport | Supabase Realtime **Broadcast** on private channel per call |
| Personal notifications | Supabase Realtime Broadcast on `voice-user:{userId}` for incoming/missed/end events |
| ICE servers | `GET /api/admin/voice/ice-servers` — STUN (Google public) + optional TURN from env |
| Library | **Native WebRTC** in `lib/admin/voice/` — no heavy SDK in v1 |

### Signaling message types (broadcast payload)

```ts
type VoiceSignal =
  | { type: "offer"; from: string; sdp: RTCSessionDescriptionInit }
  | { type: "answer"; from: string; to: string; sdp: RTCSessionDescriptionInit }
  | { type: "ice"; from: string; to: string; candidate: RTCIceCandidateInit }
  | { type: "leave"; from: string };
```

DM: `to` optional (only two peers). Group: always include `to` for unicast signaling.

### ICE / TURN env vars (add to `.env.example`)

```
# Optional — strongly recommended for production/mobile
VOICE_TURN_URL=
VOICE_TURN_USERNAME=
VOICE_TURN_CREDENTIAL=
```

If TURN unset, return STUN-only config and log a one-time dev warning. Document Metered.ca / Twilio TURN as setup options.

### Connection recovery

| Case | v1 behavior |
|---|---|
| ICE failed | Show *"Connection weak — try again"*; auto end after 15s |
| Tab backgrounded | Keep call alive; may degrade on mobile OS |
| Network drop | End call for that participant; others continue (group) |
| Supabase Realtime disconnect | Attempt resubscribe; if call state unknown for 30s, end locally |

---

## Database Changes

Migration: `005_admin_voice_calls.sql`

### Tables

```sql
CREATE TABLE admin_voice_calls (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id uuid NOT NULL REFERENCES admin_conversations(id) ON DELETE CASCADE,
  initiated_by uuid NOT NULL REFERENCES admin_profiles(id) ON DELETE CASCADE,
  status text NOT NULL CHECK (status IN ('ringing', 'active', 'ended', 'missed', 'declined')),
  started_at timestamptz,   -- first media connect
  ended_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_admin_voice_calls_conversation
  ON admin_voice_calls(conversation_id, created_at DESC);

CREATE INDEX idx_admin_voice_calls_status
  ON admin_voice_calls(status)
  WHERE status IN ('ringing', 'active');

CREATE TABLE admin_voice_call_participants (
  call_id uuid NOT NULL REFERENCES admin_voice_calls(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES admin_profiles(id) ON DELETE CASCADE,
  status text NOT NULL CHECK (status IN (
    'invited', 'ringing', 'joined', 'declined', 'missed', 'left'
  )),
  joined_at timestamptz,
  left_at timestamptz,
  PRIMARY KEY (call_id, user_id)
);

CREATE INDEX idx_admin_voice_call_participants_user
  ON admin_voice_call_participants(user_id, call_id);
```

**Active call guard:** Partial unique index or app-level check — a user may appear in at most one call with status `ringing` or `joined` at a time (enforced in server action).

### Realtime

Enable Realtime on `admin_voice_calls` and `admin_voice_call_participants` for INSERT/UPDATE so clients sync state if broadcast is missed.

**No call recording blobs** in v1 — no storage bucket.

---

## RLS Policies

```sql
-- admin_voice_calls SELECT: conversation member OR Super Admin (audit read only)
-- admin_voice_calls INSERT: initiated_by = auth.uid() AND is member
-- admin_voice_calls UPDATE: participant OR initiator for end/missed transitions
-- admin_voice_call_participants SELECT: same as call visibility
-- admin_voice_call_participants UPDATE: user_id = auth.uid() for own accept/decline/leave
```

Mutations primarily via **server actions** (service role) with `requireAdmin`, `isMember`, concurrent-call checks.

---

## Server Actions & Data Layer

### New files

```
lib/admin/voice.ts                    — constants, concurrent call guard, mesh helpers
lib/db/admin/voice.ts                 — CRUD call rows, list active call for user
app/actions/admin/voice.ts            — startCall, respondToCall, endCall, joinGroupCall
app/api/admin/voice/ice-servers/route.ts
components/admin/voice/
  VoiceCallProvider.tsx               — context + global Realtime subscription voice-user:{id}
  VoiceCallOverlay.tsx                — outgoing / incoming / active UI
  useVoiceCall.ts                     — WebRTC peer map, signaling send/receive
  useCallRingtone.ts                  — audio loop + autoplay unlock
components/admin/messages/
  CallButton.tsx                      — phone icon for DM + GroupHeader
```

### Key functions

| Function | Responsibility |
|---|---|
| `startCall(conversationId)` | Member check; no concurrent call; create call + participants; notify callees |
| `respondToCall(callId, 'accept' \| 'decline')` | Update participant row; transition call to `active` when threshold met |
| `endCall(callId)` | Set `ended_at`, status `ended`, broadcast end |
| `joinGroupCall(conversationId)` | Attach to existing `active` call in thread if slots remain |
| `getActiveCallForUser(userId)` | For provider mount / refresh |
| `getIceServers()` | API: STUN + optional TURN from env |

### Start validation

1. `requireAdmin()` — active user
2. `isMember(currentUser, conversationId)` → else 403
3. Super Admin not a member → 403 (audit)
4. No existing `ringing`/`active` call for caller
5. Group: member count ≤ `MAX_GROUP_CALL_PARTICIPANTS` (optional pre-check)
6. Insert `admin_voice_calls` + participant rows

---

## Auth & Middleware

- All voice endpoints behind existing admin auth
- `VoiceCallProvider` only renders when admin session exists (wrap in layout after auth — client fetches session or receives `userId` from a small server wrapper component)
- ICE route: `requireAdmin()` — do not expose TURN credentials publicly

---

## In Scope

- Migration `005_admin_voice_calls.sql`
- WebRTC **audio-only** for DMs (P2P) and groups (mesh, max 6)
- Call button in DM + group thread headers (members only)
- Global incoming/outgoing/active overlay on all `/admin/*` pages
- Looping ringtone + browser autoplay mitigation
- Supabase Realtime signaling + personal incoming channel
- Server-enforced membership, one call per user, 45s ring timeout
- STUN + optional TURN via env
- Basic ended/missed toasts

---

## Out of Scope

- Video calls
- Screen sharing
- Call recording / playback
- Call history UI (DB rows exist for future; no inbox list in v1)
- PSTN / phone-number dialing
- Push notifications / email on missed call
- Call transfer, hold, DTMF
- Noise suppression tuning beyond browser defaults
- SFU / Livekit / Daily.co integration (documented upgrade path only)
- Customer / storefront calling
- Super Admin calling into audit threads
- `use_voice_calls` RBAC permission (open to all members like DMs)
- Minimize-to-floating-pill UI

---

## Assumptions

1. **Voice only** — user explicitly asked for voice, not video.
2. **Global overlay** — callee may be on dashboard, orders, etc.; overlay is app-wide in admin layout.
3. **Group calls ring all members** except caller; mesh audio among joined participants.
4. **Small groups** — max 6 on call; typical staff group size fits mesh.
5. **No new permission** — conversation membership is the gate (same as send message).
6. **Audit threads** — no call affordance (read-only parity with composer).
7. **TURN** optional in dev; production should set TURN for reliable mobile NAT traversal.
8. **Pakistan staff** — Roman Urdu labels on call UI; ringtone is a neutral tone (not culturally specific).
9. **One call per user** — prevents signaling/WebRTC chaos in v1.
10. **Native WebRTC** — no paid third-party room SDK in v1.

---

## Verification Criteria

### Access & RBAC

- [ ] Call button visible in DM and group thread for members
- [ ] Call button hidden in Super Admin audit (non-member) threads
- [ ] `startCall` returns 403 for non-member
- [ ] Inactive user cannot start or receive calls

### DM calls

- [ ] Caller sees outgoing overlay; callee sees incoming on `/admin/dashboard` (not only Messages)
- [ ] Ringtone plays for callee (after one user gesture if required)
- [ ] Accept connects audio both ways within reasonable time on same network
- [ ] Decline stops ringtone and shows missed state to caller
- [ ] Cancel from caller stops callee ring
- [ ] 45s timeout marks missed if no answer
- [ ] End from either side tears down media and overlay

### Group calls

- [ ] All members except caller receive incoming ring
- [ ] Two participants sufficient to enter active state
- [ ] Third member can accept and hear others (mesh)
- [ ] Seventh join attempt rejected when 6 already joined
- [ ] One member decline does not end call for others

### Global UX

- [ ] Overlay appears above sidebar and modals on any admin route
- [ ] User on second call attempt gets error while first call active
- [ ] Mic mute stops sending audio; unmute restores
- [ ] Microphone permission denial shows clear error

### WebRTC / infra

- [ ] ICE servers endpoint returns STUN; includes TURN when env set
- [ ] Signaling messages scoped to call channel; no leak to non-participants
- [ ] Realtime INSERT on call row reaches provider when broadcast missed

---

## Build Order

1. Migration `005_admin_voice_calls.sql` + RLS + Realtime publication
2. `lib/db/admin/voice.ts` + `lib/admin/voice.ts` helpers
3. `app/api/admin/voice/ice-servers/route.ts`
4. `app/actions/admin/voice.ts` — start, respond, end, join
5. `useCallRingtone.ts` + `public/sounds/incoming-call.mp3`
6. `useVoiceCall.ts` — P2P + mesh peer management
7. `VoiceCallProvider.tsx` + `VoiceCallOverlay.tsx` — mount in `app/admin/layout.tsx`
8. `CallButton.tsx` — wire into `MessageThread` DM header + `GroupHeader`
9. Concurrent-call guards + timeout job (client timer + server optional cleanup)
10. `.env.example` TURN vars + `context/progress-tracker.md`

---

## Implementation Plan — Admin Voice Calls

### What we are building

Voice-only WebRTC calls for admin DMs and groups: a phone button in each chat header, Supabase Realtime signaling, optional TURN for NAT, and a **global admin overlay** with ringtone so incoming calls reach staff on whatever admin page they are viewing.

### Language we agreed on

- **Voice call:** audio-only session tied to a conversation
- **Global call overlay:** dialog in admin root layout, any `/admin/*` route
- **Ringing:** incoming UI + looped ringtone before accept
- **Mesh group call:** each participant peers to all others (max 6)
- **Audit view:** no calls on read-only threads

### Decisions made

- **Media:** WebRTC audio only; native APIs, no video SDK
- **Signaling:** Supabase Realtime Broadcast per call + personal `voice-user:{id}` channel
- **DM topology:** single P2P `RTCPeerConnection`
- **Group topology:** full mesh, max 6 participants
- **Access:** conversation members only; no new RBAC key; audit excluded
- **Concurrency:** one ringing/active call per user
- **Ring timeout:** 45 seconds → missed
- **ICE:** public STUN + optional TURN from env
- **UI placement:** `CallButton` in thread headers; `VoiceCallProvider` in `app/admin/layout.tsx`
- **Ringtone:** `public/sounds/incoming-call.mp3` with autoplay-unlock pattern

### Assumptions

- Group calls ring **all** members simultaneously.
- Call history is stored but **not shown** in UI until a future module.
- Production should configure TURN for staff on mobile networks.

### How to build it

See **Build Order** above. Schema and server actions first, then WebRTC client core, then global overlay + ringtone, then header buttons.

---

*Module 06 — Admin Voice Calls · Shahkar.store*
