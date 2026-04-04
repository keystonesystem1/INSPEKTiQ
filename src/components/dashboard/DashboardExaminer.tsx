import { Card } from '@/components/ui/Card';
import { StatCard } from '@/components/ui/StatCard';
import { Button } from '@/components/ui/Button';
import { buildDashboardData, demoClaims } from '@/lib/utils/demo-data';

export function DashboardExaminer() {
  const data = buildDashboardData('examiner');

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
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '14px' }}>
          <div style={{ fontFamily: 'Barlow Condensed, sans-serif', fontWeight: 700, fontSize: '11px', letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--muted)' }}>Review Queue</div>
        </div>
        {demoClaims.map((claim) => (
          <div key={claim.id} style={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: '12px', padding: '12px 0', borderBottom: '1px solid var(--border)' }}>
            <div>
              <div style={{ fontWeight: 500 }}>{claim.insured}</div>
              <div style={{ color: 'var(--muted)', fontSize: '11px' }}>{claim.number} · Waiting {Math.abs(claim.slaHoursRemaining)}h</div>
            </div>
            <div style={{ display: 'flex', gap: '8px' }}>
              <Button size="sm">Approve</Button>
              <Button variant="ghost" size="sm">Request Changes</Button>
            </div>
          </div>
        ))}
      </Card>
    </div>
  );
}
