-- INSPEKTiQ Migration: 20260414_add_pending_acceptance_status
-- Adds 'pending_acceptance' to the claims.status CHECK constraint.
-- This is the 18th valid status value. It sits between 'assigned' and 'accepted'
-- in the lifecycle: received → assigned → pending_acceptance → accepted → ...
--
-- Ownership: firm-side only. INSPEKTiQ writes this status when dispatching a claim
-- to an adjuster. INSPEKTiT reads and displays it but never writes it.
--
-- No rows are backfilled. This is an additive constraint change only.

ALTER TABLE claims
  DROP CONSTRAINT IF EXISTS claims_status_check;

ALTER TABLE claims
  ADD CONSTRAINT claims_status_check CHECK (status IN (
    'received',
    'assigned',
    'pending_acceptance',
    'accepted',
    'contact_attempted',
    'contacted',
    'scheduled',
    'inspection_started',
    'inspection_completed',
    'in_review',
    'approved',
    'submitted',
    'closed',
    'on_hold',
    'pending_te',
    'pending_carrier_direction',
    'pending_engineer',
    'needs_attention'
  ));
