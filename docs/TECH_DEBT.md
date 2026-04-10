# INSPEKTiQ — Technical Debt & Deferred Work
**Last updated: April 9, 2026**
Add an entry any time a known gap, workaround, or deferred feature is introduced. Include the phase it was discovered and the phase it should be resolved in.

---

## Schema Gaps

### carriers table — no is_active column
- **Discovered:** Phase 4, Step 6
- **Files affected:** `src/lib/supabase/dispatch.ts`
- **Issue:** The live `carriers` table has no `is_active` column. "Active carriers" in the lasso filter popover currently returns all carriers for the firm with no way to exclude inactive ones.
- **Resolution:** Add `is_active` boolean column to `carriers` table. Filter on `is_active = true` in `getCarriersForFirm()`.
- **Deferred to:** Phase 5

### claims.carrier — text match instead of FK
- **Discovered:** Phase 4, Clients/Carriers build · **Confirmed:** P2 readiness audit (April 9, 2026)
- **Files affected:** `src/lib/supabase/claims.ts`, `src/lib/supabase/carriers.ts`, `src/components/claims/ClaimsList.tsx`
- **Issue:** `claims.carrier` is a free-text column. `carrier_admin` portal filtering and per-carrier claim counts on the Clients roster match by `claims.carrier === carriers.name`. The `/claims?carrier=` filter added in P2 also relies on this text match via `claim.client` (the mapped carrier name). If a carrier is renamed, historical claims become orphaned from their carrier record.
- **Resolution:** Add `claims.carrier_id uuid` FK to `carriers.id` in a Phase 5 schema migration. Backfill from the existing text column. Update queries to filter on `carrier_id`. Update `ClaimsList` carrier filter to use carrier_id once available.
- **Deferred to:** Phase 5
- **Code marker:** `// TODO: claims.carrier is a text column — fragile name match. Phase 5: add claims.carrier_id FK.`

### Adjuster phone missing from contacts tab
- **Discovered:** Phase 4, Contacts tab
- **Files affected:** `src/lib/supabase/claims.ts` (`getClaimContactsData`)
- **Issue:** `firm_users` has no `phone` column. Adjuster contact cards show "No phone on file."
- **Resolution:** Add `phone` column to `firm_users`. Surface it in the adjuster profile editor and contacts tab.
- **Deferred to:** Phase 5

### Examiner email missing from contacts tab
- **Discovered:** Phase 4, Contacts tab
- **Files affected:** `src/lib/supabase/claims.ts` (`getClaimContactsData`)
- **Issue:** `claims` table has `examiner_name` but no `examiner_email` column. Examiner card shows name only.
- **Resolution:** Add `examiner_email` column to `claims` table. Populate during claim intake and edit claim flow.
- **Deferred to:** Phase 5

### claim_category — not in live schema; policy_type used as holding column
- **Discovered:** Phase 4, Step 2 · **Confirmed:** P2 readiness audit (April 9, 2026)
- **Files affected:** `src/app/api/carriers/submit-claim/route.ts`, `src/lib/supabase/dispatch.ts`, `src/lib/types/index.ts`
- **Issue:** The `claims` table has no `claim_category` column (Residential / Commercial / Farm/Ranch / Industrial). The carrier submit-claim route currently stores the submitted claim type in the `policy_type` column as a temporary holding field. The `DispatchClaim.claimCategory` field is best-effort derived from existing columns and is not reliable.
- **Impact:** Lasso pre-filter by category will not filter accurately. Adjuster capability mismatch checks for category are unreliable. `policy_type` is being overloaded for two purposes until a proper column is added.
- **Resolution:** Add `claim_category` enum column to `claims` table in a Phase 5 schema migration. Also add `requires_twia` boolean column at the same time (see below). Migrate `policy_type` values. Update submit-claim route to write to the correct column.
- **Deferred to:** Phase 5
- **Code marker:** `// TODO: claim_category not in schema — using policy_type as holding column. See TECH_DEBT.md`

### requires_twia — not in live schema
- **Discovered:** Phase 4, Step 2 · **Confirmed:** P2 readiness audit (April 9, 2026)
- **Files affected:** `src/lib/supabase/dispatch.ts`, `src/lib/types/index.ts`
- **Issue:** The `claims` table has no `requires_twia` boolean column. The Texas Windstorm Insurance Association flag appears in the adjuster capability mismatch logic but cannot be persisted or read from the database.
- **Impact:** TWIA mismatch checks in the dispatch flow will never fire from database state.
- **Resolution:** Add `requires_twia boolean DEFAULT false` to `claims` table alongside the `claim_category` migration (see above). Surface as a checkbox in the claim creation and edit forms.
- **Deferred to:** Phase 5

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
- **Status:** RESOLVED in P2 readiness pass (April 9, 2026). Override reason is now inserted as a shared `claim_notes` record on each assigned claim when `overrideReason` is present in the assign payload. Prefixed with "Dispatch override: " for clarity.

### Adjuster home base — configurable
- **Status:** RESOLVED in commit 8093f02. Home bases now use Mapbox address autocomplete and persist to `adjuster_profiles.home_bases` jsonb.

### Clients page — real data not yet built
- **Discovered:** Phase 4 cleanup
- **Files affected:** `src/app/(app)/clients/page.tsx`, `src/app/(app)/clients/[id]/page.tsx`
- **Issue:** Clients pages show empty state only. No clients table query or client management UI is built yet.
- **Resolution:** Build clients data model, list page, and detail page in Phase 5.
- **Deferred to:** Phase 5

