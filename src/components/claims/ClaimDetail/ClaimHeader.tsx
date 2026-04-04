'use client';

import { useState, useTransition } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import type { Claim, ClaimStatus, Role } from '@/lib/types';
import type { AdjusterOption } from '@/lib/supabase/adjusters';
import { canApproveClaims } from '@/lib/utils/roles';
import { AssignAdjusterModal } from '@/components/claims/ClaimDetail/AssignAdjusterModal';

const statusOptions: ClaimStatus[] = [
  'received',
  'assigned',
  'contacted',
  'scheduled',
  'inspected',
  'in_review',
  'approved',
  'submitted',
  'closed',
  'on_hold',
  'pending_te',
  'pending_carrier_direction',
  'pending_engineer',
];

export function ClaimHeader({
  claim,
  role,
  adjusters,
}: {
  claim: Claim;
  role: Role;
  adjusters?: AdjusterOption[];
}) {
  const router = useRouter();
  const [status, setStatus] = useState<ClaimStatus>(claim.status);
  const [assignOpen, setAssignOpen] = useState(false);
  const [isPending, startTransition] = useTransition();

  return (
    <div style={{ paddingBottom: '14px' }}>
      <Link href="/claims" style={{ display: 'inline-flex', color: 'var(--muted)', fontFamily: 'Barlow Condensed, sans-serif', fontWeight: 700, fontSize: '10px', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: '8px' }}>
        ← Back to Claims
      </Link>
      <div style={{ display: 'flex', justifyContent: 'space-between', gap: '16px' }}>
        <div>
          <div style={{ fontFamily: 'Barlow Condensed, sans-serif', fontWeight: 800, fontSize: '22px', letterSpacing: '0.03em' }}>{claim.insured}</div>
          <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap', marginTop: '6px', color: 'var(--muted)', fontSize: '12px' }}>
            <span><strong style={{ color: 'var(--white)' }}>Claim #</strong> {claim.number}</span>
            <span><strong style={{ color: 'var(--white)' }}>Client</strong> {claim.client}</span>
            <span><strong style={{ color: 'var(--white)' }}>Type</strong> {claim.type}</span>
            <span><strong style={{ color: 'var(--white)' }}>DOL</strong> {claim.dateOfLoss.slice(0, 10)}</span>
            <span><strong style={{ color: 'var(--white)' }}>Adjuster</strong> {claim.adjuster}</span>
            <span><strong style={{ color: 'var(--white)' }}>Examiner</strong> {claim.examiner}</span>
            <span><strong style={{ color: 'var(--white)' }}>Due</strong> {claim.dueDate.slice(0, 10)}</span>
          </div>
        </div>
        <div style={{ display: 'flex', gap: '8px', alignItems: 'flex-start' }}>
          <Badge tone="orange" large>{status.replace('_', ' ')}</Badge>
          {role !== 'carrier' ? (
            <select
              value={status}
              onChange={(event) => {
                const nextStatus = event.target.value as ClaimStatus;

                setStatus(nextStatus);
                startTransition(async () => {
                  const response = await fetch(`/api/claims/${claim.id}/status`, {
                    method: 'PATCH',
                    headers: {
                      'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({ status: nextStatus }),
                  });

                  if (!response.ok) {
                    setStatus(claim.status);
                    return;
                  }

                  router.refresh();
                });
              }}
              disabled={isPending}
              style={{
                background: 'var(--card)',
                border: '1px solid var(--border)',
                borderRadius: 'var(--radius-md)',
                padding: '7px 10px',
                color: 'var(--white)',
                fontFamily: 'Barlow, sans-serif',
                fontSize: '13px',
              }}
            >
              {statusOptions.map((option) => (
                <option key={option} value={option}>
                  {option.replaceAll('_', ' ')}
                </option>
              ))}
            </select>
          ) : null}
          {['firm_admin', 'dispatcher', 'super_admin'].includes(role) ? (
            <Button size="sm" variant="ghost" onClick={() => setAssignOpen(true)}>
              Assign Adjuster
            </Button>
          ) : null}
          {canApproveClaims(role) ? <Button size="sm">Approve Report</Button> : null}
          <Button variant="ghost" size="sm">Request Changes</Button>
          <Button variant="ghost" size="sm">···</Button>
        </div>
      </div>
      <AssignAdjusterModal
        open={assignOpen}
        onClose={() => setAssignOpen(false)}
        claimId={claim.id}
        adjusters={adjusters ?? []}
        onAssigned={() => router.refresh()}
      />
    </div>
  );
}
