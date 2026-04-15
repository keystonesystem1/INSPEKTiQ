-- INSPEKTiQ Migration: 20260414_add_firm_intake_token
-- Adds a stable, unique intake_token to every firm row.
-- The token is an 8-character hex string derived from the firm's UUID via md5,
-- making it reproducible and collision-resistant within a small firm set.
--
-- Used to route inbound email/web intake requests to the correct firm without
-- exposing the internal firm UUID in public-facing URLs or email headers.
--
-- Step 1: Add the nullable column with a UNIQUE constraint
ALTER TABLE firms ADD COLUMN intake_token text UNIQUE;

-- Step 2: Backfill existing rows with a stable derived token
UPDATE firms SET intake_token = substr(md5(id::text), 1, 8);

-- Step 3: Lock the column to NOT NULL now that all rows are populated
ALTER TABLE firms ALTER COLUMN intake_token SET NOT NULL;
