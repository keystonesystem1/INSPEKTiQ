import { Card } from '@/components/ui/Card';
import { StatCard } from '@/components/ui/StatCard';
import { Badge } from '@/components/ui/Badge';
import { buildDashboardData, demoClaims } from '@/lib/utils/demo-data';

export function DashboardCarrier() {
  const data = buildDashboardData('carrier');

  return (
    <div style={{ display: 'grid', gap: '24px' }}>
      <div>
        <h1 style={{ margin: 0, fontFamily: 'Barlow Condensed, sans-serif', fontWeight: 800, fontSize: '26px' }}>{data.greeting}</h1>
        <p style={{ margin: '6px 0 0', color: 'var(--muted)' }}>{data.subtitle}</p>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0, 1fr))', gap: '12px' }}>
        {data.stats.map((stat) => <StatCard key={stat.id} label={stat.label} value={stat.value} accent={stat.accent} />)}
      </div>
      <Card>
        <div style={{ fontFamily: 'Barlow Condensed, sans-serif', fontWeight: 700, fontSize: '11px', letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--muted)', marginBottom: '14px' }}>Claim Status</div>
        {demoClaims.map((claim) => (
          <div key={claim.id} style={{ display: 'flex', justifyContent: 'space-between', padding: '12px 0', borderBottom: '1px solid var(--border)' }}>
            <div>
              <div>{claim.insured}</div>
              <div style={{ color: 'var(--muted)', fontSize: '11px' }}>{claim.number} · {claim.address}</div>
            </div>
            <Badge tone="blue">{claim.status.replace('_', ' ')}</Badge>
          </div>
        ))}
      </Card>
    </div>
  );
}
