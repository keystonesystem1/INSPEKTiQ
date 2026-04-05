# INSPEKTiQ — Forge Build Brief: Phase 4
**Dispatch & Calendar**
**Version 1.1 — Read PRODUCT_ROADMAP.md, DESIGN_SYSTEM.md, and FORGE_BRIEF_PHASE3.md before starting**

---

## Overview

Phase 3 wired real Supabase data into the claim lifecycle. Phase 4 builds the two operational tools used daily: the Dispatch page (dispatcher role) and the Calendar/Schedule page (adjuster role). These are separate pages with separate audiences, separate map pin systems, and separate data views. Do not conflate them.

- **Dispatch** → dispatcher assigns unassigned claims to adjusters via map + lasso
- **Calendar** → adjuster manages their own workload, schedules inspections, navigates to sites

Both pages already exist as route shells. This phase makes them functional.

**Before starting any step:** read the relevant wireframe file, confirm your understanding of what needs to be built, and report findings before writing code. Do not change more than the current step requires.

**Wireframe references (in `docs/wireframes/`):**
- Dispatch page → `inspektiq-dispatch-v2.html` (dispatcher role)
- Calendar page → `inspektiq-calendar.html` (adjuster role)

---

## Current State (start of Phase 4)

**Working from Phase 3:**
- Full claim lifecycle: received → assigned → inspected → approved → submitted
- Claim detail with real data, all 14 tabs, status updates, adjuster assignment
- Dashboard live stats, role-based nav, auth guards

**Dispatch page:** route exists, renders a placeholder — no map, no data
**Calendar page:** route exists, renders a placeholder — no calendar, no data

---

## Schema: Confirmed appointments Table

Step 1 schema verification is already complete. Do not re-run it. Use these confirmed column names for all Calendar code:

| Column | Type | Nullable |
|---|---|---|
| `id` | uuid | NO |
| `claim_id` | uuid | NO |
| `firm_id` | uuid | NO |
| `adjuster_user_id` | uuid | YES |
| `date` | date | NO |
| `arrival_time` | time | NO |
| `end_time` | time | NO |
| `status` | text | NO |
| `notes` | text | YES |
| `created_at` | timestamptz | YES |
| `updated_at` | timestamptz | YES |

**Foreign keys confirmed:**
- `claim_id` → `claims.id`
- `adjuster_user_id` is not an enforced FK in the live schema — treat it as referencing `auth.users.id` and join against `firm_users` on `user_id` to get the adjuster display name

**Appointment status values (locked):**
```
pending         — appointment created, not yet confirmed with insured
confirmed       — insured confirmed the date/time
completed       — inspection done
needs_attention — something went wrong, needs dispatcher intervention
cancelled       — appointment cancelled
```

---

## Environment Variables

All must be present in `.env.local` and Vercel before building:

```
NEXT_PUBLIC_MAPBOX_TOKEN          ← already set from Phase 2
NEXT_PUBLIC_OPENWEATHER_API_KEY   ← confirmed present
```

---

## Pin Color Systems

These are two different pages with two different audiences. The pin color systems are related but not identical.

### Dispatch Map Pin Colors (dispatcher view)

Unassigned claim pins are the primary interactive element. Their color reflects SLA urgency:

| Pin Color | Hex | Claim Status | SLA Condition | Selectable |
|---|---|---|---|---|
| Sage | `#5BC273` | `received` | No SLA issue | ✅ Lasso |
| Orange | `#E07B3F` | `received` | SLA ≤24 hrs remaining | ✅ Lasso |
| Red | `#E05C5C` | `received` | SLA overdue | ✅ Lasso |
| Red | `#E05C5C` | `needs_attention` | Any | ✅ Lasso |

Adjuster activity pins — **hidden by default**, revealed via "Show Adjuster Activity" toggle:

| Pin Color | Hex | Claim / Appointment State | Selectable |
|---|---|---|---|
| Bronze | `#C9A84C` | `assigned` / `accepted` / `contacted` — no appointment yet | ❌ View only |
| Orange | `#E07B3F` | Appointment status = `pending` | ❌ View only |
| Sage at 40% opacity | `#5BC273` | Appointment status = `confirmed` | ❌ View only |

Adjuster location pins (always visible):
- Circle, 34px, initials inside
- Border: sage = available, orange = busy, faint = remote/on_leave

**Toggle label:** "Show Adjuster Activity" — one toggle that reveals/hides all bronze, orange-appt, and dimmed-sage pins simultaneously.

