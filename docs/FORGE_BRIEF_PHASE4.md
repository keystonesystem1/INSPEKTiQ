# INSPEKTiQ — Forge Build Brief: Phase 4
**Dispatch & Calendar — Live Data**
**Version 1.0 — Read PRODUCT_ROADMAP.md and DESIGN_SYSTEM.md before starting**

---

## Overview

Phase 3 wired the core claim lifecycle to Supabase — claims list, claim detail, status updates, adjuster assignment, role-based views, and the admin dashboard all use real data. Phase 4 connects the two remaining operational surfaces — Dispatch and Calendar — to real Supabase data.

The dispatch page already has a full three-panel UI (claims list, map, adjuster roster) built with demo data. The calendar page has a month view, scheduling queue, route map, day drawer, and scheduling modal — all on demo data. This phase replaces every `demoClaims`, `demoAdjusters`, and `demoAppointments` import in these pages with real Supabase queries.

**Before starting any step:** confirm your understanding of what exists and what needs to change. Report findings before writing code. Do not change more than the current step requires.

---

## Current State (start of Phase 4)

**Working (real Supabase data):**
- Claims list page reads real claims filtered by `firm_id`
- Claim detail page with real data, status updates, adjuster assignment
- Admin dashboard stat cards from real claim counts
- `getClaims(firmId, role, userId)` in `src/lib/supabase/claims.ts`
- `getAdjusters(firmId)` in `src/lib/supabase/adjusters.ts` — returns `AdjusterOption[]` with `{ id, userId, email }`
- `PATCH /api/claims/[id]/assign` — assigns adjuster and sets status to `assigned`
- `PATCH /api/claims/[id]/status` — updates claim status

**Still on demo data:**
- `src/components/dispatch/DispatchMap.tsx` — imports `demoClaims` and `demoAdjusters`
- `src/components/dispatch/ClaimsList.tsx` — imports `demoClaims`
- `src/components/dispatch/AdjusterRoster.tsx` — imports `demoAdjusters`
- `src/components/dispatch/AssignModal.tsx` — imports `demoClaims` and `demoAdjusters`
- `src/components/calendar/CalendarView.tsx` — imports `demoAppointments`
- `src/components/calendar/ScheduleQueue.tsx` — imports `demoClaims`
- `src/components/calendar/DayDrawer.tsx` — imports `demoAppointments`
- `src/components/calendar/RouteMap.tsx` — imports `demoAppointments`
- `src/components/calendar/ScheduleModal.tsx` — no demo imports but does not persist data

**No `appointments` table exists yet in Supabase.** This must be created before calendar work begins.

---

## Claim Data Shape (reminder)

The `Claim` type (in `src/lib/types/index.ts`) includes all fields needed by dispatch:
- `id`, `number`, `insured`, `address`, `city`, `state`
- `status` (ClaimStatus enum)
- `type`, `category`, `carrier`
- `slaHoursRemaining` (computed in mapper)
- `lat`, `lng` (for map pins)
- `adjuster` (email string, set when assigned)

The `AdjusterOption` type (in `src/lib/supabase/adjusters.ts`) is minimal: `{ id, userId, email }`. The dispatch roster and map need more data (name/initials, location, lat/lng, active claims count). See Step 2 for how to handle this.

---

## Step 1 — Dispatch Page: Server Data Fetching

**Goal:** convert the dispatch page from a client-only page to one that receives real claims and adjusters as props from a server component.

**What exists:**
- `src/app/(app)/dispatch/page.tsx` — a simple server component that renders `<DispatchMap />`
- `DispatchMap` is a `'use client'` component that imports demo data directly

**Implementation:**

Update `src/app/(app)/dispatch/page.tsx`:
- Import `requireAuthenticatedFirmUser` from `@/lib/supabase/user`
- Import `getClaims` from `@/lib/supabase/claims`
- Import `getDispatchAdjusters` from `@/lib/supabase/adjusters` (new function — see Step 2)
- Fetch claims where status is NOT `closed` or `submitted` (active dispatch-relevant claims)
- Fetch adjusters for the firm
- Pass `claims` and `adjusters` as props to `<DispatchMap />`

Update `DispatchMap` to accept `claims` and `adjusters` as props instead of importing demo data. Pass them down to child components.

**Roles:** only `firm_admin`, `dispatcher`, and `super_admin` should access dispatch. If the user's role is not one of these, redirect to `/dashboard`.

---

## Step 2 — Enrich Adjuster Data for Dispatch

**Goal:** the dispatch adjuster roster and map need more than just `{ id, userId, email }`. We need display-friendly adjuster data.

