import { Badge } from '@/components/ui/Badge';
import { Card } from '@/components/ui/Card';
import { StatCard } from '@/components/ui/StatCard';
import type { Claim, ClaimStatus } from '@/lib/types';

const ACTIVE_STATUSES = new Set<ClaimStatus>([
  'received',
  'assigned',
  'accepted',
  'contacted',
  'scheduled',
  'inspected',
  'in_review',
  'approved',
  'pending_te',
  'on_hold',
]);

export function DashboardCarrierDeskAdjuster({ claims }: { claims: Claim[] }) {
  const active = claims.filter((claim) => ACTIVE_STATUSES.has(claim.status));
  const closed = claims.filter((claim) => claim.status === 'closed' || claim.status === 'submitted');
  const inReview = claims.filter((claim) => claim.status === 'in_review').length;

  return (
    <div style={{ display: 'grid', gap: '24px' }}>
      <div>
        <h1 style={{ margin: 0, fontFamily: 'Barlow Condensed, sans-serif', fontWeight: 800, fontSize: '26px' }}>My Claims</h1>
        <p style={{ margin: '6px 0 0', color: 'var(--muted)' }}>Carrier desk adjuster — claims assigned to you.</p>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0, 1fr))', gap: '12px' }}>
        <StatCard label="Active" value={String(active.length)} accent="var(--blue)" />
        <StatCard label="In Review" value={String(inReview)} accent="var(--orange)" />
        <StatCard label="Closed / Submitted" value={String(closed.length)} accent="var(--sage)" />
      </div>
      <Card>
        <div style={{ fontFamily: 'Barlow Condensed, sans-serif', fontWeight: 700, fontSize: '11px', letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--muted)', marginBottom: '14px' }}>Active Claims</div>
        {active.length === 0 ? (
          <div style={{ padding: '24px 0', textAlign: 'center', color: 'var(--muted)' }}>No active claims assigned.</div>
        ) : (
          <div style={{ display: 'grid', gap: '8px' }}>
            {active.slice(0, 8).map((claim) => (
              <div
                key={claim.id}
                style={{
                  display: 'grid',
                  gridTemplateColumns: '1fr auto',
                  gap: '12px',
                  padding: '10px 12px',
                  background: 'var(--card)',
                  border: '1px solid var(--border)',
                  borderRadius: 'var(--radius-md)',
                }}
              >
                <div>
                  <div style={{ fontSize: '13px', color: 'var(--white)' }}>{claim.insured}</div>
                  <div style={{ fontSize: '11px', color: 'var(--muted)' }}>{claim.number} · {claim.address}</div>
                </div>
                <Badge tone="blue">{claim.status.replace(/_/g, ' ')}</Badge>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}
