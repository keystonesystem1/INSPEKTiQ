'use client';

import { useRouter } from 'next/navigation';
import type { Claim, Role } from '@/lib/types';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';

function toneForStatus(status: Claim['status']) {
  if (status === 'approved' || status === 'closed') return 'sage';
  if (status === 'in_review' || status === 'scheduled') return 'orange';
  if (status === 'received' || status === 'on_hold') return 'red';
  return 'blue';
}

export function ClaimRow({
  claim,
  role,
  archivedView = false,
  onRestore,
}: {
  claim: Claim;
  role: Role;
  archivedView?: boolean;
  onRestore?: (claimId: string) => Promise<void>;
}) {
  const router = useRouter();
  const canRestore = archivedView && ['firm_admin', 'super_admin'].includes(role);

  return (
    <tr
      style={{ borderBottom: '1px solid var(--border)', cursor: archivedView ? 'default' : 'pointer', opacity: archivedView ? 0.82 : 1 }}
      onClick={() => {
        if (!archivedView) {
          router.push(`/claims/${claim.id}`);
        }
      }}
    >
      <td style={{ padding: '12px 14px', color: 'var(--sage)', fontFamily: 'Barlow Condensed, sans-serif', fontWeight: 700 }}>{claim.number}</td>
      <td style={{ padding: '12px 14px' }}>{claim.insured}</td>
      <td style={{ padding: '12px 14px' }}>{claim.client}</td>
      <td style={{ padding: '12px 14px' }}>{claim.type}</td>
      <td style={{ padding: '12px 14px' }}>{claim.dateOfLoss.slice(0, 10)}</td>
      {role !== 'adjuster' ? <td style={{ padding: '12px 14px' }}>{claim.adjuster ?? 'Unassigned'}</td> : null}
      <td style={{ padding: '12px 14px', color: claim.slaHoursRemaining < 0 ? 'var(--red)' : claim.slaHoursRemaining <= 48 ? 'var(--orange)' : 'var(--white)' }}>{claim.dueDate.slice(0, 10)}</td>
      <td style={{ padding: '12px 14px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Badge tone={toneForStatus(claim.status)}>{claim.status.replace('_', ' ')}</Badge>
          {claim.isArchived ? <Badge tone="faint">Archived</Badge> : null}
          {canRestore ? (
            <Button
              size="sm"
              variant="ghost"
              onClick={() => {
                void onRestore?.(claim.id);
              }}
            >
              Restore
            </Button>
          ) : null}
        </div>
      </td>
    </tr>
  );
}
