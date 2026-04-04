import Link from 'next/link';
import { Card } from '@/components/ui/Card';
import { StatCard } from '@/components/ui/StatCard';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { buildDashboardData, demoAdjusters, demoClaims } from '@/lib/utils/demo-data';

export function DashboardAdmin() {
  const data = buildDashboardData('firm_admin');

  return (
    <div style={{ display: 'grid', gap: '24px' }}>
      <div>
        <h1 style={{ margin: 0, fontFamily: 'Barlow Condensed, sans-serif', fontWeight: 800, fontSize: '26px', letterSpacing: '0.04em' }}>
          {data.greeting}
        </h1>
        <p style={{ margin: '6px 0 0', color: 'var(--muted)' }}>{data.subtitle}</p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, minmax(0, 1fr))', gap: '12px' }}>
        {data.stats.map((stat) => (
          <StatCard key={stat.id} label={stat.label} value={stat.value} accent={stat.accent} />
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1.15fr 0.85fr', gap: '16px' }}>
        <div style={{ display: 'grid', gap: '16px' }}>
          <Card>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '14px' }}>
              <div style={{ fontFamily: 'Barlow Condensed, sans-serif', fontWeight: 700, fontSize: '11px', letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--muted)' }}>SLA Alerts</div>
              <Badge tone="orange">12 at risk</Badge>
            </div>
            {demoClaims.slice(0, 2).map((claim) => (
              <div key={claim.id} style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 0', borderBottom: '1px solid var(--border)' }}>
                <div>
                  <div style={{ fontWeight: 500 }}>{claim.insured}</div>
                  <div style={{ color: 'var(--muted)', fontSize: '11px' }}>{claim.number} · {claim.client}</div>
                </div>
                <Badge tone={claim.slaHoursRemaining < 0 ? 'red' : 'orange'}>
                  {claim.slaHoursRemaining < 0 ? 'Overdue' : `${claim.slaHoursRemaining}h left`}
                </Badge>
              </div>
            ))}
          </Card>

          <Card>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '14px' }}>
              <div style={{ fontFamily: 'Barlow Condensed, sans-serif', fontWeight: 700, fontSize: '11px', letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--muted)' }}>Unassigned Claims</div>
              <Link href="/dispatch">
                <Button size="sm">Open Dispatch</Button>
              </Link>
            </div>
            {demoClaims.map((claim) => (
              <div key={claim.id} style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 0', borderBottom: '1px solid var(--border)' }}>
                <div>
                  <div style={{ fontWeight: 500 }}>{claim.insured}</div>
                  <div style={{ color: 'var(--muted)', fontSize: '11px' }}>{claim.address}</div>
                </div>
                <Link href="/dispatch">
                  <Button variant="ghost" size="sm">Assign</Button>
                </Link>
              </div>
            ))}
          </Card>
        </div>

        <div style={{ display: 'grid', gap: '16px' }}>
          <Card>
            <div style={{ fontFamily: 'Barlow Condensed, sans-serif', fontWeight: 700, fontSize: '11px', letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--muted)', marginBottom: '14px' }}>Today&apos;s Activity</div>
            {data.activity.map((item) => (
              <div key={item.id} style={{ display: 'flex', gap: '12px', padding: '10px 0', borderBottom: '1px solid var(--border)' }}>
                <span style={{ width: '7px', height: '7px', borderRadius: '50%', marginTop: '6px', background: `var(--${item.tone})` }} />
                <div style={{ flex: 1 }}>
                  <div>{item.text}</div>
                  <div style={{ color: 'var(--muted)', fontSize: '11px' }}>{item.meta}</div>
                </div>
                <div style={{ fontSize: '11px', color: 'var(--faint)' }}>{item.time}</div>
              </div>
            ))}
          </Card>

          <Card>
            <div style={{ fontFamily: 'Barlow Condensed, sans-serif', fontWeight: 700, fontSize: '11px', letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--muted)', marginBottom: '14px' }}>Adjuster Workload</div>
            {demoAdjusters.map((adjuster) => (
              <div key={adjuster.id} style={{ padding: '10px 0', borderBottom: '1px solid var(--border)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <strong>{adjuster.name}</strong>
                  <span style={{ color: 'var(--muted)' }}>{adjuster.activeClaims}/{adjuster.maxClaims}</span>
                </div>
                <div style={{ marginTop: '8px', height: '4px', borderRadius: '999px', background: 'var(--border)' }}>
                  <div style={{ width: `${(adjuster.activeClaims / adjuster.maxClaims) * 100}%`, height: '100%', borderRadius: '999px', background: 'var(--sage)' }} />
                </div>
              </div>
            ))}
          </Card>
        </div>
      </div>
    </div>
  );
}