**Legend (bottom-left):**
- Sage dot = New — Unassigned
- Orange dot = SLA At Risk
- Red dot = SLA Overdue / Needs Attention
- Blue circle = Adjuster Location
- *(When toggle is on, add:)*
- Bronze dot = Assigned — No Appointment
- Orange dot = Appointment Pending
- Sage dot (dimmed) = Appointment Confirmed

### Calendar Route Map Pin Colors (adjuster view)

The adjuster's right-panel route map shows only claims assigned to the current adjuster:

| Pin Color | Hex | State | Shown by Default |
|---|---|---|---|
| Bronze | `#C9A84C` | Assigned, no appointment yet | ✅ Yes |
| Orange | `#E07B3F` | Appointment `pending` | ✅ Yes |
| Sage | `#5BC273` | Appointment `confirmed` | ✅ Yes |
| Red | `#E05C5C` | `needs_attention` | ✅ Yes |
| Blue | `#4298CC` | `completed` / `inspected` | Toggle |
| — | — | `cancelled` | Never shown |

Home base pin: blue circle with home icon.
Route line between stops: sage, 2px, dashed.

---

## Step 2 — Dispatch Data Hook

**File:** `src/lib/supabase/dispatch.ts`

```ts
// Unassigned + needs_attention claims — lasso-selectable
export async function getUnassignedClaims(firmId: string): Promise<DispatchClaim[]>

// Adjuster activity claims — shown only when "Show Adjuster Activity" toggle is on
// Includes: assigned/accepted/contacted with no appointment, AND claims with pending/confirmed appointments
export async function getAssignedActiveClaims(firmId: string): Promise<DispatchClaim[]>

// Adjuster roster for right panel
export async function getAdjustersForDispatch(firmId: string): Promise<DispatchAdjuster[]>
```

`DispatchClaim` type (in `src/lib/types/index.ts`):
```ts
export interface DispatchClaim {
  id: string
  claimNumber: string
  insuredName: string
  lossAddress: string
  city: string
  state: string
  zip: string
  carrier: string
  lossType: string
  claimCategory: string   // 'Residential' | 'Commercial' | 'Farm/Ranch' | 'Industrial'
  requiresTwia: boolean
  requiredCerts: string[]
  status: string
  appointmentStatus: string | null  // null if no appointment exists
  receivedAt: string
  slaDeadlineHours: number | null
  lossLat: number | null
  lossLng: number | null
}
```

`DispatchAdjuster` type:
```ts
export interface DispatchAdjuster {
  id: string
  name: string
  initials: string
  location: string
  activeClaims: number
  maxClaims: number
  availability: 'available' | 'busy' | 'remote' | 'on_leave'
  approvedCarriers: string[]
  approvedClaimTypes: string[]
  certifications: string[]
  homeLat: number | null
  homeLng: number | null
}
```

Query `firm_users` with `role = 'adjuster'`. Left join `appointments` to determine `appointmentStatus` on each claim. Create hook `src/hooks/useDispatchData.ts` with Supabase real-time subscription on `claims`.

---

## Step 3 — Dispatch Page Layout

**File:** `src/app/(app)/dispatch/page.tsx` and `src/components/dispatch/DispatchPage.tsx`

Three-panel full-viewport (height = `100vh - nav height`, no page scroll):

```
[Left 290px: Unassigned Claims] [Center flex: Mapbox Map] [Right 300px: Adjuster Roster]
```

Reference `inspektiq-dispatch-v2.html` for panel structure and interaction patterns. Implement with Tailwind — do not copy wireframe CSS.

**Left panel:**
- Header: "Unassigned" + orange count badge
- Sub: "Click to select · Lasso on map to bulk select"
- Filter pills: All · Residential · Commercial · SLA Risk · TWIA · Wind · Hail
- Scrollable claim rows: insured name, address + carrier + loss type, SLA badge
- SLA badge: red = overdue, orange = at risk, faint = ok
- Click row → selects claim (sage left border + sage tint, highlights map pin)

**Right panel:**
- Header: "Adjusters" + availability summary badge
- Sub: "Profiles show capability · Warning on mismatch"
- Filter pills: All · Available · Busy
- Adjuster cards: avatar initials, name, location, capacity bar, cert badges, availability, Assign button
- Availability border-left: sage = available, orange = busy, faint = remote/on_leave

---

## Step 4 — Dispatch Map + Pins

**File:** `src/components/dispatch/DispatchMap.tsx`

Mapbox GL JS, dark style `mapbox://styles/mapbox/dark-v11`, token from `NEXT_PUBLIC_MAPBOX_TOKEN`.

