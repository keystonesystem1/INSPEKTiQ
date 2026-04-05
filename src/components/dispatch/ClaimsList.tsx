'use client';

import type { Claim } from '@/lib/types';
import { Badge } from '@/components/ui/Badge';

export function ClaimsList({
  claims,
  selectedClaimIds,
  onToggle,
  dimmedClaimIds,
}: {
  claims: Claim[];
  selectedClaimIds: string[];
  onToggle: (claimId: string) => void;
  dimmedClaimIds: string[];
}) {
  if (claims.length === 0) {
    return (
      <div style={{ padding: '24px 16px', color: 'var(--muted)', fontSize: '13px' }}>No unassigned claims.</div>
    );
  }

  return (
    <div style={{ flex: 1, overflowY: 'auto' }}>
      {claims.map((claim) => (
        <button
          key={claim.id}
          onClick={() => onToggle(claim.id)}
          style={{
            width: '100%',
            textAlign: 'left',
            padding: '11px 14px',
            borderBottom: '1px solid var(--border)',
            background: selectedClaimIds.includes(claim.id) ? 'rgba(91,194,115,0.07)' : 'transparent',
            borderLeft: selectedClaimIds.includes(claim.id) ? '2px solid var(--sage)' : '2px solid transparent',
            opacity: dimmedClaimIds.includes(claim.id) ? 0.28 : 1,
            cursor: 'pointer',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
            <strong>{claim.insured}</strong>
            <Badge tone={claim.slaHoursRemaining < 0 ? 'red' : claim.slaHoursRemaining < 48 ? 'orange' : 'sage'}>
              {claim.slaHoursRemaining < 0 ? 'Overdue' : claim.slaHoursRemaining < 48 ? 'At Risk' : 'OK'}
            </Badge>
          </div>
          <div style={{ color: 'var(--muted)', fontSize: '11px', lineHeight: 1.5 }}>{claim.address}</div>
          <div style={{ display: 'flex', gap: '4px', marginTop: '5px' }}>
            <Badge tone="faint">{claim.category}</Badge>
            <Badge tone="bronze">{claim.type}</Badge>
          </div>
        </button>
      ))}
    </div>
  );
}
