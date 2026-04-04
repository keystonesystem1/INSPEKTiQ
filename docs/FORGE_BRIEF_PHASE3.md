# INSPEKTiQ — Forge Build Brief: Phase 3
**Live Data & Core Claim Lifecycle**
**Version 1.0 — Read PRODUCT_ROADMAP.md and DESIGN_SYSTEM.md before starting**

---

## Overview

Phase 2 built every page as a scaffolded shell with demo data. Phase 3 connects those shells to real Supabase data and makes the core claim lifecycle work end to end. The goal is a complete test run: receive a claim via email → assign to adjuster → adjuster inspects in INSPEKTiT → examiner reviews → approves → submitted to carrier.

**Before starting any step:** confirm your understanding of what exists and what needs to change. Report findings before writing code. Do not change more than the current step requires.

---

## Current State (start of Phase 3)

**Working:**
- Sign in / sign out with real Supabase auth
- Claims list reads real data from Supabase (`firm_id` filtered)
- Email intake creates claims with `firm_id = 919d3aed-3ae9-4feb-9b70-f2f8adbe314d`
- All 17 routes exist and compile

**Still on demo data:**
- Claim detail page (`/claims/[id]`) — uses `demoClaims.find()`
- Dashboard stat cards — hardcoded numbers
- Dashboard SLA alerts, activity feed, adjuster workload — hardcoded
- All other pages (dispatch, calendar, clients, adjusters, billing)

**Known issues:**
- Filter pill counts (RECEIVED 2, IN REVIEW 3) show stale demo counts — these should come from real data
- Dashboard greeting says "Avery" — should use authenticated user's name
- "Special Instructions" in OverviewTab is hardcoded

---

## Claim Data Shape

The `claims` table columns (confirmed):
`id`, `claim_number`, `insured_name`, `insured_phone`, `insured_email`, `loss_address`, `city`, `state`, `zip`, `carrier`, `loss_type`, `date_of_loss`, `policy_number`, `status`, `firm_id`, `user_id`, `assigned_user_id`, `loss_lat`, `loss_lng`, `loss_description`, `examiner_name`, `examiner_email`, `firm_name`, `received_at`, `created_at`, `updated_at`

The frontend `Claim` type (in `src/lib/types/index.ts`) uses camelCase. A mapper in `src/lib/supabase/claims.ts` already converts raw rows to the `Claim` type. Extend this mapper as needed — do not change the `Claim` type itself.

---

## Step 1 — Claim Detail: Real Data

**Goal:** clicking a claim row opens `/claims/[id]` with real data from Supabase.

**What exists:**
- `src/app/(app)/claims/[id]/page.tsx` — currently uses `demoClaims.find(id)`
- `src/lib/supabase/claims.ts` — already has `getClaims(firmId)`. Add `getClaimById(id)`.
- `ClaimHeader`, `OverviewTab`, and all 14 tab components — already built, expect a `Claim` prop

**Confirmation questions before coding:**
1. Does `src/app/(app)/claims/[id]/page.tsx` get the `id` from `params.id`?
2. Does `requireAuthenticatedFirmUser()` return `firmId`? (It does — confirm)
3. What does the page currently do when a claim is not found — does it redirect or show an error?

**Implementation:**

Add to `src/lib/supabase/claims.ts`:
```ts
export async function getClaimById(id: string, firmId: string): Promise<Claim | null> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('claims')
    .select('id, claim_number, insured_name, insured_phone, insured_email, carrier, loss_type, date_of_loss, status, city, state, loss_address, policy_number, loss_description, assigned_user_id, loss_lat, loss_lng, examiner_name, created_at')
    .eq('id', id)
    .eq('firm_id', firmId)
    .single()
  if (error || !data) return null
  return mapClaimRow(data as RawClaim)
}
```

Update `src/app/(app)/claims/[id]/page.tsx`:
- Import `getClaimById` from `@/lib/supabase/claims`
- Get `firmId` from `requireAuthenticatedFirmUser()`
- Call `const claim = await getClaimById(params.id, firmId)`
- If `claim` is null, redirect to `/claims`
- Pass real `claim` to all child components
- Remove all `demoClaims`, `demoNotes`, `demoTimeline` imports

Notes and timeline tabs can show empty states for now — do not fabricate data. Pass empty arrays `[]` for notes and timeline until those are wired in a later step.

---

## Step 2 — Claim Detail: Status Update

**Goal:** firm admin and examiner can change a claim's status from the claim detail page.

**Where:** add a status dropdown or quick-action buttons to `ClaimHeader.tsx`. Keep it simple — a `<select>` styled with the design system is fine.

**Implementation:**
- Add a `onStatusChange` callback prop to `ClaimHeader`
- Create a server action or API route `PATCH /api/claims/[id]/status` that updates `status` in Supabase using the service role client
- After update, revalidate the page so the new status reflects immediately
- Only show the status selector to roles that can change status (everyone except `carrier` for now)

---

## Step 3 — Assign Claim to Adjuster

**Goal:** firm admin or dispatcher can assign a claim to an adjuster from the claim detail page.

**Where:** `ClaimHeader.tsx` — add an "Assign Adjuster" button that opens a modal showing available adjusters.

