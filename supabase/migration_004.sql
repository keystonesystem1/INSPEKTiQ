-- INSPEKTiQ Migration 004
-- Workflow Studio: workflows table
-- Run this in Supabase SQL Editor after migration_003.sql

CREATE TABLE IF NOT EXISTS workflows (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  firm_id     UUID NOT NULL REFERENCES firms(id) ON DELETE CASCADE,
  name        TEXT NOT NULL,
  is_default  BOOLEAN NOT NULL DEFAULT FALSE,
  templates   JSONB NOT NULL DEFAULT '{}',
  matching    JSONB NOT NULL DEFAULT '{}',
  created_at  TIMESTAMPTZ DEFAULT NOW(),
  updated_at  TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE workflows ENABLE ROW LEVEL SECURITY;

CREATE POLICY "workflows_firm_member" ON workflows
  FOR ALL USING (
    firm_id IN (SELECT firm_id FROM firm_users WHERE user_id = auth.uid())
  );

CREATE INDEX IF NOT EXISTS idx_workflows_firm_id ON workflows(firm_id);
