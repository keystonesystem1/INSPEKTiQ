import Link from 'next/link';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import type { Claim, Role } from '@/lib/types';
import { canApproveClaims } from '@/lib/utils/roles';

export function ClaimHeader({ claim, role }: { claim: Claim; role: Role }) {
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
          <Badge tone="orange" large>{claim.status.replace('_', ' ')}</Badge>
          {canApproveClaims(role) ? <Button size="sm">Approve Report</Button> : null}
          <Button variant="ghost" size="sm">Request Changes</Button>
          <Button variant="ghost" size="sm">···</Button>
        </div>
      </div>
    </div>
  );
}
