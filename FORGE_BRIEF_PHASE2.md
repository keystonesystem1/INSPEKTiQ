# INSPEKTiQ — Forge Build Brief: Phase 2
**Full Frontend Rebuild**
**Version 1.0 — Read DESIGN_SYSTEM.md before writing a single line of code**

---

## Overview

This brief instructs Forge to perform a complete frontend rebuild of INSPEKTiQ. The existing `src/` directory is to be deleted and rebuilt from scratch. The Supabase schema, Vercel configuration, and environment variables are preserved exactly as-is.

**Before starting:** Read `/docs/DESIGN_SYSTEM.md` in full. Every visual decision in this build is governed by that document. If something is not defined in the Design System, ask before inventing.

---

## Step 0 — What to Delete

Delete the entire `src/` directory contents. Rebuild it fresh. Do not touch:
- `supabase/` — migration files stay
- `.env.local` — environment variables stay
- `package.json`, `next.config.js`, `tailwind.config.js`, `tsconfig.json` — update as needed, do not delete
- `public/` — assets stay
- `docs/` — this brief and the design system live here

---

## Step 1 — Project Setup

### Install Dependencies
```bash
npm install @supabase/supabase-js @supabase/auth-helpers-nextjs
npm install mapbox-gl @types/mapbox-gl
npm install @dnd-kit/core @dnd-kit/sortable  # drag and drop for dispatch/calendar
npm install date-fns                           # date formatting
npm install zustand                            # lightweight state management
```

### Update tailwind.config.js
Extend with design tokens from DESIGN_SYSTEM.md section 11. Add `fontFamily`, `colors`, and `borderRadius` extensions exactly as specified.

### Update globals.css
Define all CSS custom properties from DESIGN_SYSTEM.md section 2 in `:root`. Import Google Fonts (Orbitron 900, Barlow Condensed 400/600/700/800/900, Barlow 300/400/500).

---

## Step 2 — File Structure

Build the following structure under `src/`:

```
src/
  app/
    layout.tsx                    # Root layout — fonts, providers
    page.tsx                      # Redirect to /dashboard
    (auth)/
      signin/page.tsx             # Sign in page
      signout/page.tsx            # Sign out handler
    (app)/
      layout.tsx                  # App shell — nav + role guard
      dashboard/page.tsx          # Daily Brief dashboard
      claims/
        page.tsx                  # Claims list
        [id]/page.tsx             # Claim detail
      clients/
        page.tsx                  # Clients list
        [id]/page.tsx             # Client detail
      dispatch/page.tsx           # Dispatch map
      adjusters/
        page.tsx                  # Adjuster roster
        [id]/page.tsx             # Adjuster profile
      calendar/page.tsx           # Calendar / schedule
      billing/page.tsx            # Billing / invoices
      settings/page.tsx           # Settings / profile
  components/
    nav/
      TopNav.tsx                  # Top navigation bar
      NavTab.tsx                  # Individual nav tab
    layout/
      AppShell.tsx                # Auth wrapper + role guard
      PageHeader.tsx              # Page title + subtitle + actions
    ui/
      Button.tsx                  # btn, btn-primary, btn-ghost, btn-danger, btn-sm
      Badge.tsx                   # All badge variants
      Card.tsx                    # Base card component
      StatCard.tsx                # Stat card with accent
      Pill.tsx                    # Status filter pill with SLA dot
      Toggle.tsx                  # Toggle switch
      Modal.tsx                   # Modal backdrop + container
      Avatar.tsx                  # Initials circle
      Table.tsx                   # Table wrap + thead/tbody styles
      FormInput.tsx               # Input + label
    dashboard/
      DashboardAdmin.tsx
      DashboardExaminer.tsx
      DashboardDispatcher.tsx
      DashboardAdjuster.tsx
      DashboardCarrier.tsx
    claims/
      ClaimsList.tsx
      ClaimsFilters.tsx
      ClaimRow.tsx
      ClaimDetail/
        ClaimHeader.tsx
        MilestoneBar.tsx
        ClaimTabs.tsx
        tabs/
          OverviewTab.tsx
          NotesTab.tsx
          DocumentsTab.tsx
          InspectionTab.tsx
          TimeExpenseTab.tsx
          TasksTab.tsx
          ReservesTab.tsx
          ClaimantsTab.tsx
          CoveragesTab.tsx
          LossLocationsTab.tsx
          CarrierFormsTab.tsx
          FirmFormsTab.tsx
          LinksTab.tsx
          TimelineTab.tsx
        OverviewCustomizer.tsx    # Slide-out panel for toggling overview cards
    dispatch/
      DispatchMap.tsx
      ClaimsList.tsx              # Left panel
      AdjusterRoster.tsx          # Right panel
      LassoFilters.tsx            # Popover
      AssignModal.tsx
      OverrideModal.tsx
    calendar/
      CalendarView.tsx
      ScheduleQueue.tsx           # Left panel
      RouteMap.tsx                # Right panel
      DayDrawer.tsx
      ScheduleModal.tsx
    billing/
      BillingTable.tsx
      InvoiceModal.tsx
    settings/
      SettingsLayout.tsx
  lib/
    supabase/
      client.ts                   # Browser client
      server.ts                   # Server client
      middleware.ts               # Auth middleware
    types/
      index.ts                    # All TypeScript interfaces
    utils/
      roles.ts                    # Role permission helpers
      sla.ts                      # SLA calculation utilities
      dates.ts                    # Date formatting helpers
  hooks/
    useUser.ts                    # Current user + role
    useClaims.ts                  # Claims data + filters
    useAdjusters.ts               # Adjuster data
```