**Unassigned claim pins (always visible):**
- Teardrop SVG marker (circle top, point down)
- Color by SLA urgency per Pin Color System above
- `needs_attention` → always red, always selectable
- Hover → tooltip: insured name, address, carrier, loss type, SLA status
- Click → select claim (synced with left panel)
- Selected → scale 1.15x + name label above pin
- Lasso-selected → sage ring outline

**Adjuster activity pins (hidden by default, toggle-revealed):**
- Same teardrop shape
- Bronze = assigned/accepted/contacted, no appointment
- Orange = appointment pending
- Sage at 40% opacity = appointment confirmed
- `pointer-events: none` — never selectable or lasso-able

**Adjuster location pins (always visible):**
- Circle 34px, initials inside
- Border by availability: sage / orange / faint
- Name label below
- Click → tooltip: name, location, capacity, certs, approved carriers

**Map controls (top-left):**
- Lasso Select → opens LassoFilterPopover
- Show Claims toggle (on by default)
- Show Adjusters toggle (on by default)
- Show Adjuster Activity toggle (off by default)
- Zoom In / Zoom Out

**Legend (bottom-left):** per Pin Color System section. Show adjuster activity legend rows only when that toggle is on.

**Lasso count (top-center):** sage number + "Claims Selected" — hidden at 0

**Assign FAB (bottom-right):** shown when ≥1 selected — "✓ Assign N Claims →", sage, pulsing glow

---

## Step 5 — Lasso Tool

**File:** `src/components/dispatch/LassoTool.tsx`

Use Mapbox GL Draw (`@mapbox/mapbox-gl-draw`) or canvas overlay.

**Flow:**
1. Click "Lasso Select" → LassoFilterPopover opens
2. Set filters → "Apply & Draw →" → popover closes, lasso mode activates
3. Nav shows pulsing sage pill: "● LASSO ACTIVE"
4. Freehand polygon draw — click to place points, double-click to close
5. On close: find unassigned pins inside polygon, apply filters, apply max count cap
6. Selected claims highlight in left panel + on map
7. Count indicator updates, Assign FAB appears
8. "✕ Clear Selection" appears in map controls

No matches → toast: "No matching claims in that area."

---

## Step 6 — Lasso Filter Popover

**File:** `src/components/dispatch/LassoFilterPopover.tsx`

Positioned near Lasso Select button. Reference `inspektiq-dispatch-v2.html`.

1. Loss Type chips: Wind · Hail · Wind+Hail · Fire · Flood · Liability (all on by default)
2. Claim Category chips: Residential · Commercial · Farm/Ranch · Industrial (all on by default)
3. Certifications chips: TWIA Only · Flood Cert · Commercial Lic · Any (none selected by default)
4. Carrier chips: populated from firm's active carriers (all on by default)
5. Max Claims slider: 1–30, default 15, sage accent

Chip "on" state: sage-tinted background, sage border, sage text.
Actions: Cancel (ghost) · Apply & Draw → (sage primary)

---

## Step 7 — Assign Modal

**File:** `src/components/dispatch/AssignModal.tsx`

Centered modal, 540px wide. Opens from Assign FAB.

**Header:** "Assign Claims" + "X claims selected"
**Claims section:** scrollable list max 150px — sage checkmark, insured name, loss type badge, cert badges
**Adjuster grid:** 2-column — avatar, name, location, capacity, certs, availability. Mismatch cards: orange border + "⚠ N issues" badge. Click → select (sage border + tint).
**Notification note:** "Adjuster will be notified via email and push notification"
**Footer:** "Assigning to: [Name]" or "Select an adjuster above" · Cancel · Confirm Assignment (sage, disabled until adjuster selected)

---

## Step 8 — Override Modal

**File:** `src/components/dispatch/OverrideModal.tsx`

Opens when selected adjuster has capability mismatches.

**Header:** orange-tinted bg, "⚠ Capability Mismatch", "N issues found assigning to [Name]"

**Warnings (orange-bordered rows):**
- TWIA cert required — adjuster not certified
- Commercial Lic required — adjuster doesn't have it
- Carrier X — adjuster not approved
- Adjuster at max capacity (N/N)

**Override reason textarea:** required, confirm disabled until ≥10 chars. Empty submit → red border + warning placeholder.

**Footer:** Cancel · Confirm Override (orange, enabled at ≥10 chars)

---

## Step 9 — Assign API Route

**File:** `src/app/api/claims/assign/route.ts`

```ts
// POST /api/claims/assign
// Body: { claimIds: string[], adjusterId: string, overrideReason?: string }
```

