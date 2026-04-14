# FOUNDER_DECISIONS.md (INSPEKTiQ)

> INSPEKTiQ shares the Supabase `claims` table with INSPEKTiT. **Decision 6** is the cross-app contract for `claims.status` and must stay in lockstep with the INSPEKTiT repo’s `FOUNDER_DECISIONS.md`.

---

## Decision 5: Claim Lifecycle / Lock / Revision Semantics (summary)

The canonical status list and transition ownership rules are defined in **Decision 6** below. INSPEKTiT owns adjuster-driven transitions through field completion; INSPEKTiQ owns firm and post-inspection workflow.

---

## Decision 6: Claim Status Lifecycle and Cross-App Ownership

### Canonical Status List

INSPEKTiT and INSPEKTiQ share the same Supabase project. The following **17**
status values are the only valid values for the `claims.status` field (in
canonical order):

1. `received`
2. `assigned`
3. `accepted`
4. `contact_attempted`
5. `contacted`
6. `scheduled`
7. `inspection_started`
8. `inspection_completed` (renamed from legacy `inspected` for naming consistency)
9. `in_review`
10. `approved`
11. `submitted`
12. `closed`
13. `on_hold`
14. `pending_te`
15. `pending_carrier_direction`
16. `pending_engineer`
17. `needs_attention`

No other status values may be written to `claims.status` by either app **except**
where INSPEKTiQ product explicitly adds carrier/dispatch-only states documented
outside this list (reconcile those with Supabase CHECK constraints in the same
migration stream as INSPEKTiT).

### Permission boundary (who may set which statuses)

**INSPEKTiT — adjuster-writable statuses (values 3–8 only):**  
`accepted`, `contact_attempted`, `contacted`, `scheduled`, `inspection_started`, `inspection_completed`

**INSPEKTiQ — admin / examiner–writable statuses:** all **17** values above (plus any INSPEKTiQ-only extension such as `pending_acceptance` if present in your deployment’s constraint).

**System and firm entry (values 1–2):** `received`, `assigned` — firm pipeline; adjusters must never write these from INSPEKTiT.

**Post-inspection firm and carrier workflow (values 9–17):** `in_review`, `approved`, `submitted`, `closed`, `on_hold`, `pending_te`, `pending_carrier_direction`, `pending_engineer`, `needs_attention` — INSPEKTiQ / carrier integrations; not adjuster-owned in INSPEKTiT.

### Status Transition Ownership

**INSPEKTiQ owns (firm/dispatcher-driven):**

- received → assigned
- inspection_completed → in_review
- in_review → approved
- approved → pending_te
- approved → submitted
- submitted → closed
- Any status → on_hold
- Any status → pending_carrier_direction
- Any status → pending_engineer

**INSPEKTiT owns (adjuster-driven):**

- assigned → accepted
- accepted → contact_attempted / contacted (per product workflow)
- contact_attempted → contacted (per product workflow)
- contacted → scheduled
- scheduled → inspection_started / inspection_completed (per product workflow)
- Any active status → needs_attention

Never write code in INSPEKTiT that sets a status outside the adjuster-writable set (values 3–8) unless explicitly approved.

---

## Implementation Notes

1. Database migrations for `claims.status` live in the **INSPEKTiT** Supabase migration folder (single shared backend).
2. INSPEKTiQ TypeScript types and API allow-lists should match the deployed CHECK constraint at all times.