**What the roster currently shows per adjuster (from `demoAdjusters`):**
- Name, initials, location, active claims count, max claims, certifications, lat/lng

**Reality:** the `firm_users` table only has `id`, `user_id`, `firm_id`, `role`, `is_active`. There is no name, location, or certifications column. The only identifier we can get from auth is email.

**Implementation — pragmatic approach:**

Create `getDispatchAdjusters(firmId)` in `src/lib/supabase/adjusters.ts` that returns a richer type:

```ts
export interface DispatchAdjuster {
  id: string;          // firm_users.id
  userId: string;      // auth user id
  email: string;       // from auth
  initials: string;    // derived from email (first two chars before @, uppercased)
  activeClaims: number; // count of claims assigned to this user that are not closed/submitted
}
```

To compute `activeClaims`: query the `claims` table grouped by `assigned_user_id` where `firm_id` matches and status is not in `['closed', 'submitted']`.

**Do not add columns to `firm_users`.** Display the email as the adjuster label. Use the first two characters of the email (before `@`) as initials, uppercased. Location, certifications, lat/lng, and max claims are Phase 5 features — show what we have now.

Update `AdjusterRoster.tsx`:
- Accept `adjusters: DispatchAdjuster[]` as a prop
- Display email as name, initials from email, active claims count
- Remove the certifications badges, location, and max claims bar for now (no data source)
- Keep the "Assign Claims" and "Profile" buttons

Update the map adjuster pins in `DispatchMap.tsx`:
- Since we don't have adjuster lat/lng yet, **do not render adjuster pins on the map**. Remove the `demoAdjusters.map(...)` block that places adjuster circles. The map should only show claim pins. Adjuster pins return in Phase 5 when profile data exists.

---

## Step 3 — Dispatch Claims List: Real Data

**Goal:** the left-panel claims list shows real unassigned/active claims.

**What exists:**
- `src/components/dispatch/ClaimsList.tsx` — imports `demoClaims` directly

**Implementation:**

Update `ClaimsList` to accept `claims: Claim[]` as a prop instead of importing demo data:

```ts
export function ClaimsList({
  claims,
  selectedClaimId,
  onSelect,
  dimmedClaimIds,
}: {
  claims: Claim[];
  selectedClaimId?: string;
  onSelect: (claimId: string) => void;
  dimmedClaimIds: string[];
})
```

The component already renders `claim.insured`, `claim.address`, `claim.category`, `claim.type`, `claim.slaHoursRemaining` — these all exist on the real `Claim` type. No layout changes needed.

Update `DispatchMap.tsx` to pass `claims` prop to `<ClaimsList claims={claims} ... />`.

---

## Step 4 — Dispatch Map: Real Claim Pins

**Goal:** claim pins on the map use real `lat`/`lng` from Supabase.

**What exists:**
- `DispatchMap.tsx` renders claim pins using hardcoded percentage positions: `left: ${22 + index * 18}%`
- Real claims have `lat` and `lng` fields (populated by email intake geocoding)

**Implementation:**