For each claim: set `assigned_user_id = adjusterId`, set `status = 'assigned'`. Log `overrideReason` to console if present. Use service role client. Return `{ success: true, assigned: claimIds }`.

Post-assign UI: remove claims from left panel, convert pins to bronze, toast "✓ N claim(s) assigned to [Adjuster Name]", clear selection.

---

## Step 10 — Calendar Data Hook

**File:** `src/lib/supabase/calendar.ts`

Use confirmed column names from the Schema section above.

```ts
export async function getClaimsNeedingScheduling(
  firmId: string,
  adjusterUserId: string
): Promise<SchedulingQueueItem[]>

export async function getAppointments(
  firmId: string,
  adjusterUserId: string,
  from: string,
  to: string
): Promise<Appointment[]>
```

Types using confirmed column names:
```ts
export interface Appointment {
  id: string
  claimId: string
  firmId: string
  adjusterUserId: string | null
  date: string          // 'YYYY-MM-DD'
  arrivalTime: string   // 'HH:MM' from `arrival_time`
  endTime: string       // 'HH:MM' from `end_time`
  status: 'pending' | 'confirmed' | 'completed' | 'needs_attention' | 'cancelled'
  notes: string | null
  // Joined
  insuredName: string
  lossAddress: string
  city: string
  state: string
  lossLat: number | null
  lossLng: number | null
  adjusterName: string
}

export interface SchedulingQueueItem {
  id: string
  claimNumber: string
  insuredName: string
  lossAddress: string
  city: string
  state: string
  carrier: string
  lossType: string
  status: string
  slaDeadlineHours: number | null
  lossLat: number | null
  lossLng: number | null
}
```

Create `src/hooks/useCalendarData.ts` — fetches both, refreshes on month change, real-time sub on `appointments`.

---

## Step 11 — Calendar Page Layout

**File:** `src/app/(app)/calendar/page.tsx` and `src/components/calendar/CalendarPage.tsx`

This page is for the **adjuster role**. Adjuster sees only their own claims and appointments.

Three-section full-viewport layout:
```
[Left 280px: Scheduling Queue] [Center flex: Month Calendar] [Right 320px: Route Map (toggleable)]
```

Reference `inspektiq-calendar.html`. Implement with Tailwind — do not copy wireframe CSS.
Nav right side: Month/Week toggle — Month active, Week disabled (future phase).

---

## Step 12 — Scheduling Queue (Left Panel)

**File:** `src/components/calendar/SchedulingQueue.tsx`

Claims assigned to this adjuster with no appointment. Sorted: overdue first → remaining SLA hours ascending → `received_at`.

- Header: "Needs Scheduling" + count badge. Sub: "Sorted by SLA urgency"
- Filter pills: All · SLA Risk · Residential · Commercial
- Each item: drag handle (⠿), insured name, address/carrier/type, SLA badge, Schedule button, First Contact button, ··· menu (placeholder)
- Drag via HTML5 Drag and Drop API — store claim ID in `dataTransfer`

---

## Step 13 — Month Calendar

**File:** `src/components/calendar/MonthCalendar.tsx`

**Navigation:** ← Prev · "April 2026" · Next → · Today

**Weather row:** above day-of-week headers, one cell per column:
- Weather icon + high temp (°F)
- OpenWeatherMap 5-day/3-hour forecast via `NEXT_PUBLIC_OPENWEATHER_API_KEY`
- Aggregate to daily highs, cache in state
- Default: Waco TX (lat 31.5493, lng -97.1467)
- On hover of a calendar claim with coordinates: update weather to loss location

```ts
// src/lib/weather.ts
export async function getWeeklyForecast(lat: number, lng: number): Promise<DayForecast[]>

export interface DayForecast {
  date: string
  high: number        // Fahrenheit
  iconCode: string    // e.g. '01d', '10d'
  description: string
}
```

**Calendar grid:** 7 columns × 6 rows (42 cells)
- Each cell: day number (top-left), small weather icon (top-right), appointment blocks below
- Outside-month days: faint number, no appointments
- Today: sage ring around day number
- `dragover` → sage dashed outline. `drop` → open SchedulingModal pre-filled
- Click cell → open DayDrawer

**Appointment blocks:**
- Compact pill: time + insured name (truncated)
- `pending` → orange · `confirmed` → sage · `completed` → blue · `needs_attention` → red · `cancelled` → hidden
- >3 in a cell: show 2 + "+N more" pill

---

## Step 14 — Day Drawer

**File:** `src/components/calendar/DayDrawer.tsx`

Slides up from bottom of the calendar center section (~40% height). Opens on day cell click.

