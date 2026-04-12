import Link from 'next/link';
import { Card } from '@/components/ui/Card';
import { StatCard } from '@/components/ui/StatCard';
import { Button } from '@/components/ui/Button';
import type { Claim } from '@/lib/types';

export function DashboardAdmin({
  name,
  firmName,
  stats,
  claims,
}: {
  name: string;
  firmName: string;
  stats: {
    active: number;
    unassigned: number;
    newToday: number;
    slaAtRisk: number;
  };
  claims: Claim[];
}) {
  const greetingName = name.charAt(0).toUpperCase() + name.slice(1);
  const unassignedClaims = claims.filter((claim) => claim.status === 'received');
  const subtitleDate = new Intl.DateTimeFormat('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  }).format(new Date());
  const liveStats = [
    { id: '1', label: 'Active Claims', value: String(stats.active), accent: 'var(--blue)' },
    { id: '2', label: 'SLA At-Risk', value: String(stats.slaAtRisk), accent: 'var(--orange)' },
    { id: '3', label: 'Unassigned', value: String(stats.unassigned), accent: 'var(--orange)' },
    { id: '4', label: 'New Today', value: String(stats.newToday), accent: 'var(--sage)' },
  ];

  return (
    <div style={{ display: 'grid', gap: '24px' }}>
      <div>
        <h1 style={{ margin: 0, fontFamily: 'Barlow Condensed, sans-serif', fontWeight: 800, fontSize: '26px', letterSpacing: '0.04em' }}>
          {`Good morning, ${greetingName}.`}
        </h1>
        <p style={{ margin: '6px 0 0', color: 'var(--muted)' }}>{`Today, ${subtitleDate} · ${firmName} · Your daily brief is ready.`}</p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, minmax(0, 1fr))', gap: '12px' }}>
        {liveStats.map((stat) => (
          <StatCard key={stat.id} label={stat.label} value={stat.value} accent={stat.accent} />
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1.15fr 0.85fr', gap: '16px' }}>
        <div style={{ display: 'grid', gap: '16px' }}>
          <Card>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '14px' }}>
              <div style={{ fontFamily: 'Barlow Condensed, sans-serif', fontWeight: 700, fontSize: '12px', letterSpacing: '0.14em', textTransform: 'uppercase', color: 'var(--muted)' }}>SLA Alerts</div>
            </div>
            <div style={{ color: 'var(--muted)', fontSize: '13px' }}>No SLA alerts at this time.</div>
          </Card>

          <Card>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '14px' }}>
              <div style={{ fontFamily: 'Barlow Condensed, sans-serif', fontWeight: 700, fontSize: '12px', letterSpacing: '0.14em', textTransform: 'uppercase', color: 'var(--muted)' }}>Unassigned Claims</div>
            </div>
            {unassignedClaims.length ? unassignedClaims.map((claim) => (
              <div key={claim.id} style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 0', borderBottom: '1px solid var(--border)' }}>
                <div>
                  <div style={{ fontWeight: 500 }}>{claim.number}</div>
                  <div style={{ color: 'var(--muted)', fontSize: '11px' }}>{claim.address || 'Address unavailable'}</div>
                </div>
                <Link href={`/claims/${claim.id}`}>
                  <Button variant="ghost" size="sm">Assign</Button>
                </Link>
              </div>
            )) : (
              <div style={{ color: 'var(--muted)', fontSize: '13px' }}>No unassigned claims.</div>
            )}
          </Card>
        </div>

        <div style={{ display: 'grid', gap: '16px' }}>
          <Card>
            <div style={{ fontFamily: 'Barlow Condensed, sans-serif', fontWeight: 700, fontSize: '12px', letterSpacing: '0.14em', textTransform: 'uppercase', color: 'var(--muted)', marginBottom: '14px' }}>Today&apos;s Activity</div>
            <div style={{ color: 'var(--muted)', fontSize: '13px' }}>No recent activity.</div>
          </Card>

        </div>
      </div>
    </div>
  );
}