**Implementation:**
- Create `src/lib/supabase/adjusters.ts` with `getAdjusters(firmId)` that queries `firm_users` where `role = 'adjuster'`
- Create `AssignAdjusterModal` component — simple list of adjusters with a Select button per row
- On select: `PATCH /api/claims/[id]/assign` — sets `assigned_user_id` on the claim and updates `status` to `assigned`
- After assignment, claim detail refreshes showing the adjuster's name and `assigned` status

**Note:** `assigned_user_id` references `auth.users.id`. Display the adjuster's email for now since `firm_users` does not have a name column. A display name field can be added later.

---

## Step 4 — Adjuster Role View

**Goal:** when `carteradjuster@gmail.com` signs in, they only see claims assigned to them.

**Implementation:**
Update `src/lib/supabase/claims.ts` — modify `getClaims()` to accept a `userId` parameter:
```ts
export async function getClaims(firmId: string, role: string, userId: string): Promise<Claim[]>
```

If `role === 'adjuster'`, add `.eq('assigned_user_id', userId)` to the query.
Otherwise query all firm claims as before.

Update `src/app/(app)/claims/page.tsx` to pass `role` and `id` (user's auth ID) from `requireAuthenticatedFirmUser()`.

Also update `src/app/(app)/claims/[id]/page.tsx` — if the user is an adjuster and the claim is not assigned to them, redirect to `/claims`.

---

## Step 5 — Dashboard Live Data

**Goal:** replace hardcoded stat card numbers with real counts from Supabase.

**Implementation:**
Create `src/lib/supabase/dashboard.ts`:
```ts
export async function getDashboardStats(firmId: string) {
  const supabase = await createClient()
  const { data } = await supabase
    .from('claims')
    .select('status')
    .eq('firm_id', firmId)

  const claims = data ?? []
  return {
    active: claims.filter(c => !['closed', 'submitted'].includes(c.status)).length,
    unassigned: claims.filter(c => c.status === 'received').length,
    newToday: claims.filter(c => {
      const created = new Date(c.created_at ?? '')
      const today = new Date()
      return created.toDateString() === today.toDateString()
    }).length,
    slaAtRisk: 0, // placeholder — wire SLA logic in Phase 4
  }
}
```

Update `src/components/dashboard/DashboardAdmin.tsx` to accept stats as props instead of hardcoded values. Update `src/app/(app)/dashboard/page.tsx` to fetch and pass stats.

Also fix the dashboard greeting — it currently says "Avery". It should use the authenticated user's name from `requireAuthenticatedFirmUser()`. Pass `name` as a prop to the dashboard component.

Also fix "Keystone Claims" — it should show the firm name. Add `firmName` to the `AuthenticatedFirmUser` return by querying the `firms` table using `firmId`.

---

## Step 6 — Claims Filter Pill Counts

**Goal:** the filter pills (RECEIVED 2, IN REVIEW 3) should show real counts from the actual claims in Supabase, not demo data.

**Implementation:**
The `ClaimsList` component already has the real `claims` array passed in. Compute counts from that array client-side:
```ts
const countByStatus = (status: string) => claims.filter(c => c.status === status).length
```

Update each pill to show the count badge only when `countByStatus(pill.value) > 0`.

---

## Step 7 — Approve & Submit Flow

**Goal:** examiner or firm admin can approve a claim report and mark it as submitted.

**Implementation:**
- The "Approve Report" button already exists in `ClaimHeader` (shown when `canApproveClaims(role)`)
- Wire it to `PATCH /api/claims/[id]/status` with `status: 'approved'`
- Add a "Submit to Carrier" button that appears when `status === 'approved'`
- Wire it to update `status: 'submitted'` and `submitted_at` timestamp

These are simple status updates — no complex logic needed at this stage.

---

## Step 8 — Empty States

Every tab in claim detail that shows no data should have a clean empty state — not a broken layout or missing content. Empty states should match the design system: muted text, no borders or boxes, simple message like "No notes yet" or "No documents uploaded."

Go through each of the 14 tabs and confirm they render gracefully with empty arrays/null values.

---

## Completion Criteria for Phase 3

The phase is complete when you can do this full test run without hitting a dead end:

1. Send an email to `intake+e79f863e@parse.keystonestack.com` → claim appears in INSPEKTiQ claims list
2. Click the claim → detail page opens with real insured name, carrier, DOL, status
3. Click "Assign Adjuster" → select carteradjuster@gmail.com → claim status becomes `assigned`
4. Sign in as carteradjuster@gmail.com → only the assigned claim is visible
5. Open INSPEKTiT on the assigned claim → complete inspection → report generates
6. Sign back in as andrewacowen@gmail.com → claim status is `inspected` or `in_review`
7. Click "Approve Report" → status becomes `approved`
8. Click "Submit to Carrier" → status becomes `submitted`
9. Dashboard stat cards show real numbers throughout

---

## What NOT to Touch in Phase 3

- `src/lib/utils/demo-data.ts` — keep for local development reference
- `src/hooks/useClaims.ts` — keep, no longer used by claims list but may be useful for other components
- Dispatch page — Phase 4
- Calendar page — Phase 4
- Clients, billing, adjusters pages — Phase 5
- Any UI styling, design system tokens, or component visual design
- Supabase schema — do not add or alter tables without explicit instruction

---

*INSPEKTiQ Phase 3 Build Brief — Keystone Stack LLC — Q2 2026*