---

## Step 3 — Authentication & Role System

### Supabase Auth
- Use existing Supabase project (credentials in `.env.local`)
- Auth is already set up from Phase 1 — preserve the users and session handling
- Role is stored in the `firm_users` table as the `role` column

### Middleware (src/lib/supabase/middleware.ts)
Protect all `(app)` routes. Unauthenticated users redirect to `/signin`. Run on every request.

### Role Guard (AppShell.tsx)
After auth, fetch the user's role from `firm_users`. Store in Zustand. Use to:
1. Render only the correct nav tabs
2. Protect routes — redirect if user navigates to a route their role cannot access
3. Show/hide UI elements per role

### Role Permissions (src/lib/utils/roles.ts)
```typescript
export type Role = 'super_admin' | 'firm_admin' | 'examiner' | 'dispatcher' | 'adjuster' | 'carrier';

export const ROLE_TABS: Record<Role, string[]> = {
  super_admin:  ['dashboard','claims','clients','dispatch','adjusters','calendar','billing','settings'],
  firm_admin:   ['dashboard','claims','clients','dispatch','adjusters','calendar','billing','settings'],
  examiner:     ['dashboard','claims','billing'],
  dispatcher:   ['dashboard','claims','dispatch','calendar'],
  adjuster:     ['dashboard','claims','calendar'],
  carrier:      ['dashboard','claims'],
};

export const canCreateClaims = (role: Role) => ['firm_admin','dispatcher','super_admin'].includes(role);
export const canAssignClaims = (role: Role) => ['firm_admin','dispatcher','super_admin'].includes(role);
export const canApproveClaims = (role: Role) => ['firm_admin','examiner','super_admin'].includes(role);
export const canViewBilling = (role: Role) => ['firm_admin','examiner','super_admin'].includes(role);
export const canViewSettings = (role: Role) => ['firm_admin','super_admin'].includes(role);
```

---

## Step 4 — Top Navigation

Reference: DESIGN_SYSTEM.md section 4, and `inspektiq-wireframe-v3.html` for visual reference.

### TopNav.tsx
- Fixed, full width, height 56px (`--nav-h`)
- Background: `rgba(8, 12, 16, 0.92)` with `backdrop-filter: blur(12px)`
- Left: INSPEKTiQ wordmark (Orbitron 900, INSPEKT white, iQ sage)
- Center: Tab links — render only tabs for current role
- Right: Search input + avatar dropdown (name, settings, sign out)
- Active tab: sage color + 2px gradient underline
- Nav search: styled input with search icon prefix

