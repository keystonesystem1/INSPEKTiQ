import Link from 'next/link';
import { Card } from '@/components/ui/Card';
import { StatCard } from '@/components/ui/StatCard';
import { Button } from '@/components/ui/Button';
import { buildDashboardData, demoAdjusters, demoClaims } from '@/lib/utils/demo-data';

export function DashboardDispatcher() {
  const data = buildDashboardData('dispatcher');

  return (
    <div style={{ display: 'grid', gap: '24px' }}>
      <div>
        <h1 style={{ margin: 0, fontFamily: 'Barlow Condensed, sans-serif', fontWeight: 800, fontSize: '26px' }}>{data.greeting}</h1>
        <p style={{ margin: '6px 0 0', color: 'var(--muted)' }}>{data.subtitle}</p>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0, 1fr))', gap: '12px' }}>
        {data.stats.map((stat) => <StatCard key={stat.id} label={stat.label} value={stat.value} accent={stat.accent} />)}
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
        <Card>
          <div style={{ fontFamily: 'Barlow Condensed, sans-serif', fontWeight: 700, fontSize: '11px', letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--muted)', marginBottom: '14px' }}>Unassigned Claims</div>
          {demoClaims.map((claim) => (
            <div key={claim.id} style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 0', borderBottom: '1px solid var(--border)' }}>
              <div>
                <div>{claim.insured}</div>
                <div style={{ color: 'var(--muted)', fontSize: '11px' }}>{claim.category} · {claim.city}</div>
              </div>
              <Link href="/dispatch"><Button size="sm">Assign</Button></Link>
            </div>
          ))}
        </Card>
        <Card>
          <div style={{ fontFamily: 'Barlow Condensed, sans-serif', fontWeight: 700, fontSize: '11px', letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--muted)', marginBottom: '14px' }}>Adjuster Availability</div>
          {demoAdjusters.map((adjuster) => (
            <div key={adjuster.id} style={{ padding: '10px 0', borderBottom: '1px solid var(--border)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span>{adjuster.name}</span>
                <span style={{ color: 'var(--sage)' }}>{adjuster.status}</span>
              </div>
              <div style={{ color: 'var(--muted)', fontSize: '11px' }}>{adjuster.location} · {adjuster.certifications.join(' · ')}</div>
            </div>
          ))}
        </Card>
      </div>
    </div>
  );
}
