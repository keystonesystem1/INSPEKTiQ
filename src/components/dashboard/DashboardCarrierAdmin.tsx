import { Badge } from '@/components/ui/Badge';
import { Card } from '@/components/ui/Card';
import { StatCard } from '@/components/ui/StatCard';
import type { Claim } from '@/lib/types';

const ACTIVE_STATUSES = new Set([
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

export function DashboardCarrierAdmin({ claims, carrierName }: { claims: Claim[]; carrierName: string }) {
  const activeCount = claims.filter((claim) => ACTIVE_STATUSES.has(claim.status)).length;
  const recent = [...claims].slice(0, 5);

  return (
    <div style={{ display: 'grid', gap: '24px' }}>
      <div>
        <h1 style={{ margin: 0, fontFamily: 'Barlow Condensed, sans-serif', fontWeight: 800, fontSize: '26px' }}>{carrierName}</h1>
        <p style={{ margin: '6px 0 0', color: 'var(--muted)' }}>Carrier portal — claims and invoices for your team.</p>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0, 1fr))', gap: '12px' }}>
        <StatCard label="Active Claims" value={String(activeCount)} accent="var(--blue)" />
        <StatCard label="Pending Invoices" value="0" accent="var(--border-hi)" />
        <StatCard label="Total Claims" value={String(claims.length)} accent="var(--sage)" />
      </div>
      <Card>
        <div style={{ fontFamily: 'Barlow Condensed, sans-serif', fontWeight: 700, fontSize: '11px', letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--muted)', marginBottom: '14px' }}>Recent Activity</div>
        {recent.length === 0 ? (
          <div style={{ padding: '24px 0', textAlign: 'center', color: 'var(--muted)' }}>No claims yet.</div>
        ) : (
          <div style={{ display: 'grid', gap: '8px' }}>
            {recent.map((claim) => (
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
