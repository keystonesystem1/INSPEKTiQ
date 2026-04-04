# FORGE BUILD BRIEF
## INSPEKTiQ — Super Admin Layer & Firm Onboarding Flow
**Brief 04 | Keystone Stack | April 2026**

---

## Objective

Add a Keystone Stack super admin layer and a complete firm onboarding flow to the existing INSPEKTiQ codebase. When this brief is complete:

- A super admin (Keystone Stack operator) can log in and see all firms
- Super admin can create a new firm and send an invite email to the firm's admin
- The invited firm admin clicks the link, lands on a setup page, sets their password and firm details, and is immediately active
- Super admin can also manually create firms and seed their first admin user via the UI with no Supabase involvement

This is the flow that allows real firms (like Team One) to be onboarded without any manual database work.

---

## Context

The existing codebase has:
- Auth via Supabase (SignIn.tsx)
- Role-based routing (AuthContext.tsx) reading from `firm_users` table
- App shell with sidebar (AppShell.tsx)
- Dashboard stub (Dashboard.tsx)
- Supabase tables: firms, firm_users, carriers, claim_assignments, claim_status_log, invoices

The current top role is `firm_admin`. This brief adds `super_admin` as a new role that sits above all firms.

---

## Step 1 — Database Changes

Run the following SQL in the Supabase SQL editor. Output as `supabase/migration_002.sql`.

```sql
-- Add super_admin to the firm_users role check constraint
-- First drop the existing constraint, then recreate with super_admin included
ALTER TABLE firm_users 
  DROP CONSTRAINT IF EXISTS firm_users_role_check;

ALTER TABLE firm_users 
  ADD CONSTRAINT firm_users_role_check 
  CHECK (role IN (
    'super_admin','firm_admin','examiner','dispatcher',
    'adjuster','carrier','staff_adjuster'
  ));

-- Firm invitations table
CREATE TABLE firm_invitations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  firm_id uuid REFERENCES firms(id) ON DELETE CASCADE,
  email text NOT NULL,
  role text NOT NULL DEFAULT 'firm_admin',
  token text UNIQUE NOT NULL DEFAULT encode(gen_random_bytes(32), 'hex'),
  invited_by uuid REFERENCES auth.users(id),
  accepted_at timestamptz,
  expires_at timestamptz DEFAULT now() + interval '7 days',
  created_at timestamptz DEFAULT now()
);

ALTER TABLE firm_invitations ENABLE ROW LEVEL SECURITY;

-- Super admins can manage all invitations
CREATE POLICY "super_admin_invitations" ON firm_invitations
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM firm_users 
      WHERE user_id = auth.uid() AND role = 'super_admin'
    )
  );

-- Invited users can read their own invitation by token (public read for token lookup)
CREATE POLICY "invitation_token_read" ON firm_invitations
  FOR SELECT USING (true);

-- Super admin RLS policies for firms table
-- Super admins can see and manage ALL firms
CREATE POLICY "super_admin_firms_all" ON firms
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM firm_users 
      WHERE user_id = auth.uid() AND role = 'super_admin'
    )
  );

-- Super admin RLS for firm_users
CREATE POLICY "super_admin_firm_users_all" ON firm_users
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM firm_users fu2
      WHERE fu2.user_id = auth.uid() AND fu2.role = 'super_admin'
    )
  );
```

---

## Step 2 — Update AuthContext

Update `src/contexts/AuthContext.tsx` to handle the `super_admin` role.

Super admin users may not have a `firm_id` — their `firm_users` row has `firm_id = null`. The auth context must handle this gracefully:

- If role is `super_admin`, set `firmUser.firm_id` to null and do not attempt to load firm data
- Route super admins to `/superadmin` on login instead of `/dashboard`
- All other roles route to `/dashboard` as before

---

## Step 3 — Route Structure Updates

Add to `src/App.tsx`:

| Route | Access |
|-------|--------|
| `/superadmin` | super_admin only |
| `/superadmin/firms` | super_admin only |
| `/superadmin/firms/new` | super_admin only |
| `/superadmin/firms/:id` | super_admin only |
| `/invite/:token` | Public (no auth required) |
| `/onboarding` | Authenticated users with no firm yet |

---

## Step 4 — Super Admin Layout & Pages

Super admin gets its own minimal layout — no firm sidebar. Clean, simple, operations-focused.

### Super Admin Shell (`src/layouts/SuperAdminShell.tsx`)

- Top bar only: INSPEKTiQ wordmark + "Keystone Stack Admin" label + sign out
- No sidebar
- White background, clean

### Super Admin Dashboard (`src/pages/superadmin/Dashboard.tsx`)

- Stat cards: Total Firms, Active Firms, Pending Invites, Total Adjusters
- Firms table with columns: Firm Name, Admin Email, Adjusters, Claims, Status, Actions
- "Add Firm" button top right

### Add Firm Page (`src/pages/superadmin/AddFirm.tsx`)

