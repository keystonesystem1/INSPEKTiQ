import { Card } from '@/components/ui/Card';
import { StatCard } from '@/components/ui/StatCard';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { buildDashboardData, demoClaims } from '@/lib/utils/demo-data';

export function DashboardAdjuster() {
  const data = buildDashboardData('adjuster');

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
        <div style={{ fontFamily: 'Barlow Condensed, sans-serif', fontWeight: 700, fontSize: '11px', letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--muted)', marginBottom: '14px' }}>Active Claims</div>
        {demoClaims.map((claim, index) => (
          <div key={claim.id} style={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: '12px', padding: '12px 0', borderBottom: '1px solid var(--border)' }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span>{claim.insured}</span>
                <Badge tone={claim.slaHoursRemaining < 0 ? 'red' : 'orange'}>{claim.slaHoursRemaining < 0 ? 'Overdue' : 'At risk'}</Badge>
              </div>
              <div style={{ color: 'var(--muted)', fontSize: '11px' }}>Appointment 9:00 AM · {claim.address}</div>
            </div>
            <div style={{ display: 'flex', gap: '8px' }}>
              {index === 0 ? <Button size="sm">Accept</Button> : null}
              <Button variant="ghost" size="sm">Open</Button>
            </div>
          </div>
        ))}
      </Card>
    </div>
  );
}
