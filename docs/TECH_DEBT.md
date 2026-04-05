# INSPEKTiQ — Technical Debt & Deferred Work
**Last updated: April 5, 2026**
Add an entry any time a known gap, workaround, or deferred feature is introduced. Include the phase it was discovered and the phase it should be resolved in.

---

## Schema Gaps

### carriers table — no is_active column
- **Discovered:** Phase 4, Step 6
- **Files affected:** `src/lib/supabase/dispatch.ts`
- **Issue:** The live `carriers` table has no `is_active` column. "Active carriers" in the lasso filter popover currently returns all carriers for the firm with no way to exclude inactive ones.
- **Resolution:** Add `is_active` boolean column to `carriers` table. Filter on `is_active = true` in `getCarriersForFirm()`.
- **Deferred to:** Phase 5

### claim_category — not in live schema
- **Discovered:** Phase 4, Step 2
- **Files affected:** `src/lib/supabase/dispatch.ts`, `src/lib/types/index.ts`
- **Issue:** The `claims` table has no `claim_category` column (Residential / Commercial / Farm/Ranch / Industrial). The `DispatchClaim.claimCategory` field is currently best-effort derived from existing claim fields and is not reliable.
- **Impact:** Lasso pre-filter by category will not filter accurately. Adjuster capability mismatch checks for category are unreliable.
- **Resolution:** Add `claim_category` enum column to `claims` table in a schema migration. Add `requires_twia` boolean column at the same time.
- **Deferred to:** Phase 5
- **Code marker:** `// TODO: claim_category not in schema — derived field, needs migration`

---

## Deferred Features

### Week view — Calendar page
- **Discovered:** Phase 4
- **Files affected:** `src/components/calendar/CalendarPage.tsx`
- **Issue:** Week view toggle is rendered but disabled. Only month view is implemented.
- **Resolution:** Build week view layout with time-slot grid per adjuster.
- **Deferred to:** Phase 5 or later

### Appointment cancellation — Day Drawer
- **Discovered:** Phase 4, Step 14
- **Files affected:** `src/components/calendar/DayDrawer.tsx`
- **Issue:** "Cancel" quick action in the Day Drawer is a placeholder with no action wired.
- **Resolution:** Wire to `PATCH /api/appointments/[id]/status` with `status: 'cancelled'`. Confirm with a dialog before cancelling.
- **Deferred to:** Phase 5

### Override reason — note insertion
- **Discovered:** Phase 4, Step 9
- **Files affected:** `src/app/api/claims/assign/route.ts`
- **Issue:** When a dispatcher overrides a capability mismatch, the override reason is currently logged to console only. It should be saved as a note on the claim.
- **Resolution:** Insert a record into `claim_notes` table (or equivalent) when `overrideReason` is present.
- **Deferred to:** Phase 5

### Adjuster home base — configurable
- **Discovered:** Phase 4
- **Files affected:** `src/lib/weather.ts`, `src/components/calendar/RouteMap.tsx`
- **Issue:** Adjuster home base is hardcoded to Waco TX (lat 31.5493, lng -97.1467). Weather defaults and route map home pin use this value.
- **Resolution:** Add home base lat/lng to adjuster profile in `firm_users` or a separate `adjuster_profiles` table. Pull from there at runtime.
- **Deferred to:** Phase 5

### Routing API — Calendar route map
- **Discovered:** Phase 4, Step 17
- **Files affected:** `src/components/calendar/RouteMap.tsx`
- **Issue:** Route lines between appointment stops are straight lines only. No real driving route or distance/time calculation.
- **Resolution:** Integrate Mapbox Directions API or similar to draw actual driving routes and show estimated drive time per leg.
- **Deferred to:** Phase 5 or later

### SLA logic — not fully implemented
- **Discovered:** Phase 3, Step 5
- **Files affected:** `src/lib/supabase/dashboard.ts`
- **Issue:** `slaAtRisk` in dashboard stats returns `0` (placeholder). SLA deadline hours on claims are not computed from carrier SLA configuration.
- **Resolution:** Add SLA threshold configuration per carrier in Settings. Compute `slaDeadlineHours` at claim creation based on carrier config and `received_at`.
- **Deferred to:** Phase 5

---

## Known Workarounds

### adjuster_user_id — no enforced foreign key
- **Discovered:** Phase 4, Step 1
- **Files affected:** `src/lib/supabase/calendar.ts`, `src/lib/supabase/dispatch.ts`
- **Issue:** `appointments.adjuster_user_id` is not an enforced FK in the live Supabase schema. It is treated as referencing `auth.users.id` and joined against `firm_users` on `user_id` to get display name.
- **Resolution:** Add FK constraint in a schema migration when schema is next revisited.
- **Deferred to:** Phase 5

---

## Cross-App (INSPEKTiQ + INSPEKTiT)

### pending_te flow — not built in either app
- **Discovered:** Phase 4, cross-app alignment
- **Files affected:** INSPEKTiQ claim detail, INSPEKTiT dashboard
- **Issue:** When INSPEKTiQ moves a claim to `pending_te`, the adjuster needs to be notified and given a way to submit their time and expense hours so the claim can be billed. Neither app currently handles this transition beyond setting the status.
- **Context:** `pending_te` is used for claims billed on T&E (time and expense) rather than a fee tier. The examiner approves the file and then flags the adjuster to submit hours/expenses before the claim can be closed and billed.
- **Resolution:** 
  - INSPEKTiQ: add T&E submission review UI in claim detail (examiner sees adjuster's submitted hours/expenses and approves)
  - INSPEKTiT: add notification when claim enters `pending_te` + a T&E submission form on the claim detail
  - Both: wire to a new `time_expenses` table or equivalent
- **Deferred to:** Phase 5

### Manual adjuster claim entry — removed, deferred
- **Discovered:** Phase 4, cross-app alignment
- **Files affected:** INSPEKTiT — manual claim creation UI and API route (removed)
- **Issue:** Adjusters who work for multiple firms (not just Keystone) need a way to bring external claims into INSPEKTiT for scheduling purposes. This was removed because external claims have no `firm_id`, no carrier intake, no SLA config, and no examiner — they cannot safely share the current `claims` table.
- **Resolution:** Build an "independent adjuster" mode with a separate data model for claims that originate outside the firm. These would be adjuster-owned, not firm-owned, and would not appear in INSPEKTiQ.
- **Deferred to:** Phase 6 or later

### Status transition ownership — must be enforced in both repos
- **Discovered:** Phase 4, cross-app alignment
- **Issue:** Both apps write to the same `claims.status` column. There is no database-level enforcement of which app can set which status. If either app sets a status it doesn't own, it can corrupt the other app's workflow.
- **INSPEKTiT owns:** `assigned → accepted`, `accepted → contacted`, `contacted → scheduled`, `scheduled → inspected`, any → `needs_attention`
- **INSPEKTiQ owns:** `received → assigned`, `inspected → in_review`, `in_review → approved`, `approved → pending_te`, `approved → submitted`, `submitted → closed`, any → `on_hold` / `pending_carrier_direction` / `pending_engineer`
- **Resolution:** Add a Supabase Row Level Security policy or database trigger that enforces transition ownership by the calling user's role. Until then, enforce by convention in code only.
- **Deferred to:** Phase 5

---

*INSPEKTiQ Tech Debt Log — Keystone Stack LLC — Q2 2026*