Form with:
- Firm name (required)
- Firm admin first name (required)
- Firm admin last name (required)  
- Firm admin email (required)
- Optional: primary color, logo upload (skip for now — just the fields)
- Submit button: "Create Firm & Send Invite"

**On submit:**
1. Insert row into `firms` table (name, slug auto-generated from name)
2. Insert row into `firm_invitations` (firm_id, email, role = 'firm_admin', invited_by = current user)
3. Send invite email via Supabase Auth's `signInWithOtp` or generate a magic link — see Step 6 for email handling
4. Show success message: "Invite sent to [email]. They have 7 days to complete setup."

### Firm Detail Page (`src/pages/superadmin/FirmDetail.tsx`)

- Firm info card (name, slug, created date)
- Users list for that firm
- Invitations list (pending/accepted)
- "Resend Invite" and "Revoke" actions on pending invitations
- "Add User to Firm" button (for adding additional users to an existing firm)

---

## Step 5 — Firm Onboarding Flow

### Invite Landing Page (`src/pages/Invite.tsx`)

Route: `/invite/:token` — public, no auth required.

**On load:**
1. Read the token from the URL
2. Query `firm_invitations` where token matches and accepted_at is null and expires_at > now()
3. If invalid or expired: show "This invite link is invalid or has expired" with a contact link
4. If valid: show the onboarding form

**Onboarding form:**
- Welcome message: "You've been invited to join [Firm Name] on INSPEKTiQ"
- First name, last name (pre-filled if provided)
- Password + confirm password
- Submit: "Set Up My Account"

**On submit:**
1. Create Supabase auth user with the email and password via `supabase.auth.signUp()`
2. Insert row into `firm_users` (firm_id from invitation, user_id from new auth user, role from invitation)
3. Update `firm_invitations` set accepted_at = now()
4. Sign the user in automatically
5. Redirect to `/dashboard`

### Design spec for invite page:
- Centered card, max-width 480px
- INSPEKTiQ wordmark at top
- Firm name displayed prominently
- Clean form matching the signin page style
- Brand blue submit button

---

## Step 6 — Email Handling

For now, use a simple approach: when an invite is created, generate the invite URL client-side and display it to the super admin in the UI so they can copy and send it manually.

The URL format is: `https://inspektiq.io/invite/[token]`

Display it as:
- A copyable text field
- A "Copy Link" button
- A note: "Email sending will be automated in a future release. For now, copy and send this link to the firm admin."

This removes the dependency on configuring an email provider and lets you test the full flow immediately.

---

## Step 7 — Seed Super Admin User

Create `supabase/seed_superadmin.sql`:

```sql
-- Run this ONCE to create the Keystone Stack super admin entry
-- Replace the user_id with your actual Supabase auth user ID
-- Find your user ID in Supabase Dashboard > Authentication > Users

INSERT INTO firm_users (firm_id, user_id, role, is_active, joined_at)
VALUES (
  null,  -- super_admin has no firm
  '[YOUR_AUTH_USER_ID_HERE]',  -- replace this
  'super_admin',
  true,
  now()
)
ON CONFLICT (firm_id, user_id) DO UPDATE SET role = 'super_admin';
```

**Note for Andrew:** After running this migration, go to Supabase Dashboard → Authentication → Users, find your user (andrewacowen@gmail.com or similar), copy the UUID, replace `[YOUR_AUTH_USER_ID_HERE]` in the seed file, and run it. You will then be a super admin and can log in to `/superadmin`.

---

## Step 8 — Navigation Guard Updates

Update `src/contexts/AuthContext.tsx` role-based redirects:

```
super_admin  → /superadmin
firm_admin   → /dashboard
examiner     → /dashboard
dispatcher   → /dashboard
adjuster     → /dashboard
carrier      → /carrier
No firm_users row found → /onboarding (placeholder page)
```

Add a simple `/onboarding` page that says "Your account is being set up. Contact your firm admin if this persists." This catches any auth users who exist but have no firm_users row yet.

---

## Acceptance Criteria

- [ ] `supabase/migration_002.sql` created with all schema changes
- [ ] `supabase/seed_superadmin.sql` created with instructions
- [ ] Super admin logs in and lands on `/superadmin`
- [ ] Super admin can create a firm and get a copyable invite link
- [ ] Invite link resolves at `/invite/:token` with the correct firm name displayed
- [ ] New user completes onboarding form, account is created, they land on `/dashboard`
- [ ] Accepted invitation shows as accepted in the super admin firm detail view
- [ ] Expired or invalid tokens show an error message
- [ ] All existing firm_admin, examiner, dispatcher, adjuster flows unaffected
- [ ] No console errors

---

## What This Does NOT Include

- Automated email delivery (deferred — manual copy/paste link for now)
- Billing or subscription management for firms
- Firm self-serve signup page (deferred — super admin invite only for v1)
- Logo upload (fields present but non-functional)

---

*Brief 04 — Super Admin & Firm Onboarding | Prerequisite: Brief 03 complete and deployed*
