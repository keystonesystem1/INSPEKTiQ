'use client';

import { useRouter } from 'next/navigation';
import type { Claim, Role } from '@/lib/types';
import { Badge } from '@/components/ui/Badge';

function toneForStatus(status: Claim['status']) {
  if (status === 'approved' || status === 'closed') return 'sage';
  if (status === 'in_review' || status === 'scheduled') return 'orange';
  if (status === 'received' || status === 'on_hold') return 'red';
  return 'blue';
}

export function ClaimRow({ claim, role }: { claim: Claim; role: Role }) {
  const router = useRouter();

  return (
    <tr style={{ borderBottom: '1px solid var(--border)', cursor: 'pointer' }} onClick={() => router.push(`/claims/${claim.id}`)}>
      <td style={{ padding: '12px 14px', color: 'var(--sage)', fontFamily: 'Barlow Condensed, sans-serif', fontWeight: 700 }}>{claim.number}</td>
      <td style={{ padding: '12px 14px' }}>{claim.insured}</td>
      <td style={{ padding: '12px 14px' }}>{claim.client}</td>
      <td style={{ padding: '12px 14px' }}>{claim.type}</td>
      <td style={{ padding: '12px 14px' }}>{claim.dateOfLoss.slice(0, 10)}</td>
      {role !== 'adjuster' ? <td style={{ padding: '12px 14px' }}>{claim.adjuster ?? 'Unassigned'}</td> : null}
      <td style={{ padding: '12px 14px', color: claim.slaHoursRemaining < 0 ? 'var(--red)' : claim.slaHoursRemaining <= 48 ? 'var(--orange)' : 'var(--white)' }}>{claim.dueDate.slice(0, 10)}</td>
      <td style={{ padding: '12px 14px' }}><Badge tone={toneForStatus(claim.status)}>{claim.status.replace('_', ' ')}</Badge></td>
    </tr>
  );
}
