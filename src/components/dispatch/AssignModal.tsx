'use client';

import { useState } from 'react';
import type { Claim } from '@/lib/types';
import type { DispatchAdjuster } from '@/lib/supabase/adjusters';
import { Modal } from '@/components/ui/Modal';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';

export function AssignModal({
  open,
  onClose,
  selectedClaimIds,
  claims,
  adjusters,
  onAssigned,
}: {
  open: boolean;
  onClose: () => void;
  selectedClaimIds: string[];
  claims: Claim[];
  adjusters: DispatchAdjuster[];
  onAssigned: () => void;
}) {
  const [selectedAdjuster, setSelectedAdjuster] = useState<string | null>(null);
  const [assigning, setAssigning] = useState(false);

  const selectedClaims = claims.filter((claim) => selectedClaimIds.includes(claim.id));

  async function handleAssign() {
    if (!selectedAdjuster || selectedClaims.length === 0) return;
    setAssigning(true);

    try {
      const results = await Promise.all(
        selectedClaims.map((claim) =>
          fetch(`/api/claims/${claim.id}/assign`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ assignedUserId: selectedAdjuster }),
          }),
        ),
      );

      const allOk = results.every((res) => res.ok);
      if (allOk) {
        setSelectedAdjuster(null);
        onAssigned();
      }
    } finally {
      setAssigning(false);
    }
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Assign Selected Claims"
      subtitle={`${selectedClaims.length} claim${selectedClaims.length !== 1 ? 's' : ''} selected — choose an adjuster.`}
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>Cancel</Button>
          <Button disabled={!selectedAdjuster || assigning} onClick={handleAssign}>
            {assigning ? 'Assigning...' : 'Confirm Assignment'}
          </Button>
        </>
      }
    >
      <div style={{ marginBottom: '14px' }}>
        <div style={{ marginBottom: '8px', fontFamily: 'Barlow Condensed, sans-serif', fontWeight: 700, fontSize: '10px', letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--muted)' }}>Selected Claims</div>
        {selectedClaims.length === 0 ? (
          <div style={{ color: 'var(--muted)', fontSize: '13px' }}>No claims selected.</div>
        ) : (
          selectedClaims.map((claim) => (
            <div key={claim.id} style={{ display: 'flex', gap: '10px', padding: '7px 10px', background: 'var(--card)', borderRadius: '5px', marginBottom: '4px' }}>
              <div style={{ width: '14px', height: '14px', borderRadius: '3px', background: 'var(--sage)', display: 'grid', placeItems: 'center', color: '#06120C', fontSize: '8px' }}>✓</div>
              <div style={{ flex: 1 }}>{claim.insured}</div>
              <Badge tone="faint">{claim.category}</Badge>
            </div>
          ))
        )}
      </div>
      <div style={{ marginBottom: '8px', fontFamily: 'Barlow Condensed, sans-serif', fontWeight: 700, fontSize: '10px', letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--muted)' }}>Choose Adjuster</div>
      {adjusters.length === 0 ? (
        <div style={{ color: 'var(--muted)', fontSize: '13px' }}>No adjusters available.</div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
          {adjusters.map((adjuster) => (
            <button
              key={adjuster.id}
              onClick={() => setSelectedAdjuster(adjuster.userId)}
              style={{
                border: selectedAdjuster === adjuster.userId ? '2px solid var(--sage)' : '1px solid var(--border)',
                borderRadius: '8px',
                padding: '12px',
                background: selectedAdjuster === adjuster.userId ? 'var(--sage-dim)' : 'transparent',
                cursor: 'pointer',
                textAlign: 'left',
              }}
            >
              <div style={{ fontWeight: 500 }}>{adjuster.email}</div>
              <div style={{ fontSize: '11px', color: 'var(--muted)', marginTop: '3px' }}>{adjuster.activeClaims} active claim{adjuster.activeClaims !== 1 ? 's' : ''}</div>
            </button>
          ))}
        </div>
      )}
    </Modal>
  );
}
