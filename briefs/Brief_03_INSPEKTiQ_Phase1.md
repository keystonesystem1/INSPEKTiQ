# FORGE BUILD BRIEF
## INSPEKTiQ — Phase 1 Foundation
**Brief 03 of 03 | Keystone Stack | April 2026**

---

## Objective

Bootstrap the INSPEKTiQ web platform from scratch. By the end of this brief: a new repo exists, Supabase schema is migrated, auth is working, role-based routing is in place, and the app is deployed to Vercel at inspektiq.io. No claim data UI yet — this is foundation only.

> **CRITICAL: INSPEKTiQ is a SEPARATE repo from INSPEKTiT. Do not modify the INSPEKTiT codebase in this brief. Both apps share the same Supabase project (cgctwrywvrwbvtgegctx).**

---

## Step 1 — Scaffold the Project

The GitHub repo (INSPEKTiQ under keystonesystem1) is already created and cloned locally. Initialize the Vite project inside it:

```bash
npm create vite@latest . -- --template react-ts
npm install
npm install @supabase/supabase-js react-router-dom
npm install -D tailwindcss postcss autoprefixer
npx tailwindcss init -p
```

---

## Step 2 — Tailwind Configuration

Configure `tailwind.config.js` with INSPEKTiQ design tokens:

```js
module.exports = {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        navy: '#0D1B2A',
        blue: { DEFAULT: '#4298CC', dark: '#2E6E9E' },
        orange: '#E07B3F',
        cream: '#F5F0EB',
        success: '#1A7F3C',
      },
      fontFamily: { sans: ['Inter', 'sans-serif'] },
    }
  },
  plugins: []
}
```

Add Inter font to `index.html`:

```html
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet">
```

---

## Step 3 — Environment Variables

Create `.env.local` in the repo root (this file must never be committed):

```
VITE_SUPABASE_URL=https://cgctwrywvrwbvtgegctx.supabase.co
VITE_SUPABASE_ANON_KEY=[provided in prompt]
```

Create `src/lib/supabase.ts`:

```ts
import { createClient } from '@supabase/supabase-js'

export const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_ANON_KEY
)
```

---

## Step 4 — Supabase Schema Migration

Output the following as a single SQL file called `supabase/migration_001.sql` for the user to paste into the Supabase SQL editor. Do not attempt to run it automatically.

These tables are additive — they do not modify any existing INSPEKTiT tables except adding two nullable columns to the claims table.

```sql
-- firms
CREATE TABLE firms (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  slug text UNIQUE NOT NULL,
  logo_url text,
  primary_color text DEFAULT '#4298CC',
  settings jsonb DEFAULT '{}',
  created_at timestamptz DEFAULT now()
);

-- firm_users
CREATE TABLE firm_users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  firm_id uuid REFERENCES firms(id) ON DELETE CASCADE,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  role text NOT NULL CHECK (role IN (
    'firm_admin','examiner','dispatcher',
    'adjuster','carrier','staff_adjuster'
  )),
  is_active boolean DEFAULT true,
  invited_at timestamptz DEFAULT now(),
  joined_at timestamptz,
  UNIQUE(firm_id, user_id)
);

-- carriers
CREATE TABLE carriers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  firm_id uuid REFERENCES firms(id) ON DELETE CASCADE,
  name text NOT NULL,
  contact_email text,
  guidelines_url text,
  guidelines_notes text,
  created_at timestamptz DEFAULT now()
);

-- claim_assignments
CREATE TABLE claim_assignments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  claim_id uuid REFERENCES claims(id) ON DELETE CASCADE,
  firm_id uuid REFERENCES firms(id) ON DELETE CASCADE,
  assigned_to uuid REFERENCES profiles(id),
  assigned_by uuid REFERENCES profiles(id),
  carrier_id uuid REFERENCES carriers(id),
  status text NOT NULL DEFAULT 'received' CHECK (status IN (
    'received','assigned','scheduled','inspected',
    'in_review','approved','submitted','closed','on_hold'
  )),
  sla_due_at timestamptz,
  submitted_at timestamptz,
  closed_at timestamptz,
  notes text,
  created_at timestamptz DEFAULT now()
);

-- claim_status_log
CREATE TABLE claim_status_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  assignment_id uuid REFERENCES claim_assignments(id) ON DELETE CASCADE,
  from_status text,
  to_status text NOT NULL,
  changed_by uuid REFERENCES profiles(id),
  changed_at timestamptz DEFAULT now(),
  note text
);

-- invoices (stub — not built in v1)
CREATE TABLE invoices (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  firm_id uuid REFERENCES firms(id) ON DELETE CASCADE,
  adjuster_id uuid REFERENCES profiles(id),
  assignment_id uuid REFERENCES claim_assignments(id),
  amount_cents integer NOT NULL DEFAULT 0,
  status text NOT NULL DEFAULT 'draft' CHECK (
    status IN ('draft','submitted','approved','paid')),
  submitted_at timestamptz,
  paid_at timestamptz,
  notes text
);

-- Add columns to existing claims table
ALTER TABLE claims
  ADD COLUMN IF NOT EXISTS firm_id uuid REFERENCES firms(id),
  ADD COLUMN IF NOT EXISTS carrier_id uuid REFERENCES carriers(id);

-- Enable RLS
ALTER TABLE firms ENABLE ROW LEVEL SECURITY;
ALTER TABLE firm_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE carriers ENABLE ROW LEVEL SECURITY;
ALTER TABLE claim_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE claim_status_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE invoices ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "firm_users_own" ON firm_users
  FOR ALL USING (user_id = auth.uid());

CREATE POLICY "firms_member" ON firms
  FOR SELECT USING (
    id IN (SELECT firm_id FROM firm_users WHERE user_id = auth.uid())
  );

CREATE POLICY "assignments_firm_member" ON claim_assignments
  FOR ALL USING (
    firm_id IN (SELECT firm_id FROM firm_users WHERE user_id = auth.uid())
  );

CREATE POLICY "carriers_firm_member" ON carriers
  FOR ALL USING (
    firm_id IN (SELECT firm_id FROM firm_users WHERE user_id = auth.uid())
  );
```

