'use client';

import { demoClaims } from '@/lib/utils/demo-data';
import { Badge } from '@/components/ui/Badge';

export function ClaimsList({
  selectedClaimId,
  onSelect,
  dimmedClaimIds,
}: {
  selectedClaimId?: string;
  onSelect: (claimId: string) => void;
  dimmedClaimIds: string[];
}) {
  return (
    <div style={{ flex: 1, overflowY: 'auto' }}>
      {demoClaims.map((claim) => (
        <button
          key={claim.id}
          onClick={() => onSelect(claim.id)}
          style={{
            width: '100%',
            textAlign: 'left',
            padding: '11px 14px',
            borderBottom: '1px solid var(--border)',
            background: selectedClaimId === claim.id ? 'rgba(91,194,115,0.07)' : 'transparent',
            borderLeft: selectedClaimId === claim.id ? '2px solid var(--sage)' : '2px solid transparent',
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