---

## Step 5 — Dashboard (Daily Brief)

Reference: `inspektiq-wireframe-v3.html`

Five separate dashboard components, one per role. The router renders the correct one based on the user's role.

### All dashboards share:
- Personalized greeting: "Good morning, [First Name]." — Barlow Condensed 800, 26px
- Subtitle: date + firm name + brief context — Barlow 300, 13px, muted
- Stat cards with left-edge accent color via `--accent` CSS variable

### Firm Admin Dashboard
Stat cards (4): Active Claims (blue accent), SLA At-Risk (orange accent), Unassigned (orange accent), New Today (sage accent)

Two-column layout below stats:
- Left col: SLA Alerts card + Unassigned Claims card (with one-click Assign button linking to Dispatch)
- Right col: Today's Activity feed + Adjuster Workload snapshot

### Examiner Dashboard
Stat cards (3): Awaiting Review (orange), Approved This Week (sage), Bills Pending (default)
Full-width Review Queue card — claims in "In Review" sorted by wait time, inline Approve + Request Changes buttons

### Dispatcher Dashboard
Stat cards (3): Unassigned (orange), Scheduled Today (blue), Available Adjusters (sage)
Two-column: Unassigned claims with Assign buttons (linking to Dispatch) + Adjuster availability list

### Adjuster Dashboard
Stat cards (3): Active Assignments (blue), Completed This Week (sage), SLA At-Risk (orange)
Active claims list — each with appointment time, SLA badge, and action buttons
New assignments show Accept button — clicking logs timestamp and updates status

### Carrier Dashboard
Stat cards (3): Open Claims (blue), Reports Ready (sage), Pending Inspection (default)
Read-only claims list filtered to their policies — no edit, assign, or billing actions

---

## Step 6 — Claims Page

Reference: `inspektiq-wireframe-v3.html` (claims tab)

### Layout
Page header with title + role-gated "New Claim" button

### Status Filter Pills
Row of pills: All, Received, Assigned, Scheduled, Inspected, In Review, Approved, Submitted, Closed, On Hold

SLA count logic:
- Fetch claims near SLA deadline for each status
- "Received" pill shows red dot if any received claims approaching 24hr assignment SLA
- "In Review" pill shows orange dot if any in-review claims approaching 3-day approval SLA
- Dot color: red = overdue, orange = within 2 days

### Claims Table
Columns: Claim # | Insured | Client | Type | DOL | Adjuster | Due Date | Status

- Due date: orange when ≤2 days, red when overdue
- Status column: badge component
- Row click: navigate to `/claims/[id]`
- Adjuster column: hidden for `adjuster` role (they only see their own)
- Carrier column renamed "Client" in all UI text

### SLA Utilities (src/lib/utils/sla.ts)
```typescript
// Default SLA thresholds (overridable per firm in settings)
export const DEFAULT_SLA = {
  received_to_assigned:     24,   // hours
  assigned_to_contacted:    48,   // hours
  contacted_to_inspection:  120,  // hours (5 business days)
  inspection_to_report:     120,  // hours (5 business days)
  report_to_approval:       72,   // hours (3 business days)
};

export function getSLAStatus(claim: Claim, thresholds = DEFAULT_SLA): 'ok' | 'warning' | 'overdue'
export function getSLAHoursRemaining(claim: Claim, thresholds = DEFAULT_SLA): number
export function getSLADueDate(claim: Claim, thresholds = DEFAULT_SLA): Date
```

---

## Step 7 — Claim Detail

Reference: `inspektiq-claim-detail.html` (approved wireframe)

### URL: `/claims/[id]`

### Layout (fixed header, scrollable content)
```
[Claim Header — name, meta, status badge, action buttons]
[Milestone Bar — 9 stages]
[Tab Row — 14 tabs + Customize Overview button]
[Content Area — scrollable, tab-specific]
```

