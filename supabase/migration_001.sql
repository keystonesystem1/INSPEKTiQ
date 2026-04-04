-- INSPEKTiQ Phase 1 Schema Migration
-- Run this in the Supabase SQL Editor
-- These tables are additive — they do not modify any existing INSPEKTiT tables
-- except adding two nullable columns to the claims table.

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