This is a placeholder map (no Mapbox integration yet — that's Phase 6). We cannot plot real lat/lng on a CSS grid background. Instead, use a simple distribution approach:

- If claims have valid `lat`/`lng` (both non-zero), sort them by longitude and distribute across the map width proportionally using min/max normalization
- If all claims lack coordinates, fall back to index-based distribution (current approach)
- Keep the existing pin design (teardrop shape, SLA color coding, claim number tooltip)

```ts
function getClaimPosition(claim: Claim, index: number, claims: Claim[]) {
  const validClaims = claims.filter(c => c.lat !== 0 && c.lng !== 0);
  if (validClaims.length < 2 || claim.lat === 0) {
    // Fallback: distribute evenly
    return { left: `${15 + (index / Math.max(claims.length - 1, 1)) * 70}%`, top: `${20 + (index / Math.max(claims.length - 1, 1)) * 55}%` };
  }
  const lats = validClaims.map(c => c.lat);
  const lngs = validClaims.map(c => c.lng);
  const latRange = Math.max(...lats) - Math.min(...lats) || 1;
  const lngRange = Math.max(...lngs) - Math.min(...lngs) || 1;
  return {
    left: `${10 + ((claim.lng - Math.min(...lngs)) / lngRange) * 80}%`,
    top: `${10 + ((Math.max(...lats) - claim.lat) / latRange) * 75}%`,
  };
}
```

Also update the lasso count display — currently references `demoClaims.length`. Change to use the `claims` prop length.

---

## Step 5 — Dispatch Assign Modal: Real Data + Working Assignment

**Goal:** the assign modal shows real selected claims and real adjusters, and actually assigns on confirm.

**What exists:**
- `AssignModal.tsx` — shows `demoClaims.slice(0, 2)` and `demoAdjusters`, no real action on confirm
- `PATCH /api/claims/[id]/assign` already works from Phase 3

**Implementation:**

Update `AssignModal` props:
```ts
{
  open: boolean;
  onClose: () => void;
  selectedClaimIds: string[];
  claims: Claim[];
  adjusters: DispatchAdjuster[];
  onAssigned: () => void;  // callback to refresh after assignment
}
```

- Filter `claims` to only show those in `selectedClaimIds`
- Show real adjusters with email and active claims count
- On adjuster selection + confirm: call `PATCH /api/claims/[id]/assign` for each selected claim
- After all assignments complete, call `onAssigned()` which should trigger `router.refresh()` to reload server data
- Close the modal

Update `DispatchMap` to track `selectedClaimIds` (currently only tracks `selectedClaimId` singular). Add multi-select support:
- Clicking a claim pin or list item toggles it in `selectedClaimIds`
- "Assign Selected" button passes `selectedClaimIds` to the modal
- After assignment, clear the selection

---

## Step 6 — Create Appointments Table

**Goal:** create the `appointments` table in Supabase so the calendar can persist scheduling data.

**This step requires running SQL in the Supabase dashboard.** Provide the migration SQL for the user to run:

```sql
CREATE TABLE IF NOT EXISTS appointments (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  claim_id UUID NOT NULL REFERENCES claims(id) ON DELETE CASCADE,
  firm_id UUID NOT NULL REFERENCES firms(id) ON DELETE CASCADE,
  adjuster_user_id UUID REFERENCES auth.users(id),
  date DATE NOT NULL,
  arrival_time TIME NOT NULL,
  end_time TIME NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'completed', 'cancelled')),
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE appointments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Firm users can view their firm appointments"
  ON appointments FOR SELECT
  USING (firm_id IN (SELECT firm_id FROM firm_users WHERE user_id = auth.uid()));

CREATE POLICY "Admin and dispatcher can insert appointments"
  ON appointments FOR INSERT
  WITH CHECK (firm_id IN (SELECT firm_id FROM firm_users WHERE user_id = auth.uid() AND role IN ('firm_admin', 'dispatcher', 'super_admin')));

CREATE POLICY "Admin and dispatcher can update appointments"
  ON appointments FOR UPDATE
  USING (firm_id IN (SELECT firm_id FROM firm_users WHERE user_id = auth.uid() AND role IN ('firm_admin', 'dispatcher', 'super_admin')));
```

**Do not run this SQL yourself.** Output the migration and ask the user to run it in the Supabase SQL editor. Wait for confirmation before proceeding to Step 7.

---

## Step 7 — Calendar: Supabase Queries

**Goal:** create the data layer for appointments.

**Implementation:**

Create `src/lib/supabase/appointments.ts`:

```ts
export interface AppointmentRow {
  id: string;
  claim_id: string;
  firm_id: string;
  adjuster_user_id: string | null;
  date: string;
  arrival_time: string;
  end_time: string;
  status: string;
  notes: string | null;
}

export async function getAppointments(firmId: string, month?: string): Promise<Appointment[]>
// Query appointments for the firm, optionally filtered to a specific month (YYYY-MM)
// Join with claims to get insured_name and loss_address for display
// Map to the existing Appointment type from src/lib/types/index.ts

export async function createAppointment(data: {
  claimId: string;
  firmId: string;
  adjusterUserId?: string;
  date: string;       // YYYY-MM-DD
  arrivalTime: string; // HH:MM
  endTime: string;     // HH:MM
  notes?: string;
}): Promise<{ success: boolean; error?: string }>
// Insert into appointments table
// Also update the claim status to 'scheduled' if current status is 'assigned' or 'contacted'
```

---

## Step 8 — Calendar Page: Server Data Fetching

**Goal:** convert the calendar page to receive real data from a server component.

**What exists:**
- `src/app/(app)/calendar/page.tsx` — simple server component rendering `<CalendarView />`
- `CalendarView` is `'use client'` and imports `demoAppointments`

**Implementation:**

Update `src/app/(app)/calendar/page.tsx`:
- Import `requireAuthenticatedFirmUser`
- Import `getAppointments` from `@/lib/supabase/appointments`
- Import `getClaims` from `@/lib/supabase/claims`
- Fetch appointments for the current month
- Fetch claims that need scheduling: status is `assigned` or `contacted` (assigned but not yet scheduled)
- Pass `appointments` and `needsSchedulingClaims` as props to `<CalendarView />`

Update `CalendarView` to accept props instead of importing demo data. Pass data down to child components.

---

## Step 9 — Calendar Components: Wire to Real Data

**Goal:** replace all demo data imports in calendar sub-components.

**ScheduleQueue** (`src/components/calendar/ScheduleQueue.tsx`):
- Accept `claims: Claim[]` as a prop (claims needing scheduling)
- Replace `demoClaims` import
- Each claim card shows `claim.insured`, `claim.address`, SLA badge from `claim.slaHoursRemaining`
- Drag-and-drop already sets `claim.id` in `dataTransfer` — this works with real IDs

**CalendarView** (`src/components/calendar/CalendarView.tsx`):
- Accept `appointments: Appointment[]` as a prop
- Replace `demoAppointments` import in the calendar grid rendering
- The grid cell filter `appointments.filter(a => a.date === format(date, 'yyyy-MM-dd'))` works as-is
- Month navigation: for now, hardcode to current month. Dynamic month switching can be added later since it requires re-fetching data.

**DayDrawer** (`src/components/calendar/DayDrawer.tsx`):
- Accept `appointments: Appointment[]` as a prop
- Filter to selected date's appointments
- Replace `demoAppointments` import

**RouteMap** (`src/components/calendar/RouteMap.tsx`):
- Accept `appointments: Appointment[]` as a prop
- Replace `demoAppointments` import
- Since we don't have real geocoding for appointments, distribute pins by index (current approach)
- Remove hardcoded drive time/mileage — show "Route data unavailable" or appointment count instead

---

## Step 10 — Schedule Modal: Persist to Supabase

**Goal:** the scheduling modal creates a real appointment in Supabase.

**What exists:**
- `ScheduleModal.tsx` — form with claim, date, arrival time, end time, notification message
- Currently does nothing on "Confirm Schedule" — just closes the modal

**Implementation:**

Update `ScheduleModal` props:
```ts
{
  open: boolean;
  onClose: () => void;
  claimId?: string;
  claims: Claim[];   // to display claim info in the form
  date?: string;
  onScheduled: () => void; // callback to refresh
}
```

- Display the claim's insured name and address (look up from `claims` array by `claimId`)
- Make date, arrival time, and end time editable (they're currently `FormInput` but `onChange` is a no-op)
- On "Confirm Schedule": `POST /api/appointments` (new route) or call `createAppointment()` via server action
- After success, call `onScheduled()` which triggers `router.refresh()`

Create `POST /api/appointments/route.ts`:
- Validate auth and role (firm_admin, dispatcher, super_admin)
- Call `createAppointment()` from `src/lib/supabase/appointments.ts`
- Revalidate `/calendar`

---

## Step 11 — Empty States

Every dispatch and calendar component should handle the case where there is no data:

**Dispatch:**
- Claims list: "No unassigned claims." when the claims array is empty
- Adjuster roster: "No adjusters found." when empty
- Map: show the grid background with no pins (already works naturally)

**Calendar:**
- Schedule queue: "No claims awaiting scheduling." when empty
- Calendar grid: cells with no appointments show as empty (already works)
- Day drawer: "No appointments on this day." when empty
- Route map: "No appointments to route." when empty

---

## Completion Criteria for Phase 4

The phase is complete when:

1. Dispatch page loads real claims from Supabase — unassigned and active claims appear in the left panel and as pins on the map
2. Dispatch adjuster roster shows real adjusters from `firm_users` with their active claim counts
3. Selecting claims on dispatch + clicking "Assign Selected" + choosing an adjuster → claims are assigned in Supabase, status updates to `assigned`, page refreshes
4. Calendar schedule queue shows real claims with status `assigned` or `contacted`
5. Dragging a claim to a calendar date → schedule modal opens → confirming creates an appointment in Supabase
6. Appointments appear on the calendar grid on their correct date
7. Clicking a calendar date opens the day drawer showing that day's real appointments
8. All components render clean empty states when no data exists
9. No `demoClaims`, `demoAdjusters`, or `demoAppointments` imports remain in dispatch or calendar components

---

## What NOT to Touch in Phase 4

- `src/lib/utils/demo-data.ts` — keep for reference and other pages still using it
- Claim detail page — Phase 3, already done
- Clients, billing, adjusters pages — Phase 5
- Mapbox integration — Phase 6 (continue using placeholder map)
- Any UI styling, design system tokens, or component visual design
- Supabase schema — do not alter existing tables. Only the new `appointments` table is added (Step 6), and only after user confirmation
- Dashboard components — admin dashboard already wired; other role dashboards are Phase 5

---

*INSPEKTiQ Phase 4 Build Brief — Keystone Stack LLC — Q2 2026*