### Claim Header
- Back button → `/claims`
- Insured name: Barlow Condensed 800, 22px
- Meta row: Claim #, Client, Type, DOL, Adjuster, Examiner, Due Date
- Right side: Status badge (large), Approve Report button (examiner/admin only), Request Changes button, ··· menu

### Milestone Bar
9 stages: Received → Accepted → Contacted → Scheduled → Inspected → In Review → Approved → Submitted → Closed

Visual states:
- Done: filled sage circle with checkmark, sage label
- Current: orange pulsing dot, orange label
- Pending: hollow dim circle, faint label
- Connecting lines: sage when done, dim border when pending

### 14 Tabs

**Overview tab:**
Customizable card grid (default 4 columns). Available cards:
- Claim Status + SLA (default on)
- Key Contacts (default on)
- Reserves total (default on)
- Recent Documents (default on)
- Open Tasks (default off)
- Time & Expense summary (default off)
- Recent Note (default off)
- Inspection status (default off)

Below cards: two-column layout with Claim Details and Insured Information info rows, plus Special Instructions.

Customize Overview button: slides in right-side panel showing all 8 cards with toggle switches. User preference saved to Supabase `user_preferences` table.

**Notes tab:**
Filter pills: All, Shared, Internal, System
Two note tiers:
- Internal: visible to firm users only (admin, examiner, dispatcher)
- Shared: visible to firm users + assigned adjuster

Compose box with tab switch (Shared / Internal Only). "Post Note" saves to `claim_notes` table with `note_type`, `author_id`, `created_at`.

System auto-log: when activity log is enabled in firm settings, status changes and milestone updates are auto-logged as `note_type: 'system'`.

**Documents tab:**
Filter pills: All Files, Reports, Carrier, Adjuster
Grouped file table (group by file type). Columns: File Type | Title | Size | Uploaded | Reviewed | Status
Upload button: role-gated. Carrier can only see approved + carrier-uploaded docs.

**Inspection tab:**
Read-only view of INSPEKTiT inspection data synced via Supabase. Shows inspection sections (Roof, Exterior, Interior, Other Structures, Personal Property) with completion status and photo counts.

**Time & Expense tab:**
Entry list with columns: Date | Description | Type | Amount
Types: Time, Drive Time, Mileage, Expense
Add Entry button (adjuster role) — modal with date, description, type, amount fields.

**Tasks tab:**
Filter: All, Open, Done
Task list with checkbox, name, assigned to, due date, status badge.
Clicking checkbox toggles completion and logs to timeline.
Add Task button — modal with task name, assignee (dropdown of firm users on this claim), due date.

**Reserves tab:**
Table: Loc/Bldg | Description | Coverage Type | Amount
Add Reserve button (admin/examiner only).
Total reserves shown above table.

**Claimants tab:**
Card per claimant with name, role (Primary/Secondary), phone, email, address.
Add Claimant button — modal.

**Coverages tab:**
Coverage type + limit rows. Edit button for admin/examiner.

**Loss Locations tab:**
Address list with Loc/Bldg identifier. Add Location button.

**Carrier Forms tab:**
Forms pulled from the carrier's document library (stored against the client record in Clients tab). Download button per form.

**Firm Forms tab:**
Forms from firm's document library (stored at firm level in Settings/Documents). Download button per form.

**Links tab:**
Ordered list of named external URLs. Add Link button. Default links include Xactimate, Eagle View, Google Maps to loss location, weather history for DOL.

**Timeline tab:**
Chronological audit trail — auto-generated from status changes, milestone completions, note additions, document uploads. Each entry: action, who, timestamp. Color-coded by action type.

---

## Step 8 — Adjuster Milestone Flow

When an adjuster opens a new claim on their dashboard or claims list:

1. **Accept button** shown on new assignments → clicking:
   - Sets `accepted_at` timestamp on claim
   - Creates a system note: "Claim accepted by [name]"
   - Adds timeline entry
   - Updates claim status to `assigned`

