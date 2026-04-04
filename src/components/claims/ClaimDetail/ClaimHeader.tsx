'use client';

import { useState, useTransition } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/Button';
import type { Claim, ClaimStatus, Role } from '@/lib/types';
import type { AdjusterOption } from '@/lib/supabase/adjusters';
import { canApproveClaims } from '@/lib/utils/roles';
import { AssignAdjusterModal } from '@/components/claims/ClaimDetail/AssignAdjusterModal';

const statusOptions: ClaimStatus[] = [
  'received',
  'assigned',
  'accepted',
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

  const updateStatus = (nextStatus: ClaimStatus) => {
    const previousStatus = status;

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
        setStatus(previousStatus);
        return;
      }

      router.refresh();
    });
  };

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
          {role !== 'carrier' ? (
            <select
              value={status}
              onChange={(event) => updateStatus(event.target.value as ClaimStatus)}
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
            <Button size="sm" variant="ghost" onClick={() => setAssignOpen(true)} disabled={isPending}>
              Assign Adjuster
            </Button>
          ) : null}
          {role === 'adjuster' && status === 'assigned' ? (
            <Button size="sm" onClick={() => updateStatus('accepted')} disabled={isPending}>
              Accept Claim
            </Button>
          ) : null}
          {canApproveClaims(role) ? (
            <Button size="sm" onClick={() => updateStatus('approved')} disabled={isPending || status === 'approved'}>
              Approve Report
            </Button>
          ) : null}
          {status === 'approved' ? (
            <Button size="sm" variant="ghost" onClick={() => updateStatus('submitted')} disabled={isPending}>
              Submit to Carrier
            </Button>
          ) : null}
          <Button variant="ghost" size="sm" disabled={isPending}>Request Changes</Button>
          <Button variant="ghost" size="sm" disabled={isPending}>···</Button>
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
