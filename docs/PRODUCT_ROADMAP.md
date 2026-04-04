# INSPEKTiQ Product Roadmap
**Keystone Stack LLC — Living Document — Updated April 2026**

---

## What INSPEKTiQ Is

INSPEKTiQ is the firm-facing claims management platform in the Keystone Stack product suite. It is the operational hub for independent adjusting firms — receiving claims, dispatching adjusters, tracking the full lifecycle from intake to carrier submission, and managing billing.

INSPEKTiT is the companion field app used by adjusters on-site. The two products share a single Supabase backend. Claims created in either app are visible in both.

---

## Business Model

**Monthly firm subscription** — flat fee per firm, billed monthly via Stripe. Stored as `subscription_status` and `billing_customer_id` on the `firms` table.

**Per-report fee** — one charge per claim when an adjuster generates a report in INSPEKTiT. Stored as `report_paid` and `report_payment_ref` on `claim_assignments`.

**Self-managed adjuster tier** — individual adjusters without a firm can add claims for scheduling and contact tracking. Report generation is locked unless `report_paid = true`.

---

## Claim Lifecycle

```
received → assigned → contacted → scheduled → inspected → in_review → approved → submitted → closed
```

**Pending statuses** (can occur at any stage, set by firm admin or examiner):
- `pending_te` — waiting on time and expense entries
- `pending_carrier_direction` — waiting on carrier instruction  
- `pending_engineer` — waiting on engineer report
- `on_hold` — paused for any reason

**Who sees what:**
- `firm_admin` — full access to all claims for their firm
- `examiner` — claims in `in_review`, `approved`, billing
- `dispatcher` — unassigned claims, dispatch, calendar
- `adjuster` — only claims assigned to them, from `assigned` status onward
- `carrier` — read-only view of their claims, can upload docs

---

## Phase History

### Phase 1 — Foundation (Complete)
- Next.js 16 scaffold, Supabase auth, role-based routing
- Supabase schema: `firms`, `firm_users`, `carriers`, `claim_assignments`
- Vercel deployment at inspektiq.io

### Phase 2 — Full UI Scaffold (Complete)
- All 17 routes built with correct design system
- All components, UI library, nav, dashboards (5 role variants)
- Claims list, claim detail (14 tabs), dispatch, calendar, billing, settings
- Email intake stub at `/api/email-intake`
- Demo data throughout — no live Supabase queries yet

### Phase 3 — Live Data & Core Claim Lifecycle (Current)
See `FORGE_BRIEF_PHASE3.md` for full details.

Goals:
- Claim detail page wired to real Supabase data
- Assign claim to adjuster from claim detail
- Status updates through the full lifecycle
- Dashboard wired to real claim counts
- Adjuster role sees only their assigned claims
- Approve and submit flow for examiner/admin
- Email intake creates claims with `firm_id` set (complete)
- Full end-to-end test: receive → assign → inspect → approve → submit

### Phase 4 — Dispatch & Calendar (Planned)
- Dispatch map with real adjuster and claim pins
- Lasso select assigns real claims to real adjusters
- Calendar with real appointments from Supabase
- Scheduling modal saves to `appointments` table
- Drag claim from queue to calendar day

### Phase 5 — Clients, Billing & Adjusters (Planned)
- Clients page wired to real carrier data
- Fee schedule management per client
- Invoice auto-generation on claim approval
- Adjuster profiles and capability matching
- Pay summary per adjuster

### Phase 6 — Integrations & Polish (Planned)
- Stripe subscription and per-report billing
- Xactware integration via email parsing (INSPEKTiT already handles)
- SendGrid notifications (SLA alerts, assignment notifications)
- Real-time updates via Supabase Realtime
- Super admin layer for multi-firm management
- Carrier portal

---

## Tech Stack

```
Framework:    Next.js 16 (App Router, Turbopack)
Language:     TypeScript — no any types
Styling:      Tailwind CSS + CSS custom properties
Auth:         Supabase Auth (@supabase/ssr)
Database:     Supabase (PostgreSQL) — shared with INSPEKTiT
Maps:         Mapbox GL JS
Payments:     Stripe (Phase 6)
Email:        SendGrid Inbound Parse (intake) + SendGrid API (notifications)
Deployment:   Vercel at inspektiq.io
Repo:         keystonesystem1/INSPEKTiQ
```

---

## Key Data

```
Supabase project:   cgctwrywvrwbvtgegctx
Keystone firm ID:   919d3aed-3ae9-4feb-9b70-f2f8adbe314d
Email intake:       intake+e79f863e@parse.keystonestack.com
MX record:          parse.keystonestack.com → mx.sendgrid.net (Cloudflare)
SendGrid webhook:   https://inspektit-app.vercel.app/api/email-intake
```

---

## Test Users (Keystone Adjusting firm)

| Email | Role |
|---|---|
| andrewacowen@gmail.com | firm_admin |
| mike.weaver2013@gmail.com | firm_admin |
| joshaccarter@hotmail.com | firm_admin |
| carteradjuster@gmail.com | adjuster |

---

*INSPEKTiQ Product Roadmap — Keystone Stack LLC — Q2 2026*