2. **First Contact** milestone button on claim detail → clicking:
   - Opens a pre-filled note modal: "First contact made with insured [name]. [Spoke with / Left voicemail / Sent text]. Scheduled discussion: [details]."
   - Adjuster edits and saves
   - Sets `first_contact_at` timestamp
   - Adds timeline entry

3. **Inspection Scheduled** milestone → clicking:
   - Opens scheduling modal (links to Calendar)
   - On save: sets `scheduled_at`, creates appointment
   - Pre-fills note: "Inspection scheduled for [date] at [time]. Insured confirmed."

4. **Inspection Complete** milestone (auto-triggered from INSPEKTiT sync, or manual):
   - Pre-fills note: "Inspection completed. [X] photos captured. Report in progress."
   - Sets `inspected_at`, updates status to `inspected`

---

## Step 9 — Dispatch Page

Reference: `inspektiq-dispatch-v2.html` (approved wireframe)

### Three-panel layout
```
[Left 290px: Unassigned Claims] [Center flex: Mapbox Map] [Right 300px: Adjuster Roster]
```

### Left Panel — Unassigned Claims
Filter pills: All, Residential, Commercial, SLA Risk, TWIA, Wind, Hail
Claim cards: name, address, type, carrier, SLA badge
Click to highlight pin on map

### Center Panel — Mapbox Map
Map provider: Mapbox GL JS
Claim pins color-coded by SLA status (red=overdue, orange=at-risk, sage=ok)
Adjuster location pins (blue)
Show/Hide claims and adjusters toggle controls

**Lasso Tool:**
- Activate: click "◎ Lasso Select" button — opens pre-filter popover
- Pre-filter popover (appears above map controls):
  - Loss Type chips (multi-select): Wind, Hail, Wind+Hail, Fire, Flood, Liability
  - Claim Category chips: Residential, Commercial, Farm/Ranch, Industrial
  - Certifications Required chips: TWIA, Flood Cert, Commercial Lic
  - Carrier chips (multi-select)
  - Max Claims slider (1–30, default 15)
- After applying filters: lasso mode active, non-matching pins dim to 25% opacity
- Draw: **freehand polygon** — user clicks to place points, double-clicks to close the polygon. Uses Mapbox draw polygon tool or custom SVG overlay with click-to-add-point, double-click-to-close.
- On close: all claim pins inside polygon that match filters are selected (up to max)
- Count bubble shows how many will be grabbed as user draws

### Right Panel — Adjuster Roster
Filter pills: All, Available, By Area, TWIA, Residential, Commercial, Favorites
Adjuster cards show:
- Name, location, active/max capacity bar
- Certifications and approved claim types (from adjuster profile)
- One-click Assign Claims button

### Assignment Modal
Shows selected claims list + adjuster selector grid (2 columns)
Adjuster cards show mismatch warnings (⚠ N issues) if:
- Claim requires TWIA cert and adjuster doesn't have it
- Claim carrier not in adjuster's approved carriers list
- Claim type not in adjuster's approved types
- Adjuster at or over capacity

### Override Modal (mismatch detected)
Orange-accented modal showing specific warnings.
Textarea: "Reason for Override (required)" — cannot confirm without typing a reason.
Override button only active when reason has ≥10 characters.

### Adjuster Capability Profiles
Set by firm admin in Adjusters tab. Per adjuster:
- Max active claims (hard cap)
- Approved claim types: Residential, Commercial, Farm/Ranch, Industrial, Flood, Auto
- Approved carriers: checkboxes from firm's client list
- Certifications: TWIA, Flood Cert, Commercial Lic, Drone, etc.
- Status: Active, Invited, Inactive, On Leave

---

## Step 10 — Calendar Page

Reference: `inspektiq-calendar.html` (approved wireframe)

### Three-section layout
```
[Left 280px: Needs Scheduling Queue] [Center flex: Calendar] [Right 320px: Route Map (toggleable)]
```

### Left Panel — Needs Scheduling Queue
Sorted by SLA urgency (overdue first, then by remaining time)
Filter pills: All, SLA Risk, Residential, Commercial
Each claim card: name, address, type, carrier, SLA badge, Schedule button, First Contact button, ··· menu
Drag handle — claims are draggable onto calendar days