**Header:** "Wednesday, April 9" + × close

**Content per appointment:**
- Time (arrival_time as "9:00 AM"), insured name + address, adjuster name, loss type badge, status badge
- Quick actions: "View Claim" → `/claims/[id]` · "Cancel" (placeholder this phase)

Empty state: "No inspections scheduled for this day."

---

## Step 15 — Scheduling Modal

**File:** `src/components/calendar/SchedulingModal.tsx`

Opens from: Schedule button (claim pre-filled), drag onto day (claim + date pre-filled), day cell "+" (date pre-filled).

**Fields:**
- Claim — read-only if pre-filled, searchable dropdown if not
- Date — date picker, pre-filled from drag
- Arrival Time — 30-min increments, default 9:00 AM
- End Time — 30-min increments, default 11:00 AM
- Notes — optional textarea

**Footer:** Cancel · Schedule Inspection (sage primary)

**On save:**
- `POST /api/appointments`
- Body maps to confirmed columns: `claim_id`, `firm_id`, `adjuster_user_id`, `date`, `arrival_time`, `end_time`, `status: 'pending'`, `notes`
- Update claim status to `scheduled`
- Close modal, refresh calendar, remove from queue

---

## Step 16 — Appointments API Route

**File:** `src/app/api/appointments/route.ts`

```ts
// POST /api/appointments
// Body: { claimId, firmId, adjusterUserId, date, arrivalTime, endTime, notes? }
```

Map camelCase → snake_case column names. Insert via service role client. Update claim to `scheduled`. Return new appointment record.

---

## Step 17 — Route Map (Right Panel)

**File:** `src/components/calendar/RouteMap.tsx`

- Default: collapsed, toggle button on right edge of calendar
- Expanded: 320px, Mapbox dark-style map
- When a day is selected: plot appointments as numbered stops in `arrival_time` order
- Pin colors per Calendar Route Map Pin Colors section above
- Home base: blue circle pin (lat 31.5493, lng -97.1467 default)
- Route line: sage, 2px, dashed — straight lines only, no routing API this phase
- Toggle to show/hide completed (blue) stops

**Pin click → Schedule interaction (bronze pins only):**
- Click bronze pin (assigned, no appointment) → tooltip: insured name, address, loss type, "Schedule →" button
- Click "Schedule →" → opens SchedulingModal pre-filled with that claim
- This is the key scheduling entry point from the map

No day selected / no appointments: home base pin only + "Select a day to see your route."

Route info card (bottom of panel): Total stops · First appointment time

---

## TypeScript Requirements

- No `any` types anywhere
- `npx tsc --noEmit` after every step — fix all errors before proceeding
- All Supabase return types explicitly typed
- All component props have explicit interfaces

---

## Completion Criteria for Phase 4

1. Dispatch loads — unassigned claims as sage/orange/red pins by SLA urgency
2. `needs_attention` claims show as red pins, always visible and selectable
3. "Show Adjuster Activity" toggle reveals bronze/orange/dimmed-sage pins
4. Adjuster pins visible — initials, border by availability, click tooltip
5. Lasso Select → filter popover → draw → matching claims selected
6. Selected claims highlighted in left panel and on map
7. Assign FAB → AssignModal with claim list and adjuster grid
8. Mismatch → OverrideModal with required reason textarea
9. Confirm assign → claims leave left panel, pins become bronze, toast confirms
10. Calendar loads — month grid with appointment blocks from real data
11. Blocks color-coded: pending=orange, confirmed=sage, completed=blue, needs_attention=red
12. Scheduling queue shows adjuster's unscheduled claims sorted by SLA
13. Drag onto day → SchedulingModal pre-filled with claim + date
14. Save modal → inserts to `appointments` using confirmed columns, claim → `scheduled`
15. Weather row shows forecast icons + high temps for visible month
16. Day drawer slides up on cell click with that day's appointments
17. Route map toggles, shows numbered pins for selected day in arrival_time order
18. Click bronze pin → tooltip with "Schedule →" → opens SchedulingModal pre-filled
19. `npx tsc --noEmit` passes with zero errors
20. Commit: `feat: Phase 4 — Dispatch and Calendar`

---

## What NOT to Touch in Phase 4

- Claim detail, dashboard, claims list — Phase 3 work, do not modify
- Clients, billing, adjusters pages — Phase 5
- Any UI styling, design tokens, or component visual design
- Supabase schema — do not add or alter tables
- INSPEKTiT mobile app — separate repo

---

*INSPEKTiQ Phase 4 Build Brief — Keystone Stack LLC — Q2 2026*