---

## Step 5 — Auth Context and Role-Aware Routing

Create `src/contexts/AuthContext.tsx`. After login, immediately query `firm_users` to get the current user's role and firm_id. Expose the following via context:

- `user` — Supabase auth user object
- `firmUser` — the firm_users row (includes role and firm_id)
- `loading` — boolean while auth state resolves
- `signOut` — function

### Route structure in `src/App.tsx`

| Route | Access |
|-------|--------|
| `/` | Redirect to /signin if not authenticated, else /dashboard |
| `/signin` | Public |
| `/dashboard` | All firm roles |
| `/claims` | All firm roles |
| `/claims/:id` | All firm roles |
| `/dispatch` | firm_admin and dispatcher only |
| `/adjusters` | firm_admin only |
| `/settings` | firm_admin only |
| `/carrier/*` | carrier and staff_adjuster only |

---

## Step 6 — Login Page

Build `src/pages/SignIn.tsx`.

**Design spec:**
- White card, centered on page, max-width 420px
- INSPEKTiQ wordmark at top (text placeholder)
- Email and password fields
- Sign In button — brand blue (#4298CC)
- Inline error message on auth failure
- Redirect to /dashboard on success
- No signup link — invite-only model

---

## Step 7 — App Shell (Sidebar + Layout)

Build the main authenticated layout wrapping all firm-facing pages.

**Sidebar spec:**
- Fixed left, 240px wide, navy (#0D1B2A) background
- INSPEKTiQ wordmark in white at top
- Nav items: Dashboard, Claims, Dispatch, Adjusters, Settings
- Hide Dispatch from Examiner; hide Adjusters and Settings from non-Admins
- Active item: brand blue left border + blue text
- User name and role badge at bottom
- Sign out button at very bottom

**Top bar spec:**
- 56px height, white background, bottom border #E0E0E0
- Dynamic page title matching current route
- Global search input (non-functional stub)

---

## Step 8 — Dashboard Page (Stub)

Build `src/pages/Dashboard.tsx`:

- Welcome message with user's name and firm name
- Four stat cards in a row: Total Claims, Active Assignments, In Review, Closed This Month — all showing 0
- Empty state: "Claims will appear here once your firm is connected"

---

## Step 9 — Local Verification

Before Vercel deploy, confirm:

- `npm run dev` starts without errors
- Login page loads at localhost
- Auth works — logged-in user lands on dashboard
- Sidebar shows correct nav items for the user's role
- No console errors on load

**Stop here and report back. The user will handle Vercel project creation and domain setup manually.**

---

## Acceptance Criteria

- [ ] Project scaffolded and dependencies installed
- [ ] Tailwind configured with correct design tokens
- [ ] Supabase client configured
- [ ] SQL migration file created at `supabase/migration_001.sql`
- [ ] Auth context working with role detection
- [ ] Login page functional
- [ ] Sidebar hides nav items based on role
- [ ] Dashboard stub renders
- [ ] App runs locally with no errors
- [ ] All changes committed to the INSPEKTiQ repo

---

*Brief 03 — INSPEKTiQ Phase 1 Foundation | Architecture reference: ClaimsIQ_Architecture.docx*