### Center Panel — Calendar
Month view (default), Week view toggle
Navigation: ‹ › arrows + Today button

**Weather row:** Above day-of-week headers, shows forecast icon + high temp for each column. Source: OpenWeatherMap API or similar. Weather defaults to user's home base location. When hovering a claim that has been dropped on a day, weather updates to the loss location.

**Calendar grid:**
- Each cell: day number + weather icon + appointment blocks
- Appointment blocks: color-coded sage (confirmed), orange (pending), blue (completed), red (SLA alert)
- Click day: opens bottom drawer showing all appointments for that day
- Drag claim from left queue onto day: opens scheduling modal pre-filled with that claim and date

**Bottom drawer:**
Slides up from bottom of calendar area. Shows appointments for clicked day with time, insured name, address, type, confirmation status, and quick actions (View Claim, Message Insured, Cancel).

### Right Panel — Route Map (Mapbox)
Toggleable with ◉ Map button in cal header
Shows pins for all appointments on selected day + home base pin
Route estimate: total drive time + miles
Multiple saved home base locations (home + deployment hotels)
User manages home bases in Settings → Routing

### Scheduling Modal
Triggered by: clicking Schedule on queue item, dropping claim on calendar day, or clicking + Schedule Claim
Fields: Claim (pre-filled if from drag/drop), Date, Arrival Time, Window End Time, Notify Insured Via (Text/Email/Both/Manual), Message to Insured (pre-filled template, editable)
On confirm: creates appointment in `appointments` table, notifies insured (future: SMS/email via SendGrid), syncs to INSPEKTiT calendar via shared Supabase backend

---

## Step 11 — Clients Page

### Clients List (`/clients`)
Table: Client Name | Primary Contact | Active States | Open Claims | Fee Bill | Guidelines | Actions

### Client Detail (`/clients/[id]`)
Tabs: Overview, Contacts, Documents, Fee Bill, CHECKiT Rules, Stats

**Overview:** Client name, primary contact, firm rep, active states, open claim count, claims to date, avg estimate size

**Contacts:** List of carrier contacts with name, title, phone, email. Add/edit contacts.

**Documents:** Firm uploads per carrier: fee bill PDF, guidelines, cheat sheet, GLR structure template. Each document: title, date, type, download.

**Fee Bill:** Fee schedule table — estimate size tiers with fee amounts, hourly rates for time, drive time rate, mileage rate, reopen cost. These values drive auto-calculation in Billing.

**CHECKiT Rules:** Rules synced to INSPEKTiT that enforce carrier-specific inspection requirements before adjuster can leave the inspection. Editable list of rules per loss type.

**Stats:** Open claims, closed claims, total billed, avg estimate size, avg days to close.

---

## Step 12 — Billing Page

### Layout
Page header with Fee Schedules button + New Invoice button (admin/examiner only)
Stat cards (3): Pending Invoices, Approved This Month, Paid YTD

### Invoice Table
Columns: Date | Claim # | Insured | Invoice Type | % Comm | Service Fee | Mileage | Other | Total Due | Status | Actions

Status values: Pending (orange), Approved (blue), Paid (sage), Disputed (red)

Invoice auto-calculation logic:
1. Examiner clicks Approve Report on a claim
2. System looks up the carrier's fee bill from the client record
3. Finds the estimate size tier and calculates service fee
4. Pulls T&E entries from the claim — adds mileage, drive time, additional expenses
5. Creates a draft invoice for examiner to review and edit
6. Examiner edits if needed and clicks Send to Carrier

### Adjuster Pay Summary
Separate view showing adjuster-facing breakdown:
Columns: Date | Claim # | Insured | Invoice Type | % Commission | Service Fee | E&O | Est Platform | Mileage | Other | Comm | Holdback | Total Paid | Total Due | Date Paid

---

## Step 13 — Adjusters Page

### Adjuster Roster (`/adjusters`)
Table: Name | Status | Active Claims | Completed | Avg SLA % | Paid YTD | Avg per Claim | Docs | Actions
Invite Adjuster button → generates invite link + sends email

