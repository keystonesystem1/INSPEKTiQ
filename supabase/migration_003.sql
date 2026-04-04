-- INSPEKTiQ Migration 003
-- Phase 2 tables: notes, appointments, milestones, tasks, T&E, reserves, preferences, fee schedules
-- Run this in Supabase SQL Editor after migration_001.sql

-- ── CLAIM NOTES (two-tier: internal / shared / system) ─────────────────────
CREATE TABLE IF NOT EXISTS claim_notes (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  claim_id    UUID REFERENCES claims(id) ON DELETE CASCADE,
  author_id   UUID REFERENCES firm_users(id),
  note_type   TEXT NOT NULL CHECK (note_type IN ('internal', 'shared', 'system')),
  content     TEXT NOT NULL,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE claim_notes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "firm_users_own_notes" ON claim_notes
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM claims c
      JOIN firm_users fu ON fu.firm_id = c.firm_id
      WHERE c.id = claim_notes.claim_id
        AND fu.id = auth.uid()
    )
  );

-- ── APPOINTMENTS ────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS appointments (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  claim_id            UUID REFERENCES claims(id) ON DELETE CASCADE,
  adjuster_id         UUID REFERENCES firm_users(id),
  scheduled_date      DATE NOT NULL,
  arrival_time        TIME NOT NULL,
  window_end          TIME,
  status              TEXT DEFAULT 'pending' CHECK (status IN ('pending','confirmed','completed','cancelled')),
  insured_notified    BOOLEAN DEFAULT FALSE,
  notification_method TEXT CHECK (notification_method IN ('text','email','both','manual')),
  notes               TEXT,
  created_at          TIMESTAMPTZ DEFAULT NOW(),
  updated_at          TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE appointments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "firm_users_own_appointments" ON appointments
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM claims c
      JOIN firm_users fu ON fu.firm_id = c.firm_id
      WHERE c.id = appointments.claim_id
        AND fu.id = auth.uid()
    )
  );

-- ── CLAIM MILESTONES ────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS claim_milestones (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  claim_id      UUID REFERENCES claims(id) ON DELETE CASCADE,
  milestone     TEXT NOT NULL CHECK (milestone IN (
    'received','accepted','contacted','scheduled',
    'inspected','in_review','approved','submitted','closed'
  )),
  completed_by  UUID REFERENCES firm_users(id),
  completed_at  TIMESTAMPTZ DEFAULT NOW(),
  note_id       UUID REFERENCES claim_notes(id),
  override_reason TEXT
);

ALTER TABLE claim_milestones ENABLE ROW LEVEL SECURITY;

CREATE POLICY "firm_users_own_milestones" ON claim_milestones
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM claims c
      JOIN firm_users fu ON fu.firm_id = c.firm_id
      WHERE c.id = claim_milestones.claim_id
        AND fu.id = auth.uid()
    )
  );

-- ── CLAIM TASKS ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS claim_tasks (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  claim_id      UUID REFERENCES claims(id) ON DELETE CASCADE,
  created_by    UUID REFERENCES firm_users(id),
  assigned_to   UUID REFERENCES firm_users(id),
  title         TEXT NOT NULL,
  due_date      DATE,
  completed     BOOLEAN DEFAULT FALSE,
  completed_at  TIMESTAMPTZ,
  created_at    TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE claim_tasks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "firm_users_own_tasks" ON claim_tasks
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM claims c
      JOIN firm_users fu ON fu.firm_id = c.firm_id
      WHERE c.id = claim_tasks.claim_id
        AND fu.id = auth.uid()
    )
  );

-- ── TIME & EXPENSE ──────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS time_expense (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  claim_id    UUID REFERENCES claims(id) ON DELETE CASCADE,
  user_id     UUID REFERENCES firm_users(id),
  entry_date  DATE NOT NULL,
  entry_type  TEXT NOT NULL CHECK (entry_type IN ('time','drive_time','mileage','expense')),
  description TEXT,
  amount      DECIMAL(10,2),
  unit        TEXT,
  invoiced    BOOLEAN DEFAULT FALSE,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE time_expense ENABLE ROW LEVEL SECURITY;

CREATE POLICY "firm_users_own_te" ON time_expense
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM claims c
      JOIN firm_users fu ON fu.firm_id = c.firm_id
      WHERE c.id = time_expense.claim_id
        AND fu.id = auth.uid()
    )
  );

-- ── RESERVES ────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS reserves (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  claim_id      UUID REFERENCES claims(id) ON DELETE CASCADE,
  location      TEXT,
  description   TEXT,
  coverage_type TEXT,
  amount        DECIMAL(12,2),
  created_by    UUID REFERENCES firm_users(id),
  created_at    TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE reserves ENABLE ROW LEVEL SECURITY;

CREATE POLICY "firm_users_own_reserves" ON reserves
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM claims c
      JOIN firm_users fu ON fu.firm_id = c.firm_id
      WHERE c.id = reserves.claim_id
        AND fu.id = auth.uid()
    )
  );