### Billing page — real data not yet built
- **Discovered:** Phase 4 cleanup
- **Files affected:** `src/components/billing/BillingTable.tsx`
- **Issue:** Billing table shows empty state only. No billing data model or real queries built yet.
- **Resolution:** Build billing data model and UI in Phase 5.
- **Deferred to:** Phase 5

### Carrier portal invite_status — no auto-flip on signup
- **Discovered:** Phase 4, Clients/Carriers build
- **Files affected:** `src/app/api/carriers/[carrierId]/invite/route.ts`, `src/lib/supabase/carriers.ts`
- **Issue:** When a `carrier_admin` or `carrier_desk_adjuster` accepts the Supabase auth invite and completes signup, `carriers.invite_status` and `firm_users.joined_at` are not automatically updated. Portal users will continue to display as "Pending" indefinitely until manually flipped.
- **Resolution:** Add a Supabase auth webhook (or database trigger on `auth.users` confirm) that, on signup completion, looks up the matching `firm_users` row by `user_id`, sets `joined_at`, and updates the linked `carriers.invite_status` to `'accepted'`.
- **Deferred to:** Phase 5

### AddressField component — duplicated location
- **Discovered:** Phase 4, Clients/Carriers build
- **Files affected:** `src/components/clients/NewClientModal.tsx` (defines and exports), `src/components/clients/ClientProfile.tsx` (consumes), `src/components/adjusters/AdjusterProfile.tsx` (separate inline copy)
- **Issue:** `AddressField` is currently exported from `NewClientModal.tsx` and reused by `ClientProfile.tsx`. The adjuster home base form has its own near-identical inline version (`HomeBaseAddressField`). Three Mapbox autocomplete implementations exist with the same parser/debouncer/UI.
- **Resolution:** Extract a single `src/components/ui/AddressField.tsx` component used by all consumers. Move `parseSuggestionContext` to a shared util.
- **Deferred to:** Phase 5

### `?carrier=` query param on /claims — not honored
- **Status:** RESOLVED in P2 readiness pass (April 9, 2026). `claims/page.tsx` now reads `searchParams.carrier` and passes it as `carrierFilter` to `ClaimsList`, which filters by `claim.client` (case-insensitive). Note: filtering relies on the text-match workaround described in "claims.carrier — text match instead of FK" above; a rename will break the filter until `carrier_id` FK is added.

### Pre-launch blocker — claim detail tab audit for carrier roles
- **Discovered:** Phase 4, Step 6
- **Issue:** Not all claim detail tabs have been audited for carrier role visibility. Reserves, financials, and other sensitive tabs may still be readable by `carrier_admin` and `carrier_desk_adjuster`. Must be audited and gated before any real carrier gets portal access.
- **Resolution:** Go through all 14 claim detail tabs and explicitly gate each one — show, hide, or show read-only based on carrier role. Treat this as a pre-launch blocker.
- **Deferred to:** Phase 5 — must complete before portal goes live

### Dedicated carrier portal claim view
- **Discovered:** Phase 4, Step 6
- **Issue:** Carrier roles currently use the existing claims list and detail pages with role gating. A stripped-down carrier-specific view (different columns, cleaner layout, no firm-internal UI) would be a better portal experience.
- **Resolution:** Build a dedicated carrier claim list layout and simplified claim detail view for carrier roles in a later phase.
- **Deferred to:** Phase 6

### inviteUserByEmail — no fallback when user already exists
- **Discovered:** Phase 4, Clients/Carriers build
- **Files affected:** `src/app/api/carriers/route.ts`, `src/app/api/carriers/[carrierId]/invite/route.ts`
- **Issue:** `supabase.auth.admin.inviteUserByEmail()` errors if a user with the target email already exists in `auth.users`. The current resend flow assumes a fresh invite path and will fail for users mid-flow.
- **Resolution:** On `inviteUserByEmail` error matching "already registered", fall back to `supabase.auth.admin.generateLink({ type: 'magiclink', email })` and email the link manually (or via SendGrid using the existing share-route pattern).
- **Deferred to:** Phase 5

### Role dashboards — partial empty states
- **Discovered:** Phase 4 cleanup
- **Files affected:** Examiner, Dispatcher, Adjuster, Carrier dashboard components
- **Issue:** All four role dashboards replaced demo KPIs with empty states. Real data queries need to be wired per role.
- **Resolution:** Wire real Supabase queries for each role dashboard in Phase 5.
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
- **Discovered:** Phase 4, Step 1 · **Confirmed:** P2 readiness audit (April 9, 2026)
- **Files affected:** `src/lib/supabase/calendar.ts`, `src/lib/supabase/dispatch.ts`, `src/app/api/appointments/route.ts`
- **Issue:** `appointments.adjuster_user_id` is not an enforced FK in the live Supabase schema. It is treated as referencing `auth.users.id` and joined against `firm_users` on `user_id` to get display name. Invalid UUIDs can be inserted without a database error.
- **Resolution:** Add `REFERENCES auth.users(id)` FK constraint (or to `firm_users.user_id`) in a Phase 5 schema migration. Validate `adjuster_user_id` is a real firm member in the API route until then.
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