### Adjuster Profile (`/adjusters/[id]`)
Tabs: Overview, Capability Profile, Documents, Pay History

**Overview:** Contact info, license number, active states, stats

**Capability Profile (firm admin only):**
- Max active claims (number input)
- Approved claim types (checkboxes)
- Approved carriers (checkboxes from firm's client list)
- Certifications on file (multi-select with custom add)
- Status: Active / Inactive / On Leave

**Documents:**
- W-9 on file (upload)
- Bank/ACH info (redacted display, admin can update)
- License documents
- Certification documents

**Pay History:**
Table matching Pay Summary format from Billing

---

## Step 14 — Settings Page

Sections (left sidebar nav within settings):

**Firm Profile**
- Firm name, portal URL, logo upload
- Brand color (used in carrier portal header)

**User Profile**
- Name, email, profile photo, password reset

**SLA Configuration**
- Per-status threshold fields (hours)
- Override per client: toggle "Use client-specific SLA" then set per client

**Notifications**
- Toggle per event: New claim assigned, SLA alert, Report submitted, Invoice approved
- Channel per event: Email, In-app, Both

**Integrations**
- Xactware: incoming email address (auto-generated: `[firm-slug]@intake.inspektiq.io`)
- Status: Active/Inactive, Last sync time
- Symbility: placeholder for future (show "Coming Soon" badge)

**Activity Log**
- Toggle: "Auto-log all user actions to claim notes"
- When enabled: status changes, assignments, document uploads are logged as system notes on each claim

**Routing Preferences (adjuster role only)**
- Saved home base locations (home + hotel addresses)
- Active location toggle

---

## Step 15 — Carrier Portal

Separate route prefix: `/carrier` or separate subdomain `carrier.inspektiq.io`

For now, build as a route-gated section within the same app. Carriers log in with the `carrier` role.

**Carrier can:**
- View their assigned claims (read-only)
- See claim status, scheduled appointments, notes tagged as Shared
- Download approved documents
- Upload documents to a claim (carrier uploads visible to firm only until approved)
- Assign new claims to the firm (not to a specific adjuster)

**Carrier cannot:**
- See Internal notes
- See billing or invoices
- See adjuster profiles or workload
- Modify any claim data

---

## Step 16 — Supabase Schema Additions

The existing schema from Phase 1 (`migration_001.sql`) has: `firms`, `firm_users`, `carriers`, `claim_assignments`, `claim_status_log`, `invoices`. The `claims` table has `firm_id` and `carrier_id`.

Add via `supabase/migration_003.sql`:

```sql
-- Adjuster capability profiles
CREATE TABLE adjuster_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES firm_users(id),
  firm_id UUID REFERENCES firms(id),
  max_active_claims INTEGER DEFAULT 10,
  approved_claim_types TEXT[] DEFAULT '{}',
  approved_carriers UUID[] DEFAULT '{}',
  certifications TEXT[] DEFAULT '{}',
  home_bases JSONB DEFAULT '[]',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Claim notes (two-tier)
CREATE TABLE claim_notes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  claim_id UUID REFERENCES claims(id),
  author_id UUID REFERENCES firm_users(id),
  note_type TEXT CHECK (note_type IN ('internal','shared','system')),
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Appointments
CREATE TABLE appointments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  claim_id UUID REFERENCES claims(id),
  adjuster_id UUID REFERENCES firm_users(id),
  scheduled_date DATE NOT NULL,
  arrival_time TIME NOT NULL,
  window_end TIME,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending','confirmed','completed','cancelled')),
  insured_notified BOOLEAN DEFAULT FALSE,
  notification_method TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Claim milestones
CREATE TABLE claim_milestones (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  claim_id UUID REFERENCES claims(id),
  milestone TEXT NOT NULL,
  completed_by UUID REFERENCES firm_users(id),
  completed_at TIMESTAMPTZ DEFAULT NOW(),
  note_id UUID REFERENCES claim_notes(id)
);

-- User preferences (dashboard card config, etc.)
CREATE TABLE user_preferences (
  user_id UUID PRIMARY KEY REFERENCES firm_users(id),
  dashboard_cards JSONB DEFAULT '{}',
  default_landing TEXT DEFAULT 'dashboard',
  routing_preferences JSONB DEFAULT '{}',
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Client fee schedules
CREATE TABLE fee_schedules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  carrier_id UUID REFERENCES carriers(id),
  firm_id UUID REFERENCES firms(id),
  schedule_data JSONB NOT NULL,
  effective_date DATE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Claim tasks
CREATE TABLE claim_tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  claim_id UUID REFERENCES claims(id),
  assigned_to UUID REFERENCES firm_users(id),
  created_by UUID REFERENCES firm_users(id),
  title TEXT NOT NULL,
  due_date DATE,
  completed BOOLEAN DEFAULT FALSE,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- T&E entries
CREATE TABLE time_expense (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  claim_id UUID REFERENCES claims(id),
  user_id UUID REFERENCES firm_users(id),
  entry_date DATE NOT NULL,
  entry_type TEXT CHECK (entry_type IN ('time','drive_time','mileage','expense')),
  description TEXT,
  amount DECIMAL(10,2),
  unit TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Reserves
CREATE TABLE reserves (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  claim_id UUID REFERENCES claims(id),
  location TEXT,
  description TEXT,
  coverage_type TEXT,
  amount DECIMAL(12,2),
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

Add appropriate RLS policies for each table following the same pattern as `migration_001.sql`. Users can only read/write records belonging to their firm.

---

## Step 17 — Xactware Email Intake

Already built in INSPEKTiT (SendGrid Inbound Parse). Apply same pattern to INSPEKTiQ.

Each firm gets a dedicated intake email: `[firm-slug]@intake.inspektiq.io`

Webhook endpoint: `POST /api/email-intake`

Parse incoming email from Xactware → auto-create claim record with:
- Insured name from email
- Loss address
- Claim number from subject line
- Carrier from sender domain lookup
- Status: `received`
- Source: `xactware_intake`

Emit a real-time notification to firm admin and dispatcher.

---

## Step 18 — What Forge Must Deliver

At the end of this build, the following must work end-to-end:

1. User signs in via Supabase auth → redirected to correct dashboard based on role
2. Each role sees only their nav tabs — unauthorized routes redirect to dashboard
3. All 5 dashboard variants render with live Supabase data
4. Claims list loads with status filter pills and SLA indicators
5. Claim Detail with all 14 tabs is navigable — tabs that require data show it, tabs without data show an appropriate empty state
6. Adjuster can accept a new claim and work through all 4 milestones
7. Dispatch page loads with map, lasso tool activates pre-filter popover, assignment modal + override modal work
8. Calendar page loads with month view, drag to schedule works, scheduling modal saves an appointment
9. All components follow the Design System — correct fonts, colors, border radius, spacing
10. All TypeScript types are defined — no `any`
11. Migration 003 has been run against the Supabase project

---

## Environment Variables

All already set in Vercel and `.env.local`:
```
NEXT_PUBLIC_SUPABASE_URL
NEXT_PUBLIC_SUPABASE_ANON_KEY
SUPABASE_SERVICE_ROLE_KEY
NEXT_PUBLIC_MAPBOX_TOKEN   ← Add this if not present
```

---

## Final Checklist Before Submitting to Forge

- [ ] `docs/DESIGN_SYSTEM.md` is in the repo
- [ ] `docs/FORGE_BRIEF_PHASE2.md` is in the repo
- [ ] Wireframe HTML files are in `docs/wireframes/`:
  - `inspektiq-wireframe-v3.html`
  - `inspektiq-calendar.html`
  - `inspektiq-dispatch-v2.html`
  - `inspektiq-claim-detail.html`
- [ ] Mapbox token added to environment variables
- [ ] Migration 003 SQL reviewed before running

---

*INSPEKTiQ Phase 2 Build Brief — Keystone Stack LLC — Q2 2026*