-- ── USER PREFERENCES ────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS user_preferences (
  user_id              UUID PRIMARY KEY REFERENCES firm_users(id) ON DELETE CASCADE,
  dashboard_cards      JSONB DEFAULT '{"status":true,"contacts":true,"reserves":true,"docs":true,"tasks":false,"te":false,"notes_recent":false,"inspection":false}',
  default_landing      TEXT DEFAULT 'dashboard',
  routing_preferences  JSONB DEFAULT '{"home_bases":[]}',
  updated_at           TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE user_preferences ENABLE ROW LEVEL SECURITY;

CREATE POLICY "own_preferences" ON user_preferences
  FOR ALL USING (user_id = auth.uid());

-- ── ADJUSTER CAPABILITY PROFILES ────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS adjuster_profiles (
  id                   UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id              UUID REFERENCES firm_users(id) ON DELETE CASCADE,
  firm_id              UUID REFERENCES firms(id) ON DELETE CASCADE,
  max_active_claims    INTEGER DEFAULT 10,
  approved_claim_types TEXT[] DEFAULT '{}',
  approved_carriers    UUID[] DEFAULT '{}',
  certifications       TEXT[] DEFAULT '{}',
  home_bases           JSONB DEFAULT '[]',
  created_at           TIMESTAMPTZ DEFAULT NOW(),
  updated_at           TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE adjuster_profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "firm_users_own_profiles" ON adjuster_profiles
  FOR ALL USING (
    firm_id IN (
      SELECT firm_id FROM firm_users WHERE id = auth.uid()
    )
  );

-- ── FEE SCHEDULES ────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS fee_schedules (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  carrier_id      UUID REFERENCES carriers(id) ON DELETE CASCADE,
  firm_id         UUID REFERENCES firms(id) ON DELETE CASCADE,
  schedule_data   JSONB NOT NULL DEFAULT '{}',
  effective_date  DATE,
  created_at      TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE fee_schedules ENABLE ROW LEVEL SECURITY;

CREATE POLICY "firm_users_own_fee_schedules" ON fee_schedules
  FOR ALL USING (
    firm_id IN (
      SELECT firm_id FROM firm_users WHERE id = auth.uid()
    )
  );

-- ── CLAIMANTS ────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS claimants (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  claim_id    UUID REFERENCES claims(id) ON DELETE CASCADE,
  name        TEXT NOT NULL,
  role        TEXT DEFAULT 'primary' CHECK (role IN ('primary','secondary','other')),
  phone       TEXT,
  email       TEXT,
  address     TEXT,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE claimants ENABLE ROW LEVEL SECURITY;

CREATE POLICY "firm_users_own_claimants" ON claimants
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM claims c
      JOIN firm_users fu ON fu.firm_id = c.firm_id
      WHERE c.id = claimants.claim_id
        AND fu.id = auth.uid()
    )
  );

-- ── LOSS LOCATIONS ───────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS loss_locations (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  claim_id      UUID REFERENCES claims(id) ON DELETE CASCADE,
  loc_bldg      TEXT DEFAULT '001/001',
  address       TEXT NOT NULL,
  city          TEXT,
  state         TEXT,
  zip           TEXT,
  is_primary    BOOLEAN DEFAULT TRUE,
  created_at    TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE loss_locations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "firm_users_own_locations" ON loss_locations
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM claims c
      JOIN firm_users fu ON fu.firm_id = c.firm_id
      WHERE c.id = loss_locations.claim_id
        AND fu.id = auth.uid()
    )
  );

-- ── COVERAGES ────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS coverages (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  claim_id        UUID REFERENCES claims(id) ON DELETE CASCADE,
  coverage_type   TEXT NOT NULL,
  limit_amount    DECIMAL(12,2),
  deductible      DECIMAL(12,2),
  created_at      TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE coverages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "firm_users_own_coverages" ON coverages
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM claims c
      JOIN firm_users fu ON fu.firm_id = c.firm_id
      WHERE c.id = coverages.claim_id
        AND fu.id = auth.uid()
    )
  );

-- ── HELPFUL INDEXES ──────────────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_claim_notes_claim_id ON claim_notes(claim_id);
CREATE INDEX IF NOT EXISTS idx_appointments_claim_id ON appointments(claim_id);
CREATE INDEX IF NOT EXISTS idx_appointments_adjuster_id ON appointments(adjuster_id);
CREATE INDEX IF NOT EXISTS idx_appointments_date ON appointments(scheduled_date);
CREATE INDEX IF NOT EXISTS idx_claim_tasks_claim_id ON claim_tasks(claim_id);
CREATE INDEX IF NOT EXISTS idx_time_expense_claim_id ON time_expense(claim_id);
CREATE INDEX IF NOT EXISTS idx_reserves_claim_id ON reserves(claim_id);
CREATE INDEX IF NOT EXISTS idx_claimants_claim_id ON claimants(claim_id);
CREATE INDEX IF NOT EXISTS idx_loss_locations_claim_id ON loss_locations(claim_id);
CREATE INDEX IF NOT EXISTS idx_coverages_claim_id ON coverages(claim_id);
